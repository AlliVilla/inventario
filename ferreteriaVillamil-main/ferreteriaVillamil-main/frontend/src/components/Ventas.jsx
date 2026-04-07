import React, { useState, useEffect } from 'react';
import { Input, Avatar, Button, Table, Card, Row, Col, Typography, message, InputNumber, Modal, Badge, Divider } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, DeleteOutlined, SaveOutlined, UserOutlined, PlusOutlined, MinusOutlined, EyeOutlined, FilePdfOutlined, PrinterOutlined, CheckCircleFilled } from '@ant-design/icons';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/LogoFerreteriaVillamil.png';

const { Title, Text } = Typography;

// Estilos para la tabla del modal (no para impresión de navegador)
const modalTableStyles = `
    .custom-invoice-table .ant-table-thead > tr > th {
        background-color: #f8fafc !important;
        color: #1e293b !important;
        font-weight: 600 !important;
    }
    .custom-invoice-table .ant-table-tbody > tr > td {
        padding: 12px 16px !important;
    }
`;

const InvoiceStyles = () => (
    <style>{modalTableStyles}</style>
);

const Ventas = () => {
    const [articulos, setArticulos] = useState([]);
    const [filteredArticulos, setFilteredArticulos] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clientName, setClientName] = useState('Consumidor Final');
    const [previewModal, setPreviewModal] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [lastSaleData, setLastSaleData] = useState(null);
    const [invoiceFormat, setInvoiceFormat] = useState('letter');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [confirmModal, setConfirmModal] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'cart'
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        fetchArticulos();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const fetchArticulos = async (searchQuery = '') => {
        try {
            const token = localStorage.getItem('token');
            const params = { limit: 2000 };
            if (searchQuery) params.search = searchQuery;
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list/active`,
                { 
                    params,
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            if (response.data && response.data.data) {
                setArticulos(response.data.data);
                setFilteredArticulos(response.data.data);
            }
        } catch (error) {
            console.error("Error cargando artículos:", error);
            if (error.response) {
                console.error("Detalles del error del servidor:", error.response.data);
                message.error(`Error: ${error.response.data.message || "Error al cargar inventario"}`);
            } else {
                message.error("Error al cargar inventario (Sin respuesta del servidor)");
            }
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        if (window.searchTimeout) clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            fetchArticulos(value);
        }, 300);
    };

    const addToCart = (articulo) => {
        const existingItem = cart.find(item => item.id_articulo === articulo.id_articulo);

        if (existingItem) {
            if (existingItem.cantidad + 1 > articulo.cantidad_existencia) {
                message.warning(`Solo hay ${articulo.cantidad_existencia} unidades disponibles`);
                return;
            }
            const updatedCart = cart.map(item =>
                item.id_articulo === articulo.id_articulo
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
                    : item
            );
            setCart(updatedCart);
        } else {
            if (articulo.cantidad_existencia < 1) {
                message.warning("Producto sin stock");
                return;
            }
            setCart([...cart, {
                id_articulo: articulo.id_articulo,
                codigo: articulo.codigo,
                nombre: articulo.nombre,
                precio_unitario: parseFloat(articulo.precio),
                cantidad: 1,
                subtotal: parseFloat(articulo.precio),
                foto_url: articulo.foto_url,
                max_stock: articulo.cantidad_existencia
            }]);
        }
        message.success(`${articulo.nombre} agregado`);
    };

    const updateQuantity = (id_articulo, quantity) => {
        const item = cart.find(i => i.id_articulo === id_articulo);
        if (!item) return;

        if (quantity > item.max_stock) {
            message.warning(`Máximo disponible: ${item.max_stock}`);
            quantity = item.max_stock;
        }
        if (quantity < 1) quantity = 1;

        const updatedCart = cart.map(item =>
            item.id_articulo === id_articulo
                ? { ...item, cantidad: quantity, subtotal: quantity * item.precio_unitario }
                : item
        );
        setCart(updatedCart);
    };

    const updatePrice = (id_articulo, newPrice) => {
        const item = cart.find(i => i.id_articulo === id_articulo);
        if (!item) return;

        const price = parseFloat(newPrice) || 0;

        const updatedCart = cart.map(item =>
            item.id_articulo === id_articulo
                ? { ...item, precio_unitario: price, subtotal: item.cantidad * price }
                : item
        );
        setCart(updatedCart);
    };

    const removeFromCart = (id_articulo) => {
        setCart(cart.filter(item => item.id_articulo !== id_articulo));
    };

    const getTotal = () => {
        return cart.reduce((acc, item) => acc + item.subtotal, 0);
    };

    const generateInvoicePDF = () => {
        if (!lastSaleData) return;
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();
        const pageHeight = doc.internal.pageSize.height;
        const footerHeight = 35; // Espacio para firma y agradecimientos
        const totalsHeight = 50; // Espacio para el desglose de totales
        const reservedSpace = totalsHeight + footerHeight + 10;
        const totalsY = pageHeight - reservedSpace;

        // Función para dibujar el encabezado en cada página
        const drawHeader = () => {
            doc.addImage(logo, 'PNG', 10, 7, 65, 43); // Logo XXL
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
            doc.text(`N° PROF-${String(lastSaleData.id_venta).padStart(7, '0')}`, 200, 54, { align: "right" });

            // Línea divisora perfectamente centrada
            doc.setDrawColor(0, 0, 0);
            doc.line(10, 60, 200, 60);

            // Aviso Legal
            doc.setFontSize(8);
            doc.setFont("times", "italic");
            doc.setTextColor(80, 80, 80);
            doc.text("Este documento es generado únicamente con fines informativos y de control interno.", 105, 65, { align: "center" });
            doc.text("No constituye una factura fiscal válida, ni puede ser utilizado para efectos tributarios ante autoridades fiscales.", 105, 69, { align: "center" });
            doc.text("La factura legal correspondiente debe ser emitida a través del sistema autorizado conforme a la normativa vigente.", 105, 73, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Cliente: ${clientName || "Consumidor Final"}`, 10, 80);
            doc.text(`Fecha:  ${date}`, 200, 80, { align: "right" });
        };

        // Función para dibujar los términos y condiciones fijos
        const drawTerms = (yPos) => {
            doc.setFontSize(9); // Un poco mas grande
            doc.setTextColor(0, 0, 0); // Negro Puro
            doc.setFont("times", "bold");
            doc.text("TÉRMINOS Y CONDICIONES:", 10, yPos);
            doc.setFontSize(8); // Un poco mas grande
            doc.setFont("times", "normal");
            doc.text("1. Los precios están sujetos a cambios sin previo aviso.", 10, yPos + 5);
            doc.text("2. Esta proforma es un documento informativo.", 10, yPos + 9);
            doc.text("3. La entrega de materiales está sujeta a disponibilidad de inventario.", 10, yPos + 13);
            doc.setFont("times", "bold");
            doc.text("¡ES UN PLACER SERVIRLE!", 10, yPos + 25);
        };

        const tableColumn = ["Cantidad", "Descripción", "Precio Unit.", "Desc. Y Rebajas", "Total"];
        const tableRows = lastSaleData.items.map(item => [
            item.cantidad,
            item.nombre,
            parseFloat(item.precio_unitario).toFixed(2),
            "0.00",
            parseFloat(item.subtotal).toFixed(2)
        ]);

        autoTable(doc, {
            startY: 85,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain',
            headStyles: {
                fillColor: [180, 180, 180],
                textColor: [0, 0, 0], // Texto negro como pediste
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.5,
                lineColor: [255, 255, 255] // Vuelta al blanco original para las lineas
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

        // --- Resumen Económico (Fijo al final de la última página) ---
        let lastY = doc.lastAutoTable.finalY;
        if (lastY > totalsY) {
            doc.addPage();
            drawHeader();
            drawTerms(pageHeight - 80);
        }
        doc.setPage(doc.internal.getNumberOfPages());

        // Totales (derecha)
        const totalX = 135; // Un poco mas hacia la derecha para balancear mejor
        const valueX = 200; // Margen exacto 10mm
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const subtotal = parseFloat(lastSaleData.total);
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

        // --- Pie de página (Fijo al final) ---
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "normal");
        doc.text("Firma: ________________________________________", 10, pageHeight - 20); // Margen 10mm exacto
        doc.text("¡Gracias por su Preferencia!", 200, pageHeight - 25, { align: "right" });
        doc.text("Esta proforma es un documento informativo", 200, pageHeight - 20, { align: "right" });

        return doc;
    };

    const handlePrint = () => {
        const doc = generateInvoicePDF();
        if (!doc) return;
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDownload = () => {
        const doc = generateInvoicePDF();
        if (!doc) return;
        doc.save(`Factura_${lastSaleData.id_venta}.pdf`);
    };

    const resetSale = () => {
        setCart([]);
        setClientName("");
        setSuccessModal(false);
        setLastSaleData(null);
        fetchArticulos();
    };

    const handleCheckout = async () => {
        setConfirmModal(false);
        if (cart.length === 0) {
            message.error("El carrito está vacío");
            return;
        }

        const userStr = localStorage.getItem('user');
        const loggedUser = userStr ? JSON.parse(userStr) : null;

        setLoading(true);
        try {
            const saleData = {
                cliente_nombre: clientName || "Consumidor Final",
                id_usuario_vendedor: loggedUser?.id_usuario || loggedUser?.id || 1, // Fallback al 1 si no hay usuario
                total: getTotal(),
                items: cart.map(item => ({
                    id_articulo: item.id_articulo,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.subtotal,
                    nombre: item.nombre // Para que lastSaleData tenga los nombres para el modal
                }))
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/new`,
                saleData
            );

            const newVenta = response.data.venta;
            setLastSaleData({ ...newVenta, items: [...cart] });
            
            message.success("Venta realizada con éxito");
            setSuccessModal(true);
        } catch (error) {
            console.error("Error al procesar venta:", error);
            message.error("Error al procesar la venta");
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
            padding: isMobile ? '12px' : '24px'
        }}>
            <InvoiceStyles />
            <div style={{
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                padding: isMobile ? '20px' : '28px 36px',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(30, 58, 138, 0.2)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    textAlign: isMobile ? 'center' : 'left' 
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '14px',
                        borderRadius: '14px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <ShoppingCartOutlined style={{ fontSize: isMobile ? '28px' : '36px', color: 'white' }} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, color: 'white', fontSize: isMobile ? '24px' : '32px', fontWeight: '700' }}>
                            Punto de Venta
                        </h1>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '14px' : '16px' }}>
                            Sistema de ventas rápido y eficiente
                        </p>
                    </div>
                </div>
            </div>

            {/* Selector de Pestañas para Móvil */}
            {isMobile && (
                <div style={{ 
                    display: 'flex', 
                    background: 'white', 
                    borderRadius: '14px', 
                    padding: '6px', 
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '10px',
                            background: activeTab === 'inventory' ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : 'transparent',
                            color: activeTab === 'inventory' ? 'white' : '#64748b',
                            fontWeight: '700',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <SearchOutlined /> Inventario
                    </button>
                    <button
                        onClick={() => setActiveTab('cart')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '10px',
                            background: activeTab === 'cart' ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : 'transparent',
                            color: activeTab === 'cart' ? 'white' : '#64748b',
                            fontWeight: '700',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <ShoppingCartOutlined /> Carrito 
                        {cart.length > 0 && <Badge count={cart.length} size="small" style={{ backgroundColor: activeTab === 'cart' ? '#ef4444' : '#1e3a8a', marginLeft: '4px' }} />}
                    </button>
                </div>
            )}

            <Row gutter={isMobile ? [0, 24] : 24} style={{ height: isMobile ? 'auto' : 'calc(100vh - 180px)' }}>
                {(!isMobile || activeTab === 'inventory') && (
                    <Col xs={24} md={13} style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: '20px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            border: 'none',
                            overflow: 'hidden'
                        }}
                        styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' } }}
                    >
                        <Input
                            placeholder="Buscar productos..."
                            prefix={<SearchOutlined style={{ fontSize: '20px', color: '#94a3b8' }} />}
                            size="large"
                            allowClear
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                marginBottom: '24px',
                                borderRadius: '14px',
                                border: '2px solid #e2e8f0',
                                fontSize: '17px',
                                height: '56px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                        />

                        <div style={{ flex: 1, overflowY: isMobile ? 'visible' : 'auto' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                    gap: 16
                                }}
                            >
                                {filteredArticulos.map((item) => (
                                        <Card
                                            key={item.id_articulo}
                                            hoverable
                                            style={{
                                                borderRadius: '16px',
                                                border: '2px solid #e2e8f0',
                                                overflow: 'hidden',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                height: '100%'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-6px)';
                                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 58, 138, 0.15)';
                                                e.currentTarget.style.borderColor = '#3b82f6';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                            cover={
                                                <div
                                                    style={{
                                                        height: isMobile ? '140px' : '160px',
                                                        width: '100%',
                                                        background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '12px',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        overflow: 'hidden'
                                                    }}
                                                    onClick={() => {
                                                        setSelectedProduct(item);
                                                        setPreviewModal(true);
                                                    }}
                                                >
                                                    {item.cantidad_existencia <= 0 && (
                                                        <Badge.Ribbon text="AGOTADO" color="red" style={{ fontSize: '10px', fontWeight: '700' }} />
                                                    )}
                                                    {item.cantidad_existencia > 0 && item.cantidad_existencia <= 5 && (
                                                        <Badge.Ribbon text="BAJO STOCK" color="orange" style={{ fontSize: '10px', fontWeight: '700' }} />
                                                    )}

                                                    {item.foto_url ? (
                                                        <img
                                                            src={getImageUrl(item.foto_url)}
                                                            alt={item.nombre}
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '100%',
                                                                objectFit: 'contain'
                                                            }}
                                                        />
                                                    ) : (
                                                        <ShoppingCartOutlined style={{ fontSize: '42px', color: '#cbd5e1' }} />
                                                    )}
                                                </div>
                                            }
                                        >
                                            <div style={{ padding: '4px' }}>
                                                <h3 style={{
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    color: '#1e293b',
                                                    marginBottom: '8px',
                                                    height: '40px',
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {item.nombre}
                                                </h3>

                                                <div style={{
                                                    fontSize: '24px',
                                                    fontWeight: '800',
                                                    color: '#1e3a8a',
                                                    marginBottom: '8px'
                                                }}>
                                                    L. {parseFloat(item.precio).toFixed(2)}
                                                </div>

                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: item.cantidad_existencia > 5 ? '#059669' : item.cantidad_existencia > 0 ? '#f59e0b' : '#ef4444',
                                                    marginBottom: '12px'
                                                }}>
                                                    Stock: {item.cantidad_existencia}
                                                </div>

                                                <Button
                                                    type="primary"
                                                    block
                                                    disabled={item.cantidad_existencia <= 0}
                                                    onClick={() => addToCart(item)}
                                                    icon={<PlusOutlined />}
                                                    style={{
                                                        height: '42px',
                                                        fontSize: '15px',
                                                        fontWeight: '700',
                                                        borderRadius: '10px',
                                                        background: item.cantidad_existencia > 0 ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : undefined,
                                                        border: 'none',
                                                        boxShadow: item.cantidad_existencia > 0 ? '0 4px 12px rgba(30, 58, 138, 0.3)' : undefined
                                                    }}
                                                >
                                                    {item.cantidad_existencia > 0 ? 'Agregar' : 'Agotado'}
                                                </Button>
                                            </div>
                                        </Card>
                                ))}
                            </div>
                        </div>
                    </Card>
                </Col>
                )}

                {(!isMobile || activeTab === 'cart') && (
                    <Col xs={24} md={11} id="cart-section" style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: '20px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            border: 'none',
                            background: 'white'
                        }}
                        styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' } }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            marginBottom: '20px',
                            paddingBottom: '20px',
                            borderBottom: '2px solid #f1f5f9'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                padding: '12px',
                                borderRadius: '12px'
                            }}>
                                <ShoppingCartOutlined style={{ fontSize: '26px', color: 'white' }} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>
                                    Carrito de Compra
                                </h2>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                    {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <Input
                                placeholder="Nombre del cliente (opcional)"
                                prefix={<UserOutlined style={{ fontSize: '16px', color: '#94a3b8' }} />}
                                size="large"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                style={{
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '16px',
                                    height: '50px'
                                }}
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                            {cart.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#94a3b8'
                                }}>
                                    <ShoppingCartOutlined style={{ fontSize: '72px', marginBottom: '16px', opacity: 0.3 }} />
                                    <p style={{ fontSize: '18px', fontWeight: '600' }}>Carrito vacío</p>
                                    <p style={{ fontSize: '14px' }}>Agrega productos para comenzar</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div
                                        key={item.id_articulo}
                                        style={{
                                            background: '#f8fafc',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '14px',
                                            padding: '16px',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                            <Avatar
                                                src={getImageUrl(item.foto_url)}
                                                icon={<ShoppingCartOutlined />}
                                                shape="square"
                                                size={50}
                                                style={{ borderRadius: '8px', border: '2px solid #e2e8f0' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                                                    {item.nombre}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                    {item.codigo}
                                                </div>
                                            </div>
                                            <Button
                                                danger
                                                size="large"
                                                icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
                                                onClick={() => removeFromCart(item.id_articulo)}
                                                style={{
                                                    borderRadius: '10px',
                                                    height: '48px',
                                                    width: '48px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Precio:</span>
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                value={item.precio_unitario}
                                                onChange={(val) => updatePrice(item.id_articulo, val)}
                                                prefix="L. "
                                                style={{ width: '110px', fontWeight: '700' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Cantidad:</span>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <Button
                                                    size="middle"
                                                    icon={<MinusOutlined />}
                                                    onClick={() => updateQuantity(item.id_articulo, item.cantidad - 1)}
                                                    style={{
                                                        borderRadius: '8px',
                                                        height: '38px',
                                                        width: '38px'
                                                    }}
                                                />
                                                <InputNumber
                                                    min={0.01}
                                                    step={0.01}
                                                    precision={2}
                                                    value={item.cantidad}
                                                    onChange={(val) => updateQuantity(item.id_articulo, val)}
                                                    style={{
                                                        width: '70px',
                                                        fontSize: '16px',
                                                        fontWeight: '800',
                                                        textAlign: 'center'
                                                    }}
                                                    controls={false}
                                                />
                                                <Button
                                                    size="middle"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => updateQuantity(item.id_articulo, item.cantidad + 1)}
                                                    style={{
                                                        borderRadius: '8px',
                                                        height: '38px',
                                                        width: '38px'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: '12px',
                                            borderTop: '2px solid #e2e8f0'
                                        }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Subtotal:</span>
                                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>
                                                L. {item.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{
                            background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '2px solid #e2e8f0'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: '#64748b' }}>Total:</span>
                                <span style={{ fontSize: '36px', fontWeight: '900', color: '#1e3a8a' }}>
                                    L. {getTotal().toFixed(2)}
                                </span>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                icon={<SaveOutlined />}
                                loading={loading}
                                onClick={() => setConfirmModal(true)}
                                disabled={cart.length === 0}
                                block
                                style={{
                                    background: cart.length === 0 ? undefined : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    height: '58px',
                                    fontSize: '18px',
                                    borderRadius: '12px',
                                    fontWeight: '800',
                                    border: 'none',
                                    boxShadow: cart.length === 0 ? undefined : '0 6px 20px rgba(5, 150, 105, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                PROCESAR VENTA
                            </Button>
                        </div>
                    </Card>
                </Col>
                )}
            </Row>

            <Modal
                title={<span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>Confirmar Venta</span>}
                open={confirmModal}
                onCancel={() => setConfirmModal(false)}
                footer={[
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%' }}>
                        <Button 
                            key="back" 
                            onClick={() => setConfirmModal(false)}
                            style={{ 
                                height: '45px', 
                                flex: 1, 
                                borderRadius: '12px', 
                                fontWeight: '600'
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            key="submit" 
                            type="primary" 
                            loading={loading} 
                            onClick={handleCheckout}
                            style={{ 
                                height: '45px', 
                                flex: 1, 
                                borderRadius: '12px', 
                                fontWeight: '700',
                                background: '#059669',
                                border: 'none'
                            }}
                        >
                            Confirmar
                        </Button>
                    </div>
                ]}
                centered
                width={isMobile ? '95%' : 480}
                styles={{ 
                    content: { borderRadius: '16px' },
                    header: { borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' },
                    body: { padding: '24px' }
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Cliente</Text>
                        <Text strong style={{ fontSize: '18px', color: '#111' }}>{clientName || "Consumidor Final"}</Text>
                    </div>

                    <div>
                        <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                            {cart.length} {cart.length === 1 ? 'Producto' : 'Productos'}
                        </Text>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {cart.map((item, idx) => (
                                <div key={item.id_articulo || idx} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text strong style={{ fontSize: '14px', color: '#333' }}>{item.nombre}</Text>
                                        <Text style={{ fontSize: '14px' }}>L. {parseFloat(item.subtotal).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Cantidad: {item.cantidad}</Text>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#666' }}>Subtotal</Text>
                            <Text style={{ color: '#333' }}>L. {(getTotal() / 1.15).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#666' }}>ISV (15%)</Text>
                            <Text style={{ color: '#333' }}>L. {(getTotal() - (getTotal() / 1.15)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                        </div>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: '16px' }}>Total</Text>
                        <Text strong style={{ fontSize: '28px', color: '#1e3a8a' }}>
                            L. {getTotal().toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </Text>
                    </div>
                </div>
            </Modal>

            <Modal
                open={previewModal}
                onCancel={() => setPreviewModal(false)}
                footer={null}
                width={isMobile ? '95%' : 650}
                centered
                style={{ borderRadius: '20px' }}
                styles={{ body: { padding: isMobile ? '16px' : '24px' } }}
            >
                {selectedProduct && (
                    <div>
                        <div style={{
                            width: '100%',
                            height: isMobile ? '250px' : '400px',
                            background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            padding: '24px'
                        }}>
                            {selectedProduct.foto_url ? (
                                <img
                                    src={getImageUrl(selectedProduct.foto_url)}
                                    alt={selectedProduct.nombre}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : (
                                <ShoppingCartOutlined style={{ fontSize: '100px', color: '#cbd5e1' }} />
                            )}
                        </div>

                        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                            {selectedProduct.nombre}
                        </h2>
                        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '20px' }}>
                            Código: {selectedProduct.codigo}
                        </p>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
                            padding: '24px',
                            borderRadius: '14px',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>Precio</p>
                                <p style={{ fontSize: '32px', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                                    L. {parseFloat(selectedProduct.precio).toFixed(2)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>Stock</p>
                                <p style={{
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: selectedProduct.cantidad_existencia > 0 ? '#059669' : '#ef4444',
                                    margin: 0
                                }}>
                                    {selectedProduct.cantidad_existencia}
                                </p>
                            </div>
                        </div>

                        {selectedProduct.descripcion && (
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                                    Descripción:
                                </p>
                                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>
                                    {selectedProduct.descripcion}
                                </p>
                            </div>
                        )}

                        <Button
                            type="primary"
                            size="large"
                            block
                            disabled={selectedProduct.cantidad_existencia <= 0}
                            onClick={() => {
                                addToCart(selectedProduct);
                                setPreviewModal(false);
                            }}
                            icon={<PlusOutlined />}
                            style={{
                                background: selectedProduct.cantidad_existencia > 0 ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : undefined,
                                height: '56px',
                                fontSize: '18px',
                                fontWeight: '800',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: selectedProduct.cantidad_existencia > 0 ? '0 6px 20px rgba(30, 58, 138, 0.3)' : undefined
                            }}
                        >
                            {selectedProduct.cantidad_existencia > 0 ? 'Agregar al Carrito' : 'Producto Agotado'}
                        </Button>
                    </div>
                )}
            </Modal>

            <Modal
                open={successModal}
                onCancel={resetSale}
                footer={null}
                width={isMobile ? '98%' : 850}
                centered
                closable={true}
                className="invoice-modal-full"
                styles={{ body: { padding: isMobile ? '10px' : '20px' } }}
            >
                <div className="invoice-preview-container" style={{ padding: isMobile ? '5px' : '0' }}>
                    {/* Header Factura Responsivo */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '30px',
                        gap: '20px',
                        textAlign: isMobile ? 'center' : 'left'
                    }}>
                        <img src={logo} alt="Logo" style={{ width: '120px' }} />
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#000' }}>INVERSIONES MERCANTILES VILLAMIL</Title>
                            <Text style={{ display: 'block', fontSize: '12px' }}>Colonia Pinto Calle Principal Naco Cortes. SPS</Text>
                            <Text style={{ display: 'block', fontSize: '12px' }}>R.T.N. 05011998149871  Tel. 95086231- 96096433</Text>
                        </div>
                        <div style={{ textAlign: isMobile ? 'center' : 'right' }}>
                            <Title level={4} style={{ margin: 0, color: '#000', fontSize: '16px' }}>FACTURA DE VENTA</Title>
                            <Title level={5} style={{ margin: 0, color: '#000', fontSize: '14px' }}>N° FAC-{String(lastSaleData?.id_venta).padStart(7, '0')}</Title>
                        </div>
                    </div>

                    <Row gutter={24} style={{ marginBottom: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <Col xs={24} sm={12}>
                            <Text strong>Cliente: </Text>
                            <Text>{clientName || "Consumidor Final"}</Text>
                        </Col>
                        <Col xs={24} sm={12} style={{ textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? '10px' : '0' }}>
                            <Text strong>Fecha: </Text>
                            <Text>{new Date(lastSaleData?.fecha || new Date()).toLocaleDateString()}</Text>
                        </Col>
                    </Row>

                    <Table
                        dataSource={lastSaleData?.items || []}
                        columns={[
                            { title: 'Cant.', dataIndex: 'cantidad', key: 'qty', width: 80, align: 'center' },
                            { title: 'Descripción', dataIndex: 'nombre', key: 'desc' },
                            {
                                title: 'Precio Unit.',
                                dataIndex: 'precio_unitario',
                                key: 'price',
                                align: 'right',
                                render: (val) => `L. ${parseFloat(val || 0).toFixed(2)}`
                            },
                            {
                                title: 'Total',
                                dataIndex: 'subtotal',
                                key: 'total',
                                align: 'right',
                                render: (val) => <Text strong>L. {parseFloat(val || 0).toFixed(2)}</Text>
                            }
                        ]}
                        pagination={false}
                        rowKey={(record, index) => index}
                        className="custom-invoice-table"
                        style={{ marginBottom: '30px' }}
                    />

                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={14}>
                            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                <Text strong style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                                    TÉRMINOS Y CONDICIONES:
                                </Text>
                                <ul style={{ fontSize: '0.75rem', color: '#6b7280', paddingLeft: '15px', margin: 0 }}>
                                    <li>Los precios están sujetos a cambios sin previo aviso.</li>
                                    <li>Esta cotización tiene una validez de 15 días calendario.</li>
                                    <li>La entrega de materiales está sujeta a disponibilidad de inventario.</li>
                                </ul>
                            </div>
                        </Col>
                        <Col xs={24} md={10}>
                            <div style={{ textAlign: 'right' }}>
                                <Row justify="space-between" style={{ marginBottom: '4px' }}>
                                    <Text>Importe Gravado 15%:</Text>
                                    <Text>L. {(parseFloat(lastSaleData?.total || 0) / 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </Row>
                                <Row justify="space-between" style={{ marginBottom: '4px' }}>
                                    <Text>I.S.V. 15%:</Text>
                                    <Text>L. {(parseFloat(lastSaleData?.total || 0) - (parseFloat(lastSaleData?.total || 0) / 1.15)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </Row>
                                <Divider style={{ margin: '12px 0' }} />
                                <Row justify="space-between">
                                    <Text strong style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>Total A Pagar:</Text>
                                    <Text strong style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#163269' }}>
                                        L. {parseFloat(lastSaleData?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </Row>
                            </div>
                        </Col>
                    </Row>

                    <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <Row justify="space-between" align="bottom">
                            <Col span={12}>
                                <div style={{ borderTop: '1px solid #000', width: '250px', marginTop: '40px', textAlign: 'center' }}>
                                    <Text>Firma Autorizada</Text>
                                </div>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Text strong style={{ color: '#163269', display: 'block' }}>¡Gracias por su Preferencia!</Text>
                                <Text type="secondary" style={{ fontSize: '0.8rem' }}>La Factura es un compromiso de compra.</Text>
                            </Col>
                        </Row>
                    </div>
                </div>

                <div className="no-print" style={{ 
                    marginTop: '20px', 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '10px', 
                    justifyContent: 'center', 
                    borderTop: '1px solid #eee', 
                    paddingTop: '20px' 
                }}>
                    <Button size="large" onClick={resetSale} style={{ flex: isMobile ? '1 0 40%' : 'none' }}>
                        Cerrar
                    </Button>
                    <Button
                        size="large"
                        icon={<FilePdfOutlined />}
                        onClick={handleDownload}
                        style={{ flex: isMobile ? '1 0 40%' : 'none' }}
                    >
                        PDF
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PrinterOutlined />}
                        style={{ background: '#163269', flex: isMobile ? '1 0 40%' : 'none' }}
                        onClick={handlePrint}
                    >
                        Imprimir
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        style={{ background: '#059669', flex: isMobile ? '1 0 40%' : 'none' }}
                        onClick={resetSale}
                    >
                        Nueva
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Ventas;
