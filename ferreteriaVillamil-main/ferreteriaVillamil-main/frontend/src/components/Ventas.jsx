import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Table, Card, Row, Col, Typography, message, InputNumber, Modal, Badge } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, DeleteOutlined, SaveOutlined, UserOutlined, PlusOutlined, MinusOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Ventas = () => {
    const [articulos, setArticulos] = useState([]);
    const [filteredArticulos, setFilteredArticulos] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clientName, setClientName] = useState('');
    const [previewModal, setPreviewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const usuario = JSON.parse(localStorage.getItem('usuario'));

    useEffect(() => {
        fetchArticulos();
    }, []);

    const fetchArticulos = async (searchQuery = '') => {
        try {
            const params = searchQuery ? { search: searchQuery, limit: 100 } : { limit: 50 };
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list/active`,
                { params }
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

    const handleCheckout = async () => {
        if (cart.length === 0) {
            message.error("El carrito está vacío");
            return;
        }

        setLoading(true);
        try {
            const saleData = {
                cliente_nombre: clientName || "Cliente Contado",
                id_usuario_vendedor: usuario?.id_usuario,
                total: getTotal(),
                items: cart.map(item => ({
                    id_articulo: item.id_articulo,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.subtotal
                }))
            };

            await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/new`,
                saleData
            );

            message.success("Venta realizada con éxito");
            setCart([]);
            setClientName('');
            fetchArticulos();
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
            padding: '24px'
        }}>
            {/* Header Moderno */}
            <div style={{
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                padding: '28px 36px',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(30, 58, 138, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '14px',
                        borderRadius: '14px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <ShoppingCartOutlined style={{ fontSize: '36px', color: 'white' }} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, color: 'white', fontSize: '32px', fontWeight: '700' }}>
                            Punto de Venta
                        </h1>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                            Sistema de ventas rápido y eficiente
                        </p>
                    </div>
                </div>
            </div>

            <Row gutter={24} style={{ height: 'calc(100vh - 180px)' }}>
                {/* Panel Izquierdo: Productos */}
                <Col span={13} style={{ height: '100%' }}>
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: '20px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            border: 'none',
                            overflow: 'hidden'
                        }}
                        bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}
                    >
                        {/* Búsqueda Grande */}
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

                        {/* Grid de Productos */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <List
                                grid={{ gutter: 16, column: 2 }}
                                dataSource={filteredArticulos}
                                renderItem={item => (
                                    <List.Item>
                                        <Card
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
                                                        height: 160,
                                                        background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '16px',
                                                        position: 'relative',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        setSelectedProduct(item);
                                                        setPreviewModal(true);
                                                    }}
                                                >
                                                    {/* Badge de Stock */}
                                                    {item.cantidad_existencia <= 0 && (
                                                        <Badge.Ribbon text="AGOTADO" color="red" style={{ fontSize: '11px', fontWeight: '700' }} />
                                                    )}
                                                    {item.cantidad_existencia > 0 && item.cantidad_existencia <= 5 && (
                                                        <Badge.Ribbon text="BAJO STOCK" color="orange" style={{ fontSize: '11px', fontWeight: '700' }} />
                                                    )}

                                                    {/* Icono de Vista */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '12px',
                                                        left: '12px',
                                                        background: 'rgba(59, 130, 246, 0.9)',
                                                        color: 'white',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <EyeOutlined /> Ver
                                                    </div>

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
                                                        <ShoppingCartOutlined style={{ fontSize: '48px', color: '#cbd5e1' }} />
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
                                    </List.Item>
                                )}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Panel Derecho: Carrito */}
                <Col span={11} style={{ height: '100%' }}>
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: '20px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            border: 'none',
                            background: 'white'
                        }}
                        bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}
                    >
                        {/* Header Carrito */}
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

                        {/* Cliente */}
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

                        {/* Lista Carrito */}
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
                                                    min={1}
                                                    max={item.max_stock}
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

                        {/* Total y Botón */}
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
                                onClick={handleCheckout}
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
                                onMouseEnter={(e) => {
                                    if (cart.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 28px rgba(5, 150, 105, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (cart.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.3)';
                                    }
                                }}
                            >
                                PROCESAR VENTA
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Modal de Vista Previa */}
            <Modal
                open={previewModal}
                onCancel={() => setPreviewModal(false)}
                footer={null}
                width={650}
                centered
                style={{ borderRadius: '20px' }}
                styles={{ body: { padding: '24px' } }}
            >
                {selectedProduct && (
                    <div>
                        <div style={{
                            width: '100%',
                            height: '400px',
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
        </div>
    );
};

export default Ventas;
