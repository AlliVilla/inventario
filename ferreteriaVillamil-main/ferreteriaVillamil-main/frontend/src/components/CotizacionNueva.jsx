import React, { useState, useEffect } from 'react';
import { Input, Avatar, Button, Table, Card, Row, Col, Typography, message, InputNumber, Divider, Modal, Space, Empty } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, DeleteOutlined, PrinterOutlined, FilePdfOutlined, UserOutlined, ClearOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FerreteriaLogo from '../assets/LogoFerreteriaVillamil.png';

const { Title, Text } = Typography;

const CotizacionNueva = () => {
    const [articulos, setArticulos] = useState([]);
    const [filteredArticulos, setFilteredArticulos] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [cart, setCart] = useState([]);
    const [clientName, setClientName] = useState('');
    const [previewModal, setPreviewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeTab, setActiveTab] = useState('inventory');
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const userStr = localStorage.getItem('user');
    const usuarioLogueado = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        fetchArticulos();
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
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (response.data && response.data.data) {
                setArticulos(response.data.data);
                setFilteredArticulos(response.data.data);
            }
        } catch (error) {
            console.error("Error cargando artículos:", error);
            message.error("Error al cargar inventario");
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
            const updatedCart = cart.map(item =>
                item.id_articulo === articulo.id_articulo
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
                    : item
            );
            setCart(updatedCart);
        } else {
            setCart([...cart, {
                id_articulo: articulo.id_articulo,
                codigo: articulo.codigo,
                nombre: articulo.nombre,
                precio_unitario: parseFloat(articulo.precio),
                cantidad: 1,
                subtotal: parseFloat(articulo.precio),
                foto_url: articulo.foto_url
            }]);
        }
        message.success(`${articulo.nombre} agregado`);
    };

    const updateQuantity = (id_articulo, quantity) => {
        if (quantity < 1) quantity = 1;

        const updatedCart = cart.map(item =>
            item.id_articulo === id_articulo
                ? { ...item, cantidad: quantity, subtotal: quantity * item.precio_unitario }
                : item
        );
        setCart(updatedCart);
    };

    const updatePrice = (id_articulo, newPrice) => {
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

    const generatePDF = async () => {
        if (cart.length === 0) {
            message.error("No hay productos en la cotización");
            return;
        }

        const hide = message.loading("Guardando cotización...", 0);

        try {
            // Guardar en la base de datos
            const cotizacionData = {
                cliente_nombre: clientName || "Cliente General",
                total: getTotal(),
                items: cart.map(item => ({
                    id_articulo: item.id_articulo,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.subtotal
                })),
                id_usuario_vendedor: usuarioLogueado?.id_usuario || usuarioLogueado?.id || 1
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/cotizaciones`, cotizacionData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            hide();
            message.success("Cotización guardada y lista para descargar");
        } catch (error) {
            hide();
            console.error("Error al guardar cotización:", error);
            message.error("Error al guardar la cotización en el servidor");
            return; // No descargar PDF si falló el guardado
        }

        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // Header
        doc.addImage(FerreteriaLogo, 'PNG', 15, 10, 50, 30);
        doc.setFontSize(18);
        doc.text("Ferretería Villamil", 70, 20);
        doc.setFontSize(10);
        doc.text("Cotización de Productos", 70, 28);
        doc.text(`Fecha: ${date}`, 70, 34);
        doc.text(`Cliente: ${clientName || "Consumidor Final"}`, 15, 50);

        const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Subtotal"];
        const tableRows = cart.map(item => [
            item.nombre,
            item.cantidad,
            `L. ${item.precio_unitario.toFixed(2)}`,
            `L. ${item.subtotal.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 60,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [22, 50, 105] }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(`Total a Pagar: L. ${getTotal().toFixed(2)}`, 140, finalY);

        doc.save(`Cotizacion_${clientName || "General"}_${date.replace(/\//g, '-')}.pdf`);
        setCart([]);
        setClientName("");
        setSearchText("");
        navigate('/admin/cotizaciones');
    };

    const columns = [
        {
            title: 'Producto',
            dataIndex: 'nombre',
            key: 'nombre',
            width: '40%',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar
                        src={getImageUrl(record.foto_url)}
                        icon={<ShoppingCartOutlined />}
                        shape="square"
                        size={48}
                    />
                    <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{text}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{record.codigo}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Precio',
            dataIndex: 'precio_unitario',
            key: 'precio',
            align: 'right',
            width: '25%',
            render: (price, record) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span style={{ color: '#888' }}>L.</span>
                    <InputNumber
                        min={0}
                        step={0.01}
                        value={price}
                        onChange={(val) => updatePrice(record.id_articulo, val)}
                        size="middle"
                        style={{ width: '100px', textAlign: 'right', fontWeight: 'bold' }}
                    />
                </div>
            )
        },
        {
            title: 'Cant.',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'center',
            width: '15%',
            render: (qty, record) => (
                <InputNumber
                    min={1}
                    value={qty}
                    onChange={(val) => updateQuantity(record.id_articulo, val)}
                    size="middle"
                    style={{ width: '70px' }}
                />
            )
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            align: 'right',
            width: '20%',
            render: (sub) => <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#163269' }}>L. {sub.toFixed(2)}</span>
        },
        {
            title: '',
            key: 'action',
            width: '5%',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(record.id_articulo)}
                />
            )
        }
    ];

    const getImageUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') return undefined; // undefined evita que Avatar intente cargar "/null"
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    return (
        <div style={{
            padding: isMobile ? '12px' : '30px',
            background: '#f8fafc',
            minHeight: '100vh'
        }}>
            {/* Header / Breadcrumb */}
            <div style={{
                marginBottom: isMobile ? '20px' : '30px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '12px' : '16px',
                background: 'white',
                padding: isMobile ? '15px' : '20px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/cotizaciones')} shape="circle" size={isMobile ? "middle" : "large"} />
                <div>
                    <Title level={isMobile ? 4 : 2} style={{ color: '#163269', margin: 0 }}>Nueva Cotización</Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>Crea una nueva propuesta para tu cliente</Text>
                </div>
            </div>

            {/* Selector de Pestañas para Móvil */}
            {isMobile && (
                <div style={{
                    display: 'flex',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '4px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <Button
                        type={activeTab === 'inventory' ? 'primary' : 'text'}
                        onClick={() => setActiveTab('inventory')}
                        style={{
                            flex: 1,
                            height: '45px',
                            borderRadius: '10px',
                            background: activeTab === 'inventory' ? '#163269' : 'transparent',
                            fontWeight: '600'
                        }}
                    >
                        <SearchOutlined /> Inventario
                    </Button>
                    <Button
                        type={activeTab === 'cart' ? 'primary' : 'text'}
                        onClick={() => setActiveTab('cart')}
                        style={{
                            flex: 1,
                            height: '45px',
                            borderRadius: '10px',
                            background: activeTab === 'cart' ? '#163269' : 'transparent',
                            fontWeight: '600'
                        }}
                    >
                        <ShoppingCartOutlined /> Cotización {cart.length > 0 && `(${cart.length})`}
                    </Button>
                </div>
            )}

            <Row gutter={isMobile ? [0, 0] : 24}>
                {/* Left Panel: Search and Add */}
                {(!isMobile || activeTab === 'inventory') && (
                    <Col xs={24} md={10}>
                        <Card
                            title={
                                <Input
                                    placeholder="Buscar productos..."
                                    prefix={<SearchOutlined />}
                                    size="large"
                                    allowClear
                                    onChange={(e) => handleSearch(e.target.value)}
                                    style={{ borderRadius: '8px' }}
                                />
                            }
                            style={{
                                height: isMobile ? 'auto' : 'calc(100vh - 220px)',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                            styles={{ body: { flex: 1, overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '12px' : '16px' } }}
                        >
                            <div style={{ padding: '2px' }}>
                                {filteredArticulos.length > 0 ? (
                                    filteredArticulos.map(item => (
                                        <div
                                            key={item.id_articulo}
                                            style={{
                                                padding: '12px',
                                                cursor: 'pointer',
                                                borderRadius: '12px',
                                                transition: 'all 0.2s',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                border: '1px solid #f1f5f9',
                                                background: '#fff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                            onClick={() => addToCart(item)}
                                        >
                                            <Avatar
                                                src={getImageUrl(item.foto_url)}
                                                shape="square"
                                                size={isMobile ? 48 : 54}
                                                style={{ backgroundColor: '#f0f2f5', color: '#163269', borderRadius: '8px' }}
                                                icon={<ShoppingCartOutlined />}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: isMobile ? '14px' : '16px', color: '#1f2937' }}>{item.nombre}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                                    <Text strong style={{ color: '#163269' }}>L. {parseFloat(item.precio).toFixed(2)}</Text>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>Stock: {item.cantidad_existencia}</Text>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Empty description="No se encontraron productos" style={{ marginTop: '40px' }} />
                                )}
                            </div>
                        </Card>
                    </Col>
                )}

                {/* Right Panel: Transaction Table */}
                {(!isMobile || activeTab === 'cart') && (
                    <Col xs={24} md={14}>
                        <Card
                            style={{
                                height: isMobile ? 'auto' : 'calc(100vh - 160px)',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '16px' : '24px', overflow: 'hidden' } }}
                        >
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ marginBottom: '8px', fontWeight: '500', color: '#64748b' }}>Nombre del Cliente:</div>
                                <Input
                                    placeholder="Nombre del cliente..."
                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                    size="large"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    style={{ borderRadius: '8px' }}
                                />
                            </div>

                            <div style={{ flex: 1, overflow: 'auto', marginBottom: '20px', minHeight: isMobile ? '300px' : 'auto' }}>
                                {isMobile ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {cart.length === 0 ? (
                                            <Empty description="No hay productos seleccionados" />
                                        ) : (
                                            cart.map((item, idx) => (
                                                <div key={item.id_articulo || idx} style={{
                                                    background: '#f8fafc',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <Text strong style={{ fontSize: '14px' }}>{item.nombre}</Text>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => removeFromCart(item.id_articulo)}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <Text type="secondary">Precio:</Text>
                                                        <InputNumber
                                                            size="small"
                                                            value={item.precio_unitario}
                                                            onChange={(val) => updatePrice(item.id_articulo, val)}
                                                            style={{ width: '90px' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <Text type="secondary">Cantidad:</Text>
                                                        <InputNumber
                                                            size="middle"
                                                            min={0.1}
                                                            value={item.cantidad}
                                                            onChange={(val) => updateQuantity(item.id_articulo, val)}
                                                            style={{ width: '70px' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                                                        <Text strong>Subtotal:</Text>
                                                        <Text strong style={{ color: '#163269' }}>L. {item.subtotal.toFixed(2)}</Text>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <Table
                                        dataSource={cart}
                                        columns={columns}
                                        rowKey="id_articulo"
                                        pagination={false}
                                        size="middle"
                                        locale={{ emptyText: "Selecciona productos del listado a la izquierda" }}
                                        scroll={{ y: 'calc(100vh - 540px)' }}
                                    />
                                )}
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <Divider style={{ margin: '12px 0' }} />

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <Title level={isMobile ? 5 : 4} style={{ color: '#6b7280', margin: 0 }}>Total Cotizado:</Title>
                                    <Title level={isMobile ? 3 : 2} style={{ color: '#163269', margin: 0 }}>L. {getTotal().toFixed(2)}</Title>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Button
                                        size="large"
                                        onClick={() => {
                                            setCart([]);
                                            setClientName('');
                                            message.info("Formulario limpiado");
                                        }}
                                        icon={<ClearOutlined />}
                                        style={{ flex: 1, height: isMobile ? '45px' : '50px', borderRadius: '10px' }}
                                    >
                                        Limpiar
                                    </Button>
                                    <Button
                                        type="primary"
                                        size="large"
                                        disabled={cart.length === 0}
                                        onClick={generatePDF}
                                        icon={<FilePdfOutlined />}
                                        style={{
                                            flex: 2,
                                            color: '#ffffff',
                                            backgroundColor: '#344b70ff',
                                            height: isMobile ? '45px' : '50px',
                                            borderRadius: '10px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {isMobile ? 'Guardar PDF' : 'Guardar y Exportar PDF'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default CotizacionNueva;
