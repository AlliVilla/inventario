import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Row, Col, Typography, Statistic, message, Tag, Popconfirm, Button } from 'antd';
import { AreaChartOutlined, DollarOutlined, ShoppingCartOutlined, FallOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportesVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [filteredVentas, setFilteredVentas] = useState([]);
    const [articulos, setArticulos] = useState(new Map());
    const [dateRange, setDateRange] = useState([moment().startOf('day'), moment().endOf('day')]);
    const [stats, setStats] = useState({
        totalVentas: 0,
        costoTotal: 0,
        utilidadTotal: 0,
        cantidadVentas: 0,
        valorInventarioActual: 0,
        unidadesInventario: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch articles to get cost price (for calculating per-sale costs)
            const articlesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list`);
            const articlesMap = new Map();

            if (articlesRes.data && articlesRes.data.data) {
                articlesRes.data.data.forEach(a => {
                    articlesMap.set(String(a.id_articulo), a);
                });
            }
            setArticulos(articlesMap);

            // Fetch inventory stats (aggregate data without limits)
            const statsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/stats`);
            const invStats = statsRes.data?.data || {};
            const invValue = invStats.valorInventario || 0;
            const invUnits = invStats.unidadesTotales || 0;

            // Fetch sales (Ventas)
            const ventasRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/list`);
            const ventasData = (ventasRes.data || []).map(v => ({
                ...v,
                tipo_transaccion: 'Venta',
                id_unico: `V-${v.id_venta}`,
                fecha_normalizada: v.fecha_venta,
                detalles_normalizados: v.Detalle_Venta || v.Detalle_Ventas || v.detalles || []
            }));

            // Fetch orders (Pedidos)
            const pedidosRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedidos/getAllPedidos`);
            const pedidosData = (pedidosRes.data?.data || []).map(p => ({
                ...p,
                tipo_transaccion: 'Pedido',
                id_unico: `P-${p.id_pedido}`,
                fecha_normalizada: p.fecha_creacion,
                detalles_normalizados: p.Detalle_Pedidos || p.Detalle_Pedido || p.detalles || [],
                es_pedido: true
            }));

            const combinedData = [...ventasData, ...pedidosData].sort((a, b) =>
                moment(b.fecha_normalizada).valueOf() - moment(a.fecha_normalizada).valueOf()
            );

            setVentas(combinedData);

            const startRange = dateRange[0].startOf('day');
            const endRange = dateRange[1].endOf('day');

            const filtered = combinedData.filter(item => {
                if (!item.fecha_normalizada) return false;
                const vDate = moment(item.fecha_normalizada);
                return vDate.isBetween(startRange, endRange, null, '[]');
            });

            setFilteredVentas(filtered);
            setFilteredVentas(filtered);
            calculateStats(filtered, articlesMap, { valorInventarioActual: invValue, unidadesInventario: invUnits });

            if (filtered.length === 0 && combinedData.length > 0) {
                message.info("No hay transacciones registradas en el rango seleccionado.");
            }
        } catch (error) {
            console.error("Error loading report data:", error);
            message.error("Error al cargar datos de reporte");
        }
    };

    const calculateStats = (data, articlesMap, invStats = null) => {
        let totalIngresos = 0;
        let costoMercancia = 0;
        let totalEnvios = 0;

        data.forEach(item => {
            if (item.estado === 'Cancelada' || item.estado === 'Cancelado') return;

            const totalItem = parseFloat(item.total) || 0;
            const envioItem = parseFloat(item.costo_envio || item.envio || 0);

            totalIngresos += totalItem;
            totalEnvios += envioItem;

            const detalles = item.detalles_normalizados || [];
            if (Array.isArray(detalles)) {
                detalles.forEach(detalle => {
                    let costoUnitario = 0;
                    const artData = detalle.Articulo || detalle.articulo;

                    if (artData && (artData.costo_unitario !== undefined && artData.costo_unitario !== null)) {
                        costoUnitario = parseFloat(artData.costo_unitario) || 0;
                    } else {
                        const idArt = detalle.id_articulo || detalle.idArticulo;
                        const articuloFromMap = idArt ? articlesMap.get(String(idArt)) : null;
                        costoUnitario = articuloFromMap ? (parseFloat(articuloFromMap.costo_unitario) || 0) : 0;
                    }

                    const cantidad = parseFloat(detalle.cantidad) || 0;
                    costoMercancia += (cantidad * costoUnitario);
                });
            }
        });

        setStats({
            totalVentas: totalIngresos,
            costoTotal: costoMercancia,
            utilidadTotal: (totalIngresos - totalEnvios) - costoMercancia,
            cantidadVentas: data.filter(v => v.estado !== 'Cancelada' && v.estado !== 'Cancelado').length,
            // Use passed invStats or fallback to current state to preserve values during filtering
            valorInventarioActual: invStats ? invStats.valorInventarioActual : stats.valorInventarioActual,
            unidadesInventario: invStats ? invStats.unidadesInventario : stats.unidadesInventario
        });
    };

    const handleCancelVenta = async (id_venta) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/cancel/${id_venta}`);
            message.success("Venta cancelada y stock devuelto exitosamente");
            fetchData(); // Recargar datos
        } catch (error) {
            console.error("Error al cancelar venta:", error);
            message.error(error.response?.data?.message || "Error al cancelar la venta");
        }
    };

    const handleDateFilter = (dates) => {
        setDateRange(dates);
        if (!dates) {
            setFilteredVentas(ventas);
            calculateStats(ventas, articulos);
            return;
        }

        const start = moment(dates[0]).startOf('day');
        const end = moment(dates[1]).endOf('day');

        console.log("Rango Filtro:", start.format(), "a", end.format());

        const filtered = ventas.filter(item => {
            if (!item.fecha_normalizada) return false;

            // Forzamos la interpretación de la fecha de la base de datos
            const vDate = moment(item.fecha_normalizada);

            // Comparamos usando isBetween con '[]' para que sea inclusivo [inicio, fin]
            const isMatch = vDate.isBetween(start, end, null, '[]');

            return isMatch;
        });

        console.log("Resultados filtro:", filtered.length);
        setFilteredVentas(filtered);
        calculateStats(filtered, articulos);
    };

    const columns = [
        {
            title: <span className="font-bold text-[#163269]">ID</span>,
            dataIndex: 'id_unico',
            key: 'id_unico',
            render: (id, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-700">#{record.id_venta || record.id_pedido}</span>
                    <Tag color={record.tipo_transaccion === 'Venta' ? 'blue' : 'purple'} className="w-fit text-[10px] px-1 py-0 leading-tight">
                        {record.tipo_transaccion.toUpperCase()}
                    </Tag>
                </div>
            )
        },
        {
            title: <span className="font-bold text-[#163269]">Fecha</span>,
            dataIndex: 'fecha_normalizada',
            key: 'fecha_normalizada',
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
            render: (val, record) => {
                const total = parseFloat(val) || 0;
                const envio = parseFloat(record.costo_envio) || 0;
                const sub = total - envio;
                return (
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-[#163269] text-base">L. {total.toFixed(2)}</span>
                        {envio > 0 && <span className="text-[10px] text-gray-400">Incluye L. {envio.toFixed(2)} envío</span>}
                    </div>
                );
            }
        },
        {
            title: <span className="font-bold text-[#163269]">Utilidad (Est.)</span>,
            key: 'utilidad',
            align: 'right',
            render: (_, record) => {
                let costoVentaTotal = 0;
                const detalles = record.detalles_normalizados || [];

                detalles.forEach(d => {
                    let costoU = 0;
                    const artData = d.Articulo || d.articulo;

                    if (artData && (artData.costo_unitario !== undefined && artData.costo_unitario !== null)) {
                        costoU = parseFloat(artData.costo_unitario) || 0;
                    } else {
                        const idArt = d.id_articulo || d.idArticulo;
                        const articuloFromMap = idArt ? articulos.get(String(idArt)) : null;
                        costoU = articuloFromMap ? (parseFloat(articuloFromMap.costo_unitario) || 0) : 0;
                    }

                    const cant = parseFloat(d.cantidad) || 0;
                    costoVentaTotal += (cant * costoU);
                });

                const total = parseFloat(record.total) || 0;
                const envio = parseFloat(record.costo_envio || record.envio || 0);
                const utilidad = (total - envio) - costoVentaTotal;

                return (
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${(record.estado === 'Cancelada' || record.estado === 'Cancelado') ? 'bg-gray-100 text-gray-400' : (utilidad >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                        L. {utilidad.toFixed(2)}
                    </div>
                );
            }
        },
        {
            title: <span className="font-bold text-[#163269]">Estado</span>,
            dataIndex: 'estado',
            key: 'estado',
            render: (estado) => (
                <Tag color={(estado === 'Cancelada' || estado === 'Cancelado') ? 'red' : (estado === 'Entregado' || estado === 'Completada' ? 'green' : 'orange')} className="font-medium">
                    {(estado || 'COMPLETADA').toUpperCase()}
                </Tag>
            )
        },
        {
            title: <span className="font-bold text-[#163269]">Acciones</span>,
            key: 'acciones',
            align: 'center',
            render: (_, record) => (
                record.tipo_transaccion === 'Venta' && record.estado !== 'Cancelada' && (
                    <Popconfirm
                        title="¿Estás seguro de cancelar esta venta?"
                        description="Esta acción repondrá el stock de los productos."
                        onConfirm={() => handleCancelVenta(record.id_venta)}
                        okText="Sí, cancelar"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<CloseCircleOutlined />}
                            className="hover:bg-red-50 flex items-center justify-center mx-auto"
                        />
                    </Popconfirm>
                )
            )
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
                        value={dateRange}
                        onChange={handleDateFilter}
                        className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm hover:border-[#163269] transition-colors"
                        format="DD/MM/YYYY"
                        presets={[
                            { label: 'Hoy', value: [moment().startOf('day'), moment().endOf('day')] },
                            { label: 'Ayer', value: [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')] },
                            { label: 'Esta Semana', value: [moment().startOf('week'), moment().endOf('week')] },
                            { label: 'Este Mes', value: [moment().startOf('month'), moment().endOf('month')] },
                        ]}
                    />
                </div>
            </div>

            {/* Stats Cards - Colorful & Equal Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {/* Inventario Actual (Nuevo) */}
                <div className="bg-[#4F46E5] rounded-xl p-6 shadow-lg text-white flex flex-col justify-between min-h-[160px] transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <ShoppingCartOutlined className="text-2xl text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded text-white hidden md:block">Stock</span>
                    </div>
                    <div>
                        <p className="text-indigo-200 text-sm font-medium mb-1">Valor Inventario Actual</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            L. {stats.valorInventarioActual.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-indigo-200 mt-1 opacity-80 backdrop-blur-sm">{stats.unidadesInventario} unidades totales</p>
                    </div>
                </div>
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
                    rowKey="id_unico"
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
                                    dataSource={record.detalles_normalizados || []}
                                    rowKey={(r) => r.id_detalle_venta || r.id_detalle || Math.random()}
                                    pagination={false}
                                    size="small"
                                    bordered={false}
                                    columns={[
                                        {
                                            title: 'Producto',
                                            key: 'prod',
                                            render: (_, r) => {
                                                const artData = r.Articulo || r.articulo;
                                                const nombre = artData ? artData.nombre : (articulos.get(String(r.id_articulo || r.idArticulo))?.nombre || 'Desconocido');
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
