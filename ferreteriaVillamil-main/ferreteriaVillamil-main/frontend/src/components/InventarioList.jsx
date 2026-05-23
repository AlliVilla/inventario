import React, { useState, useEffect } from 'react';
import { Avatar, message, Image, Modal, DatePicker, Button } from 'antd';
import { DeleteOutlined, EditOutlined, LockOutlined, PlusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';
import logo from '../assets/LogoFerreteriaVillamil.png';
import ModalDeshabilitarArticulo from './ItemEstadoModal';
import ModalEditarCantidad from './ItemInventarioModal';
import ModalEliminarArticulo from './ItemBorrarModal';

const PDF_HEADER_INFO = {
    businessName: 'FERRETERIA VILLAMIL',
    reportTitle: 'REPORTE GENERAL',
    address: 'NACO CORTES. BARRIO CARMELINA, MEDIA CUADRA HACIA ARRIBA DEL POLIDEPORTIVO',
    phones: 'Tel. 95086231 - 96096433',
};

const PDF_HEADER_TOP = 54;
let pdfLogoDataUrlCache = null;

const formatExportNumber = (value, decimals = 2) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const formatExportInteger = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/** PNG con transparencia en jsPDF suele verse negro; se aplana sobre fondo blanco */
const getPdfLogoDataUrl = () => new Promise((resolve, reject) => {
    if (pdfLogoDataUrlCache) {
        resolve(pdfLogoDataUrlCache);
        return;
    }

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        pdfLogoDataUrlCache = canvas.toDataURL('image/jpeg', 0.92);
        resolve(pdfLogoDataUrlCache);
    };
    img.onerror = reject;
    img.src = logo;
});

const drawPdfHeader = (doc, reportDate, logoDataUrl, productCount = null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const rightX = pageWidth - 14;

    doc.setFillColor(255, 255, 255);
    doc.rect(14, 8, 48, 32, 'F');
    doc.addImage(logoDataUrl, 'JPEG', 14, 8, 48, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text(PDF_HEADER_INFO.businessName, centerX, 14, { align: 'center' });

    doc.setFontSize(13);
    doc.text(PDF_HEADER_INFO.reportTitle, centerX, 22, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(PDF_HEADER_INFO.address, pageWidth - 80);
    doc.text(addressLines, centerX, 30, { align: 'center' });

    const phonesY = 30 + (addressLines.length * 4.5) + 2;
    doc.text(PDF_HEADER_INFO.phones, centerX, phonesY, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(`Fecha: ${reportDate}`, rightX, 12, { align: 'right' });

    const lineY = Math.max(phonesY + 6, 46);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, lineY, rightX, lineY);

    let infoY = lineY + 6;
    if (productCount != null) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.text(`Total de productos: ${productCount}`, 14, infoY);
        infoY += 5;
    }

    return Math.max(infoY + 2, PDF_HEADER_TOP);
};

const PDF_COLUMNS = ['Código', 'Producto', 'Cantidad', 'Precio', 'Total'];

// Anchos fijos para que subtotales y totales alineen con la tabla principal
const EXPORT_TABLE_WIDTH = 249;
const EXPORT_MARGIN = { left: 14, right: 14 };
const EXPORT_COLUMN_WIDTHS = [35, 118, 28, 32, 36];
const EXPORT_COLUMN_STYLES = {
    0: { cellWidth: EXPORT_COLUMN_WIDTHS[0], halign: 'left' },
    1: { cellWidth: EXPORT_COLUMN_WIDTHS[1], halign: 'left' },
    2: { cellWidth: EXPORT_COLUMN_WIDTHS[2], halign: 'right' },
    3: { cellWidth: EXPORT_COLUMN_WIDTHS[3], halign: 'right' },
    4: { cellWidth: EXPORT_COLUMN_WIDTHS[4], halign: 'right' },
};
const PDF_SUBTOTAL_BOTTOM_MARGIN = 12;

const getExportTableOptions = (overrides = {}) => {
    const { margin, styles, columnStyles, ...rest } = overrides;
    return {
        theme: 'grid',
        tableWidth: EXPORT_TABLE_WIDTH,
        margin: { ...EXPORT_MARGIN, ...margin },
        styles: { fontSize: 8, cellPadding: 2, ...styles },
        columnStyles: { ...EXPORT_COLUMN_STYLES, ...columnStyles },
        ...rest,
    };
};

const computeColumnTotals = (items) => items.reduce((totals, item) => {
    const cantidad = Number(item.cantidad_existencia) || 0;
    const precio = Number(item.precio) || 0;
    totals.cantidad += cantidad;
    totals.precio += precio;
    totals.total += cantidad * precio;
    return totals;
}, { cantidad: 0, precio: 0, total: 0 });

const itemsToExportRows = (items) => items.map(item => {
    const cantidad = Number(item.cantidad_existencia) || 0;
    const precio = Number(item.precio) || 0;
    return [
        item.codigo,
        item.nombre,
        formatExportInteger(cantidad),
        formatExportNumber(precio),
        formatExportNumber(cantidad * precio),
    ];
});

const buildTotalsFootRow = (items, label = 'TOTALES') => {
    const totals = computeColumnTotals(items);
    return [[
        label,
        `${items.length} productos`,
        formatExportInteger(totals.cantidad),
        formatExportNumber(totals.precio),
        formatExportNumber(totals.total),
    ]];
};

const buildPageSubtotalRow = (pageNumber, stats) => [
    `SUBTOTAL HOJA ${pageNumber}`,
    `${stats.count} productos`,
    formatExportInteger(stats.cantidad),
    formatExportNumber(stats.precio),
    formatExportNumber(stats.total),
];

const addItemToPageStats = (stats, item) => {
    const cantidad = Number(item.cantidad_existencia) || 0;
    const precio = Number(item.precio) || 0;
    stats.cantidad += cantidad;
    stats.precio += precio;
    stats.total += cantidad * precio;
    stats.count += 1;
};


function InventarioList() {
    const [articulos, setArticulos] = useState([]);
    const [error, setError] = useState('');
    const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
    const [modalCantidadOpen, setModalCantidadOpen] = useState(false);
    const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
    const [articuloSel, setArticuloSel] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [pdfReportDate, setPdfReportDate] = useState(() => moment());
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_API_URL;
    const baseImageUrl = baseUrl?.replace('/api', '') || 'http://localhost:3000';

    const getFullImageUrl = (foto_url) => {
        if (!foto_url) return '/placeholder-product.png'; // Make sure this asset exists or use a fallback
        if (foto_url.startsWith('http')) return foto_url;
        const cleanPath = foto_url.startsWith('/') ? foto_url.slice(1) : foto_url;
        return `${baseImageUrl}/${cleanPath}`;
    };

    const openPdfExportModal = () => {
        setPdfReportDate(moment());
        setPdfModalOpen(true);
    };

    const exportToPDF = async () => {
        setPdfModalOpen(false);
        const reportDate = pdfReportDate.format('DD/MM/YYYY');
        const hideLoading = message.loading('Generando PDF con todo el inventario...', 0);

        try {
            const response = await axios.get(`${baseUrl}/articulos/list`, { params: { limit: 100000 } });
            const allItems = response.data.data || [];

            if (allItems.length === 0) {
                message.warning('No hay artículos para exportar');
                return;
            }

            const doc = new jsPDF({ orientation: 'landscape' });
            const logoDataUrl = await getPdfLogoDataUrl();
            const tableStartY = PDF_HEADER_TOP;

            const rows = itemsToExportRows(allItems);
            const grandTotalsFoot = buildTotalsFootRow(allItems, 'TOTAL GENERAL');
            const pageStats = {};
            const countedRowsOnPage = new Set();

            autoTable(doc, getExportTableOptions({
                head: [PDF_COLUMNS],
                body: rows,
                startY: tableStartY,
                margin: {
                    top: tableStartY,
                    right: 14,
                    bottom: 24 + PDF_SUBTOTAL_BOTTOM_MARGIN,
                    left: 14,
                },
                showFoot: false,
                headStyles: { fillColor: [22, 50, 105], textColor: 255, fontStyle: 'bold' },
                willDrawPage: (data) => {
                    drawPdfHeader(
                        doc,
                        reportDate,
                        logoDataUrl,
                        data.pageNumber === 1 ? allItems.length : null
                    );
                },
                didDrawCell: (data) => {
                    if (data.section !== 'body') return;

                    const rowKey = `${data.pageNumber}-${data.row.index}`;
                    if (countedRowsOnPage.has(rowKey) || data.column.index !== 0) return;

                    countedRowsOnPage.add(rowKey);
                    const item = allItems[data.row.index];
                    if (!item) return;

                    if (!pageStats[data.pageNumber]) {
                        pageStats[data.pageNumber] = { cantidad: 0, precio: 0, total: 0, count: 0 };
                    }

                    addItemToPageStats(pageStats[data.pageNumber], item);
                },
                didDrawPage: (data) => {
                    const stats = pageStats[data.pageNumber];
                    if (!stats || !data.cursor) return;

                    autoTable(doc, getExportTableOptions({
                        head: [PDF_COLUMNS],
                        body: [buildPageSubtotalRow(data.pageNumber, stats)],
                        startY: data.cursor.y + 2,
                        margin: { left: EXPORT_MARGIN.left, right: EXPORT_MARGIN.right },
                        showHead: false,
                        pageBreak: 'avoid',
                        styles: { fontStyle: 'bold', fillColor: [230, 236, 245] },
                    }));
                },
            }));

            autoTable(doc, getExportTableOptions({
                head: [PDF_COLUMNS],
                foot: grandTotalsFoot,
                body: [],
                startY: doc.lastAutoTable.finalY + 4,
                showHead: false,
                footStyles: { fillColor: [22, 50, 105], textColor: 255, fontStyle: 'bold' },
            }));

            doc.save('inventario.pdf');
            message.success(`PDF generado con ${allItems.length} productos`);
        } catch (err) {
            console.error(err);
            message.error('No se pudo generar el PDF');
        } finally {
            hideLoading();
        }
    };

    const exportToExcel = async () => {
        const hideLoading = message.loading('Generando Excel con todo el inventario...', 0);

        try {
            const response = await axios.get(`${baseUrl}/articulos/list`, { params: { limit: 100000 } });
            const allItems = response.data.data || [];

            if (allItems.length === 0) {
                message.warning('No hay artículos para exportar');
                return;
            }

            const totals = computeColumnTotals(allItems);
            const data = allItems.map(item => {
                const cantidad = Number(item.cantidad_existencia) || 0;
                const precio = Number(item.precio) || 0;
                return {
                    Código: item.codigo,
                    Producto: item.nombre,
                    Cantidad: formatExportInteger(cantidad),
                    Precio: formatExportNumber(precio),
                    Total: formatExportNumber(cantidad * precio),
                };
            });

            data.push({
                Código: 'TOTALES',
                Producto: `${allItems.length} productos`,
                Cantidad: formatExportInteger(totals.cantidad),
                Precio: formatExportNumber(totals.precio),
                Total: formatExportNumber(totals.total),
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = { Sheets: { Inventario: ws }, SheetNames: ['Inventario'] };
            XLSX.writeFile(wb, 'inventario.xlsx');
            message.success(`Excel generado con ${allItems.length} productos`);
        } catch (err) {
            console.error(err);
            message.error('No se pudo generar el Excel');
        } finally {
            hideLoading();
        }
    };
    const fetchArticulos = async (searchQuery) => {
        try {
            const params = searchQuery ? { search: searchQuery, limit: 200 } : { limit: 200 };
            const response = await axios.get(`${baseUrl}/articulos/list`, { params });
            setArticulos(response.data.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al cargar articulos';
            message.error(errorMsg);
        }
    };

    const sortedArticulos = React.useMemo(() => {
        if (!articulos) return [];

        let filtered = [...articulos];

        // Sorting only (search is now server-side)
        const sortable = [...filtered];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                // ... (rest of sorting logic remains same)
                if (sortConfig.key === 'costo_unitario' || sortConfig.key === 'precio') {
                    aValue = Number(a[sortConfig.key]);
                    bValue = Number(b[sortConfig.key]);
                } else if (sortConfig.key === 'costo_util') {
                    aValue = Number(a.precio) - Number(a.costo_unitario);
                    bValue = Number(b.precio) - Number(b.costo_unitario);
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                // Para strings
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [articulos, sortConfig]);

    // Debounced search handler
    const handleSearchChange = (value) => {
        setSearchText(value);
        if (window.inventorySearchTimeout) clearTimeout(window.inventorySearchTimeout);
        window.inventorySearchTimeout = setTimeout(() => {
            fetchArticulos(value);
        }, 300);
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const clearSort = () => {
        setSortConfig({ key: null, direction: 'asc' });
    }

    const abrirModalBloqueo = (articulo) => {
        setArticuloSel(articulo);
        setModalEstadoOpen(true);
    };

    const abrirModalCantidad = (articulo) => {
        setArticuloSel(articulo);
        setModalCantidadOpen(true);
    };

    const abrirModalEliminar = (articulo) => {
        setArticuloSel(articulo);
        setModalEliminarOpen(true)
    }

    const handleNuevoArticulo = async () => {
        navigate('/admin/inventario/crear-articulo')
    }

    useEffect(() => {
        fetchArticulos();
    }, []);

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                {/* Header with blue bar */}
                <h1 className="text-2xl md:text-3xl font-bold mb-5 pb-4 border-b-4" style={{ color: '#163269', borderColor: '#163269' }}>
                    Inventario
                </h1>

                <div className="flex flex-wrap justify-end gap-2 mb-6">
                    <button
                        className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors font-medium"
                        style={{ backgroundColor: '#163269' }}
                        onClick={handleNuevoArticulo}
                    >
                        Agregar producto
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium" onClick={openPdfExportModal}>Exportar PDF</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium" onClick={exportToExcel}>Exportar Excel</button>
                </div>

                {/* Inventory Table Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Table Header with Embedded Search */}
                    <div
                        className="flex flex-col md:flex-row items-center justify-between py-4 px-6 gap-4"
                        style={{ backgroundColor: '#5DADE2' }}
                    >
                        <h2 className="text-2xl font-bold text-inventory-navy text-center md:text-left flex-1" style={{ color: '#003366' }}>
                            Inventario actual
                        </h2>

                        {/* Search Input embedded in header */}
                        <div className="w-full md:w-1/3">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                autoFocus
                                className="w-full px-4 py-2 rounded-md border-none focus:ring-2 focus:ring-blue-800 text-gray-800 font-medium"
                                value={searchText}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>

                        <button
                            className="px-4 py-2 bg-white/90 text-inventory-navy rounded-md hover:bg-white transition-colors font-medium shadow-sm whitespace-nowrap"
                            onClick={clearSort}
                        >
                            Quitar ordenamiento
                        </button>
                    </div>


                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="px-3 py-4 text-left text-sm lg:text-lg font-bold text-black">
                                        Imagen
                                    </th>
                                    <th className="px-3 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('codigo')}>
                                        Codigo {sortConfig.key === 'codigo' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('nombre')}>
                                        Articulo {sortConfig.key === 'nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('costo_unitario')}>
                                        Costo Compra (L.) {sortConfig.key === 'costo_unitario' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('precio')}>
                                        Costo Venta (L.) {sortConfig.key === 'precio' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('costo_util')}>
                                        Costo Utilitario (L.) {sortConfig.key === 'costo_util' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-2 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('cantidad_existencia')}>
                                        En Existencia {sortConfig.key === 'cantidad_existencia' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('estado')}>
                                        Estado {sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-right text-sm lg:text-lg font-bold text-black">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedArticulos.map((item, index) => (
                                    <tr
                                        key={item.codigo}
                                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            }`}
                                    >
                                        <td className="px-4 py-2">
                                            <Image
                                                width={60}
                                                height={60}
                                                className="rounded-lg object-cover shadow-sm cursor-zoom-in"
                                                src={getFullImageUrl(item.foto_url)}
                                                fallback="https://via.placeholder.com/150?text=No+Imagen"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {item.codigo}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {item.nombre}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {Number(item.costo_unitario).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {Number(item.precio).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {(Number(item.precio) - Number(item.costo_unitario)).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {Number(item.cantidad_existencia)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${item.estado === 'Disponible'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    title="Ver detalles"
                                                    onClick={() =>
                                                        navigate(`/admin/inventario/ver-articulo/${item.codigo}`)
                                                    }
                                                >
                                                    <EyeOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    title="Editar"
                                                    onClick={() =>
                                                        navigate(`/admin/inventario/editar-articulo/${item.codigo}`)}
                                                >
                                                    <EditOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    onClick={() => abrirModalEliminar(item)}
                                                    title="Eliminar"
                                                >
                                                    <DeleteOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    onClick={() => abrirModalCantidad(item)}
                                                    title="Añadir"
                                                >
                                                    <PlusCircleOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    onClick={() => abrirModalBloqueo(item)}
                                                    title="Bloquear"
                                                >
                                                    <LockOutlined className="w-5 h-5 text-black" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <ModalDeshabilitarArticulo
                    open={modalEstadoOpen}
                    onClose={() => setModalEstadoOpen(false)}
                    articulo={articuloSel}
                    onGuardar={async (articuloActualizado) => {
                        try {
                            await axios.put(
                                `${baseUrl}/articulos/edit/${articuloActualizado.codigo}`,
                                { estado: articuloActualizado.estado }
                            );
                            message.success("Articulo editado con éxito");
                        } catch (error) {
                            message.error("Error inesperado al editar artículo");
                        }
                        fetchArticulos();
                    }}
                />
                <ModalEditarCantidad
                    open={modalCantidadOpen}
                    onClose={() => setModalCantidadOpen(false)}
                    articulo={articuloSel}
                    onGuardar={async (articuloActualizado) => {
                        try {
                            await axios.put(
                                `${baseUrl}/articulos/edit/${articuloActualizado.codigo}`,
                                { cantidad_existencia: articuloActualizado.cantidad_existencia }
                            );
                            message.success("Articulo editado con éxito");
                        } catch (error) {
                            message.error("Error inesperado al editar artículo");
                        }
                        fetchArticulos();
                    }}
                />
                <ModalEliminarArticulo
                    open={modalEliminarOpen}
                    onClose={() => setModalEliminarOpen(false)}
                    articulo={articuloSel}
                    onConfirm={async (articulo) => {
                        try {
                            await axios.delete(
                                `${baseUrl}/articulos/delete/${articulo.codigo}`
                            );
                            message.success("Articulo borrado con éxito");
                        } catch (error) {
                            message.error("Error inesperado al borrar artículo");
                        }
                        fetchArticulos();
                    }}
                />
                <Modal
                    title="Exportar inventario a PDF"
                    open={pdfModalOpen}
                    onCancel={() => setPdfModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setPdfModalOpen(false)}>
                            Cancelar
                        </Button>,
                        <Button key="export" type="primary" onClick={exportToPDF}>
                            Generar PDF
                        </Button>,
                    ]}
                >
                    <p className="mb-2 text-gray-600">
                        Revise la fecha del reporte antes de generar el PDF.
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del reporte</label>
                    <DatePicker
                        value={pdfReportDate}
                        onChange={(value) => setPdfReportDate(value || moment())}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        className="w-full"
                        inputReadOnly={false}
                    />
                </Modal>
            </div >
        </div >
    )
}

export default InventarioList
