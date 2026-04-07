import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Row, Col, Typography, Statistic, message, Tag, Popconfirm, Button } from 'antd';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/LogoFerreteriaVillamil.png';
import { AreaChartOutlined, DollarOutlined, ShoppingCartOutlined, FallOutlined, CloseCircleOutlined, PrinterOutlined, ClearOutlined } from '@ant-design/icons';
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
    const [mobileExpandedId, setMobileExpandedId] = useState(null);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(10);

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

    const handleRemoveItem = async (id_venta, id_detalle) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/removeItem/${id_venta}/${id_detalle}`);
            message.success("Producto devuelto al stock de manera exitosa");
            fetchData();
        } catch (error) {
            console.error("Error al devolver producto:", error);
            message.error(error.response?.data?.message || "Error al devolver el producto");
        }
    };

    const handleDateFilter = (dates) => {
        setDateRange(dates);
        setMobileVisibleCount(10);
        setMobileExpandedId(null);
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

    const handlePrintVenta = (record) => {
        const doc = new jsPDF();
        const date = moment(record.fecha_normalizada).format('DD/MM/YYYY');
        const pageHeight = doc.internal.pageSize.height;
        const footerHeight = 35; 
        const totalsHeight = 50; 
        const reservedSpace = totalsHeight + footerHeight + 10;
        const totalsY = pageHeight - reservedSpace;

        const drawHeader = () => {
            doc.addImage(logo, 'PNG', 10, 7, 65, 43); 
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("times", "bold");
            doc.text("INVERSIONES MERCANTILES VILLAMIL", 125, 16, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text("Colonia Pinto Calle Principal Naco Cortes. San Pedro Sula,", 125, 22, { align: "center" });
            doc.text("Tres Cuadras Arriba del Centro de Salud", 125, 27, { align: "center" });
            doc.text("R.T.N. 05011998149871  Tel. 95086231- 96096433", 125, 32, { align: "center" });
            doc.text("Correo: ferrevillamil@gmail.com", 125, 37, { align: "center" });

            doc.setFontSize(14);
            doc.setFont("times", "bold");
            doc.text("PROFORMA", 200, 46, { align: "right" });
            doc.setFontSize(12);
            doc.text(`N° PROF-${String(record.id_venta || record.id_pedido).padStart(7, '0')}`, 200, 54, { align: "right" });

            doc.setDrawColor(0, 0, 0);
            doc.line(10, 60, 200, 60);

            doc.setFontSize(8);
            doc.setFont("times", "italic");
            doc.setTextColor(80, 80, 80);
            doc.text("Este documento es generado únicamente con fines informativos y de control interno.", 105, 65, { align: "center" });
            doc.text("No constituye una factura fiscal válida, ni puede ser utilizado para efectos tributarios ante autoridades fiscales.", 105, 69, { align: "center" });
            doc.text("La factura legal correspondiente debe ser emitida a través del sistema autorizado conforme a la normativa vigente.", 105, 73, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Cliente: ${record.cliente_nombre || "Consumidor Final"}`, 10, 80);
            doc.text(`Fecha:  ${date}`, 200, 80, { align: "right" });
        };

        const drawTerms = (yPos) => {
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont("times", "bold");
            doc.text("TÉRMINOS Y CONDICIONES:", 10, yPos);
            doc.setFontSize(8);
            doc.setFont("times", "normal");
            doc.text("1. Los precios están sujetos a cambios sin previo aviso.", 10, yPos + 5);
            doc.text("2. Esta proforma es un documento informativo.", 10, yPos + 9);
            doc.text("3. La entrega de materiales está sujeta a disponibilidad de inventario.", 10, yPos + 13);
            doc.setFont("times", "bold");
            doc.text("¡ES UN PLACER SERVIRLE!", 10, yPos + 25);
        };

        const tableColumn = ["Cantidad", "Descripción", "Precio Unit.", "Desc. Y Rebajas", "Total"];
        const detalles = record.detalles_normalizados || [];
        const tableRows = detalles.map(item => {
            const artData = item.Articulo || item.articulo;
            const nombreArt = artData ? artData.nombre : (articulos.get(String(item.id_articulo || item.idArticulo))?.nombre || 'Desconocido');
            return [
                item.cantidad,
                nombreArt,
                parseFloat(item.precio_unitario).toFixed(2),
                "0.00",
                parseFloat(item.subtotal).toFixed(2)
            ]
        });

        autoTable(doc, {
            startY: 85,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain',
            headStyles: {
                fillColor: [180, 180, 180],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.5,
                lineColor: [255, 255, 255]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 25 },
                1: { halign: 'left' },
                2: { halign: 'right', cellWidth: 30 },
                3: { halign: 'right', cellWidth: 35 },
                4: { halign: 'right', cellWidth: 30 }
            },
            styles: {
                font: 'times',
                fontSize: 11,
                cellPadding: 2,
                minCellHeight: 6,
                textColor: [0, 0, 0]
            },
            margin: { left: 10, right: 10, bottom: 95, top: 88 },
            didDrawPage: (data) => {
                drawHeader();
                drawTerms(pageHeight - 80);
            }
        });

        let lastY = doc.lastAutoTable.finalY;
        if (lastY > totalsY) {
            doc.addPage();
            drawHeader();
            drawTerms(pageHeight - 80);
        }
        doc.setPage(doc.internal.getNumberOfPages());

        const totalX = 135;
        const valueX = 200;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const subtotal = parseFloat(record.total) || 0;
        const gravado15 = subtotal / 1.15;
        const isv15 = subtotal - gravado15;

        doc.text("Importe Exonerado:", totalX, totalsY + 5);
        doc.text("0.00", valueX, totalsY + 5, { align: "right" });

        doc.text("Importe Exento:", totalX, totalsY + 12);
        doc.text("0.00", valueX, totalsY + 12, { align: "right" });

        doc.text("Importe Gravado 15%:", totalX, totalsY + 19);
        doc.text(gravado15.toFixed(2), valueX, totalsY + 19, { align: "right" });

        doc.text("Importe Gravado 18%:", totalX, totalsY + 26);
        doc.text("0.00", valueX, totalsY + 26, { align: "right" });

        doc.text("I.S.V. 15%:", totalX, totalsY + 33);
        doc.text(isv15.toFixed(2), valueX, totalsY + 33, { align: "right" });

        doc.setFont("times", "bold");
        doc.text("Total A Pagar L.", totalX, totalsY + 42);
        doc.text(subtotal.toFixed(2), valueX, totalsY + 42, { align: "right" });

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "normal");
        doc.text("Firma: ________________________________________", 10, pageHeight - 20); 
        doc.text("¡Gracias por su Preferencia!", 200, pageHeight - 25, { align: "right" });
        doc.text("Esta proforma es un documento informativo", 200, pageHeight - 20, { align: "right" });

        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
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
                <div className="flex gap-2 justify-center items-center">
                    <Button
                        type="default"
                        title="Reimprimir Documento"
                        icon={<PrinterOutlined className="text-gray-600" />}
                        onClick={() => handlePrintVenta(record)}
                        className="hover:text-[#163269] hover:border-[#163269]"
                        size="small"
                    />
                    {record.tipo_transaccion === 'Venta' && record.estado !== 'Cancelada' && (
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
                                className="hover:bg-red-50 flex items-center justify-center p-0 w-6 h-6"
                            />
                        </Popconfirm>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-6 min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200 gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#163269]">Reportes Financieros</h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1">Analítica de ventas y rendimiento del negocio</p>
                </div>
                {/* Desktop: RangePicker */}
                <div className="hidden md:flex md:items-center md:gap-2 w-auto">
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateFilter}
                        inputReadOnly={true}
                        className="w-auto py-2 px-4 border border-gray-300 rounded-lg shadow-sm hover:border-[#163269] transition-colors"
                        format="DD/MM/YYYY"
                        presets={[
                            { label: 'Hoy', value: [moment().startOf('day'), moment().endOf('day')] },
                            { label: 'Ayer', value: [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')] },
                            { label: 'Esta Semana', value: [moment().startOf('week'), moment().endOf('week')] },
                            { label: 'Este Mes', value: [moment().startOf('month'), moment().endOf('month')] },
                        ]}
                    />
                    <Button
                        type="text"
                        icon={<ClearOutlined />}
                        onClick={() => handleDateFilter(null)}
                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Limpiar filtros"
                    >
                        Limpiar
                    </Button>
                </div>
                {/* Mobile: Native date inputs + quick presets */}
                <div className="md:hidden w-full flex flex-col gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { label: 'Hoy', value: [moment().startOf('day'), moment().endOf('day')] },
                            { label: 'Ayer', value: [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')] },
                            { label: 'Semana', value: [moment().startOf('week'), moment().endOf('week')] },
                            { label: 'Mes', value: [moment().startOf('month'), moment().endOf('month')] },
                        ].map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => handleDateFilter(preset.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                    dateRange &&
                                    dateRange[0].format('YYYY-MM-DD') === preset.value[0].format('YYYY-MM-DD') &&
                                    dateRange[1].format('YYYY-MM-DD') === preset.value[1].format('YYYY-MM-DD')
                                        ? 'bg-[#163269] text-white border-[#163269]'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#163269]'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            onClick={() => handleDateFilter(null)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-300 text-red-500 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1"
                        >
                            <ClearOutlined className="text-[10px]" /> Limpiar
                        </button>
                    </div>
                    <div className="flex gap-1.5 items-center overflow-hidden">
                        <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-gray-500 font-medium mb-0.5 block">Desde</label>
                            <input
                                type="date"
                                value={dateRange ? dateRange[0].format('YYYY-MM-DD') : ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const start = moment(e.target.value).startOf('day');
                                        const currentEnd = dateRange ? moment(dateRange[1]).endOf('day') : moment(e.target.value).endOf('day');
                                        const end = start.isAfter(currentEnd) ? moment(e.target.value).endOf('day') : currentEnd;
                                        handleDateFilter([start, end]);
                                    }
                                }}
                                className="w-full py-1.5 px-2 border border-gray-300 rounded-lg shadow-sm text-xs bg-white focus:border-[#163269] focus:ring-1 focus:ring-[#163269] outline-none"
                            />
                        </div>
                        <span className="text-gray-400 mt-4 shrink-0">—</span>
                        <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-gray-500 font-medium mb-0.5 block">Hasta</label>
                            <input
                                type="date"
                                value={dateRange ? dateRange[1].format('YYYY-MM-DD') : ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const end = moment(e.target.value).endOf('day');
                                        const currentStart = dateRange ? moment(dateRange[0]).startOf('day') : moment(e.target.value).startOf('day');
                                        const start = end.isBefore(currentStart) ? moment(e.target.value).startOf('day') : currentStart;
                                        handleDateFilter([start, end]);
                                    }
                                }}
                                className="w-full py-1.5 px-2 border border-gray-300 rounded-lg shadow-sm text-xs bg-white focus:border-[#163269] focus:ring-1 focus:ring-[#163269] outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Grid on Mobile / Grid on Desktop */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-5 md:gap-6 mb-4 md:mb-8">
                {/* Inventario Actual */}
                <div className="bg-[#4F46E5] rounded-xl p-3 md:p-6 shadow-lg text-white flex flex-col justify-between min-h-[100px] md:min-h-[160px]">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <div className="p-1.5 md:p-3 bg-white/10 rounded-full">
                            <ShoppingCartOutlined className="text-sm md:text-2xl text-white" />
                        </div>
                        <p className="text-indigo-200 text-[10px] md:text-sm font-medium">Inventario</p>
                    </div>
                    <div>
                        <h3 className="text-base md:text-3xl font-bold text-white tracking-tight break-all">
                            L. {stats.valorInventarioActual.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[9px] md:text-xs text-indigo-200 opacity-80">{stats.unidadesInventario} uds</p>
                    </div>
                </div>
                {/* Ventas Totales */}
                <div className="bg-[#163269] rounded-xl p-3 md:p-6 shadow-lg text-white flex flex-col justify-between min-h-[100px] md:min-h-[160px]">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <div className="p-1.5 md:p-3 bg-white/10 rounded-full">
                            <DollarOutlined className="text-sm md:text-2xl text-white" />
                        </div>
                        <p className="text-blue-200 text-[10px] md:text-sm font-medium">Ventas</p>
                    </div>
                    <div>
                        <h3 className="text-base md:text-3xl font-bold text-white tracking-tight break-all">
                            L. {stats.totalVentas.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Utilidad */}
                <div className="bg-[#059669] rounded-xl p-3 md:p-6 shadow-lg text-white flex flex-col justify-between min-h-[100px] md:min-h-[160px]">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <div className="p-1.5 md:p-3 bg-white/10 rounded-full">
                            <FallOutlined rotate={180} className="text-sm md:text-2xl text-white" />
                        </div>
                        <p className="text-green-100 text-[10px] md:text-sm font-medium">Utilidad</p>
                    </div>
                    <div>
                        <h3 className="text-base md:text-3xl font-bold text-white tracking-tight break-all">
                            L. {stats.utilidadTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Costo */}
                <div className="bg-[#DC2626] rounded-xl p-3 md:p-6 shadow-lg text-white flex flex-col justify-between min-h-[100px] md:min-h-[160px]">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <div className="p-1.5 md:p-3 bg-white/10 rounded-full">
                            <AreaChartOutlined className="text-sm md:text-2xl text-white" />
                        </div>
                        <p className="text-red-100 text-[10px] md:text-sm font-medium">Costos</p>
                    </div>
                    <div>
                        <h3 className="text-base md:text-3xl font-bold text-white tracking-tight break-all">
                            L. {stats.costoTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Transacciones - full width on mobile */}
                <div className="col-span-2 xl:col-span-1 bg-[#D97706] rounded-xl p-3 md:p-6 shadow-lg text-white flex md:flex-col items-center md:items-start justify-between md:justify-between min-h-0 md:min-h-[160px]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 md:p-3 bg-white/10 rounded-full">
                            <ShoppingCartOutlined className="text-sm md:text-2xl text-white" />
                        </div>
                        <p className="text-orange-100 text-[10px] md:text-sm font-medium">Transacciones</p>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                        {stats.cantidadVentas}
                    </h3>
                </div>
            </div>

            {/* Table Section - Desktop */}
            <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-[#1e293b] border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Historial de Transacciones</h2>
                    <span className="text-sm text-gray-300 bg-gray-700 px-3 py-1 rounded-full whitespace-nowrap">Mostrando {filteredVentas.length}</span>
                </div>
                <Table
                    dataSource={filteredVentas}
                    columns={columns}
                    rowKey="id_unico"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: false,
                        responsive: true,
                        itemRender: (page, type, originalElement) => {
                            if (type === 'prev') return <a className="text-[#163269] hover:bg-gray-100 px-2 py-1 rounded">Anterior</a>;
                            if (type === 'next') return <a className="text-[#163269] hover:bg-gray-100 px-2 py-1 rounded">Siguiente</a>;
                            return originalElement;
                        }
                    }}
                    className="report-table"
                    expandable={{
                        expandedRowRender: record => (
                            <div className="bg-gray-50 p-4 rounded-lg mx-4 my-2 border border-gray-200 overflow-x-auto">
                                <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Detalles de la compra</h4>
                                <Table
                                    dataSource={record.detalles_normalizados || []}
                                    rowKey={(r) => r.id_detalle_venta || r.id_detalle || Math.random()}
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 400 }}
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
                                        { title: 'Cant.', dataIndex: 'cantidad', align: 'center' },
                                        { title: 'P. Unit.', dataIndex: 'precio_unitario', align: 'right', render: v => `L. ${parseFloat(v).toFixed(2)}` },
                                        { title: 'Subtotal', dataIndex: 'subtotal', align: 'right', render: v => <span className="font-semibold text-[#163269]">L. {parseFloat(v).toFixed(2)}</span> },
                                        {
                                            title: '',
                                            key: 'acciones_item',
                                            align: 'center',
                                            render: (_, r) => (
                                                record.tipo_transaccion === 'Venta' && record.estado !== 'Cancelada' && (
                                                    <Popconfirm
                                                        title="¿Devolver este producto?"
                                                        description="Se repondrá al stock y se restará del total."
                                                        onConfirm={() => handleRemoveItem(record.id_venta, r.id_detalle_venta || r.id_detalle)}
                                                        okText="Devolver"
                                                        cancelText="No"
                                                        okButtonProps={{ danger: true }}
                                                    >
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<CloseCircleOutlined />}
                                                            size="small"
                                                            title="Devolver unidad"
                                                            className="flex items-center justify-center p-0 w-6 h-6"
                                                        />
                                                    </Popconfirm>
                                                )
                                            )
                                        }
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

            {/* Mobile Card View */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-bold text-[#163269]">Transacciones</h2>
                    <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{filteredVentas.length} registros</span>
                </div>
                <div className="flex flex-col gap-2">
                    {filteredVentas.length === 0 && (
                        <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm border border-gray-200">
                            No hay transacciones en este rango
                        </div>
                    )}
                    {filteredVentas.slice(0, mobileVisibleCount).map(record => {
                        const total = parseFloat(record.total) || 0;
                        const envio = parseFloat(record.costo_envio || record.envio || 0);
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
                            costoVentaTotal += (parseFloat(d.cantidad) || 0) * costoU;
                        });
                        const utilidad = (total - envio) - costoVentaTotal;
                        const isCancelled = record.estado === 'Cancelada' || record.estado === 'Cancelado';
                        const isExpanded = mobileExpandedId === record.id_unico;

                        return (
                            <div key={record.id_unico} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Card Header */}
                                <div className="p-3 flex items-center justify-between" onClick={() => setMobileExpandedId(isExpanded ? null : record.id_unico)}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex flex-col items-center shrink-0">
                                            <span className="text-xs font-bold text-gray-700">#{record.id_venta || record.id_pedido}</span>
                                            <Tag color={record.tipo_transaccion === 'Venta' ? 'blue' : 'purple'} className="text-[9px] px-1 py-0 leading-tight m-0">
                                                {record.tipo_transaccion.toUpperCase()}
                                            </Tag>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-gray-800 truncate">{record.cliente_nombre || 'Consumidor Final'}</p>
                                            <p className="text-[10px] text-gray-400">{moment(record.fecha_normalizada).format('DD MMM YYYY, h:mm a')}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 ml-2">
                                        <span className="text-sm font-bold text-[#163269]">L. {total.toFixed(2)}</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isCancelled ? 'bg-gray-100 text-gray-400' : utilidad >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {isCancelled ? 'CANC' : `L.${utilidad.toFixed(0)}`}
                                            </span>
                                            <Tag 
                                                color={isCancelled ? 'red' : (record.estado === 'Entregado' || record.estado === 'Completada' ? 'green' : 'orange')} 
                                                className="text-[9px] px-1 py-0 m-0 leading-tight"
                                            >
                                                {(record.estado || 'OK').toUpperCase().slice(0, 4)}
                                            </Tag>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        {/* Product list */}
                                        <div className="px-3 py-2 bg-gray-50">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Productos</p>
                                            {detalles.map((d, i) => {
                                                const artData = d.Articulo || d.articulo;
                                                const nombre = artData ? artData.nombre : (articulos.get(String(d.id_articulo || d.idArticulo))?.nombre || 'Desconocido');
                                                return (
                                                    <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-700 truncate">{nombre}</p>
                                                            <p className="text-[10px] text-gray-400">{d.cantidad} × L.{parseFloat(d.precio_unitario).toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                                            <span className="text-xs font-semibold text-[#163269]">L.{parseFloat(d.subtotal).toFixed(2)}</span>
                                                            {record.tipo_transaccion === 'Venta' && !isCancelled && (
                                                                <Popconfirm
                                                                    title="¿Devolver este producto?"
                                                                    description="Se repondrá al stock."
                                                                    onConfirm={() => handleRemoveItem(record.id_venta, d.id_detalle_venta || d.id_detalle)}
                                                                    okText="Sí"
                                                                    cancelText="No"
                                                                    okButtonProps={{ danger: true }}
                                                                >
                                                                    <button className="text-red-400 hover:text-red-600 p-0.5">
                                                                        <CloseCircleOutlined className="text-xs" />
                                                                    </button>
                                                                </Popconfirm>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {envio > 0 && (
                                                <p className="text-[10px] text-gray-400 mt-1">Envío: L.{envio.toFixed(2)}</p>
                                            )}
                                        </div>
                                        {/* Actions */}
                                        <div className="px-3 py-2 flex gap-2 justify-end bg-white">
                                            <Button
                                                type="default"
                                                size="small"
                                                icon={<PrinterOutlined />}
                                                onClick={() => handlePrintVenta(record)}
                                                className="text-xs"
                                            >
                                                Imprimir
                                            </Button>
                                            {record.tipo_transaccion === 'Venta' && !isCancelled && (
                                                <Popconfirm
                                                    title="¿Cancelar esta venta?"
                                                    description="Se repondrá el stock."
                                                    onConfirm={() => handleCancelVenta(record.id_venta)}
                                                    okText="Sí, cancelar"
                                                    cancelText="No"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <Button type="primary" danger size="small" icon={<CloseCircleOutlined />} className="text-xs">
                                                        Cancelar
                                                    </Button>
                                                </Popconfirm>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {mobileVisibleCount < filteredVentas.length && (
                        <button
                            onClick={() => setMobileVisibleCount(prev => prev + 10)}
                            className="w-full py-3 text-sm font-semibold text-[#163269] bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            Cargar más ({filteredVentas.length - mobileVisibleCount} restantes)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportesVentas;
