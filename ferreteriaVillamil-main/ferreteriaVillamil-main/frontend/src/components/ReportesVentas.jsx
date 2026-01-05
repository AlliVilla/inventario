import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Row, Col, Typography, Statistic, message } from 'antd';
import { AreaChartOutlined, DollarOutlined, ShoppingCartOutlined, FallOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportesVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [filteredVentas, setFilteredVentas] = useState([]);
    const [articulos, setArticulos] = useState(new Map());
    const [dateRange, setDateRange] = useState(null);
    const [stats, setStats] = useState({
        totalVentas: 0,
        costoTotal: 0,
        utilidadTotal: 0,
        cantidadVentas: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch articles to get cost price
                const articlesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list`);
                const articlesMap = new Map();
                if (articlesRes.data && articlesRes.data.data) {
                    articlesRes.data.data.forEach(a => articlesMap.set(a.id_articulo, a));
                }
                setArticulos(articlesMap);

                // Fetch sales (Ventas)
                const ventasRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/list`);
                if (ventasRes.data) {
                    setVentas(ventasRes.data);
                    setFilteredVentas(ventasRes.data); // Initial filtering (all)
                    calculateStats(ventasRes.data, articlesMap);
                }
            } catch (error) {
                console.error("Error loading report data:", error);
                message.error("Error al cargar datos de reporte");
            }
        };

        fetchData();
    }, []);

    const calculateStats = (ventasData, articlesMap) => {
        let total = 0;
        let costo = 0;

        ventasData.forEach(venta => {
            const totalVenta = parseFloat(venta.total) || 0;
            total += totalVenta;

            // Verificar si Detalle_Ventas existe y es un array
            if (venta.Detalle_Venta && Array.isArray(venta.Detalle_Venta)) {
                venta.Detalle_Venta.forEach(detalle => {
                    // El articulo puede venir anidado si el backend lo incluye
                    // O lo buscamos en el mapa si solo viene el ID
                    let costoUnitario = 0;

                    if (detalle.Articulo) {
                        costoUnitario = parseFloat(detalle.Articulo.costo_unitario) || 0;
                    } else {
                        const articulo = articlesMap.get(detalle.id_articulo);
                        costoUnitario = articulo ? (parseFloat(articulo.costo_unitario) || 0) : 0;
                    }

                    costo += detalle.cantidad * costoUnitario;
                });
            }
        });

        setStats({
            totalVentas: total,
            costoTotal: costo,
            utilidadTotal: total - costo,
            cantidadVentas: ventasData.length
        });
    };

    const handleDateFilter = (dates) => {
        setDateRange(dates);
        if (!dates || dates.length === 0) {
            setFilteredVentas(ventas);
            calculateStats(ventas, articulos);
            return;
        }

        const start = dates[0].startOf('day');
        const end = dates[1].endOf('day');

        const filtered = ventas.filter(venta => {
            const ventaDate = moment(venta.fecha_venta);
            return ventaDate.isBetween(start, end, null, '[]');
        });

        setFilteredVentas(filtered);
        calculateStats(filtered, articulos);
    };

    const columns = [
        {
            title: <span className="font-bold text-[#163269]">ID Venta</span>,
            dataIndex: 'id_venta',
            key: 'id_venta',
            render: (id) => <span className="font-bold text-gray-700">#{id}</span>
        },
        {
            title: <span className="font-bold text-[#163269]">Fecha</span>,
            dataIndex: 'fecha_venta',
            key: 'fecha_venta',
            render: (date) => <span className="text-gray-600">{moment(date).format('DD MMM YYYY, h:mm a')}</span>
        },
        {
            title: <span className="font-bold text-[#163269]">Cliente</span>,
            dataIndex: 'cliente_nombre',
            key: 'cliente_nombre',
            render: (text) => <span className="font-medium text-gray-800">{text}</span>
        },
        {
            title: <span className="font-bold text-[#163269]">Total</span>,
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (val) => <span className="font-bold text-[#163269] text-base">L. {parseFloat(val).toFixed(2)}</span>
        },
        {
            title: <span className="font-bold text-[#163269]">Utilidad (Est.)</span>,
            key: 'utilidad',
            align: 'right',
            render: (_, record) => {
                let costoVenta = 0;
                const detalles = record.Detalle_Venta || record.Detalle_Ventas || [];

                if (detalles.length > 0) {
                    detalles.forEach(d => {
                        let costoU = 0;
                        if (d.Articulo) {
                            costoU = parseFloat(d.Articulo.costo_unitario) || 0;
                        } else {
                            const art = articulos.get(d.id_articulo);
                            costoU = art ? (parseFloat(art.costo_unitario) || 0) : 0;
                        }
                        costoVenta += d.cantidad * costoU;
                    });
                }
                const utilidad = (parseFloat(record.total) || 0) - costoVenta;
                return (
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${utilidad >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        L. {utilidad.toFixed(2)}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-[#163269]">Reportes Financieros</h1>
                    <p className="text-gray-500 mt-1">Analítica de ventas y rendimiento del negocio</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <RangePicker
                        onChange={handleDateFilter}
                        className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm hover:border-[#163269] transition-colors"
                        ranges={{
                            'Hoy': [moment(), moment()],
                            'Esta Semana': [moment().startOf('week'), moment().endOf('week')],
                            'Este Mes': [moment().startOf('month'), moment().endOf('month')],
                        }}
                    />
                </div>
            </div>

            {/* Stats Cards - Colorful & Equal Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Ventas Totales */}
                <div className="bg-[#163269] rounded-xl p-6 shadow-lg text-white flex flex-col justify-between min-h-[160px] transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <DollarOutlined className="text-2xl text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded text-white hidden md:block">Ingresos</span>
                    </div>
                    <div>
                        <p className="text-blue-200 text-sm font-medium mb-1">Ventas Totales</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            L. {stats.totalVentas.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Utilidad */}
                <div className="bg-[#059669] rounded-xl p-6 shadow-lg text-white flex flex-col justify-between min-h-[160px] transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <FallOutlined rotate={180} className="text-2xl text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded text-white hidden md:block">Ganancia</span>
                    </div>
                    <div>
                        <p className="text-green-100 text-sm font-medium mb-1">Utilidad Neta</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            L. {stats.utilidadTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-green-200 mt-1 opacity-80 backdrop-blur-sm">Ingresos - Costos</p>
                    </div>
                </div>

                {/* Costo */}
                <div className="bg-[#DC2626] rounded-xl p-6 shadow-lg text-white flex flex-col justify-between min-h-[160px] transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <AreaChartOutlined className="text-2xl text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded text-white hidden md:block">Gastos</span>
                    </div>
                    <div>
                        <p className="text-red-100 text-sm font-medium mb-1">Costo Mercancía</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            L. {stats.costoTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Transacciones */}
                <div className="bg-[#D97706] rounded-xl p-6 shadow-lg text-white flex flex-col justify-between min-h-[160px] transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <ShoppingCartOutlined className="text-2xl text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded text-white hidden md:block">Volumen</span>
                    </div>
                    <div>
                        <p className="text-orange-100 text-sm font-medium mb-1">N° Transacciones</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            {stats.cantidadVentas}
                        </h3>
                        <p className="text-xs text-orange-200 mt-1 opacity-80 backdrop-blur-sm">Ventas realizadas</p>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-[#1e293b] border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Historial de Transacciones</h2>
                    <span className="text-sm text-gray-300 bg-gray-700 px-3 py-1 rounded-full">Mostrando {filteredVentas.length} registros</span>
                </div>
                <Table
                    dataSource={filteredVentas}
                    columns={columns}
                    rowKey="id_venta"
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: false,
                        itemRender: (page, type, originalElement) => {
                            if (type === 'prev') return <a className="text-[#163269] hover:bg-gray-100 px-2 py-1 rounded">Anterior</a>;
                            if (type === 'next') return <a className="text-[#163269] hover:bg-gray-100 px-2 py-1 rounded">Siguiente</a>;
                            return originalElement;
                        }
                    }}
                    className="report-table"
                    expandable={{
                        expandedRowRender: record => (
                            <div className="bg-gray-50 p-4 rounded-lg mx-4 my-2 border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Detalles de la compra</h4>
                                <Table
                                    dataSource={record.Detalle_Venta || []}
                                    rowKey="id_detalle_venta"
                                    pagination={false}
                                    size="small"
                                    bordered={false}
                                    columns={[
                                        {
                                            title: 'Producto',
                                            key: 'prod',
                                            render: (_, r) => {
                                                const nombre = r.Articulo ? r.Articulo.nombre : (articulos.get(r.id_articulo)?.nombre || 'Desconocido');
                                                return <span className="font-medium text-gray-700">{nombre}</span>
                                            }
                                        },
                                        { title: 'Cantidad', dataIndex: 'cantidad', align: 'center' },
                                        { title: 'Precio Unit.', dataIndex: 'precio_unitario', align: 'right', render: v => `L. ${parseFloat(v).toFixed(2)}` },
                                        { title: 'Subtotal', dataIndex: 'subtotal', align: 'right', render: v => <span className="font-semibold text-[#163269]">L. {parseFloat(v).toFixed(2)}</span> }
                                    ]}
                                />
                            </div>
                        ),
                        expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? (
                                <FallOutlined rotate={180} onClick={e => onExpand(record, e)} className="text-[#163269] cursor-pointer" />
                            ) : (
                                <FallOutlined rotate={0} onClick={e => onExpand(record, e)} className="text-gray-400 cursor-pointer hover:text-[#163269]" />
                            )
                    }}
                />
            </div>
        </div>
    );
};

export default ReportesVentas;
