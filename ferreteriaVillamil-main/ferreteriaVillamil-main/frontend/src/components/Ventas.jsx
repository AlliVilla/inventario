import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Table, Card, Row, Col, Typography, message, InputNumber, Statistic, Divider, Form, Modal } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, DeleteOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
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

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));

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
        // Debounce server-side search
        if (window.searchTimeout) clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            fetchArticulos(value);
        }, 300); // Wait 300ms after user stops typing
    };

    const addToCart = (articulo) => {
        const existingItem = cart.find(item => item.id_articulo === articulo.id_articulo);

        if (existingItem) {
            if (existingItem.cantidad + 1 > articulo.cantidad_existencia) {
                message.warning(`Solo hay ${articulo.cantidad_existencia} unidades disponibles de ${articulo.nombre}`);
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
            message.warning(`Maximo disponible: ${item.max_stock}`);
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
            fetchArticulos(); // Refresh stock
        } catch (error) {
            console.error("Error al procesar venta:", error);
            message.error("Falló la venta: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
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
                        style={{ border: '1px solid #f0f0f0' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{record.codigo}</div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>L.</span>
                    <InputNumber
                        min={0}
                        step={0.01}
                        value={price}
                        onChange={(val) => updatePrice(record.id_articulo, val)}
                        size="small"
                        style={{ width: '75px', textAlign: 'right', fontWeight: 'bold' }}
                    />
                </div>
            )
        },
        {
            title: 'Cant.',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'center',
            width: '20%',
            render: (qty, record) => (
                <InputNumber
                    min={1}
                    max={record.max_stock}
                    value={qty}
                    onChange={(val) => updateQuantity(record.id_articulo, val)}
                    size="middle"
                    style={{ width: '60px' }}
                />
            )
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            align: 'right',
            width: '20%',
            render: (sub) => <span style={{ fontWeight: '700', fontSize: '1rem', color: '#163269' }}>L. {sub.toFixed(2)}</span>
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
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    return (
        <div style={{ height: 'calc(100vh - 100px)', padding: '20px' }}>
            <Row gutter={24} style={{ height: '100%' }}>
                {/* Left Panel: Product List */}
                <Col span={12} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        title={<Input
                            placeholder="Buscar productos por nombre o código..."
                            prefix={<SearchOutlined />}
                            size="large"
                            allowClear
                            onChange={(e) => handleSearch(e.target.value)}
                        />}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, overflowY: 'auto' }}
                    >
                        <List
                            grid={{ gutter: 16, column: 2 }}
                            dataSource={filteredArticulos}
                            renderItem={item => (
                                <List.Item>
                                    <Card
                                        hoverable
                                        cover={
                                            <div
                                                style={{
                                                    height: 150,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    background: '#fff',
                                                    padding: '10px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    setSelectedProduct(item);
                                                    setPreviewModal(true);
                                                }}
                                            >
                                                {item.foto_url ? (
                                                    <img
                                                        alt={item.nombre}
                                                        src={getImageUrl(item.foto_url)}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'contain'
                                                        }}
                                                    />
                                                ) : <ShoppingCartOutlined style={{ fontSize: 40, color: '#ccc' }} />}
                                            </div>
                                        }
                                        actions={[
                                            <Button
                                                type="primary"
                                                disabled={item.cantidad_existencia <= 0}
                                                block
                                                onClick={() => addToCart(item)}
                                            >
                                                {item.cantidad_existencia > 0 ? "Agregar" : "Agotado"}
                                            </Button>
                                        ]}
                                    >
                                        <Card.Meta
                                            title={item.nombre}
                                            description={
                                                <div>
                                                    <div style={{ color: '#163269', fontWeight: 'bold', fontSize: '1.2em' }}>
                                                        L. {item.precio}
                                                    </div>
                                                    <div style={{ fontSize: '0.9em' }}>
                                                        Stock: {item.cantidad_existencia}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* Right Panel: Cart */}
                <Col span={12} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        className="shadow-lg border-0"
                        title={
                            <div className="flex items-center gap-2 py-2">
                                <ShoppingCartOutlined className="text-2xl text-[#163269]" />
                                <span className="text-xl font-bold text-[#163269]">Resumen de Compra</span>
                            </div>
                        }
                        style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px 12px 12px', backgroundColor: '#fff' }}
                        headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                    >
                        <div className="p-4 bg-gray-50 rounded-lg mb-4 mt-4 border border-gray-100">
                            <Input
                                placeholder="Nombre del Cliente (Opcional)"
                                prefix={<UserOutlined className="text-gray-400" />}
                                size="large"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="rounded-md"
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', overflowX: 'hidden' }}>
                            <Table
                                dataSource={cart}
                                columns={columns}
                                rowKey="id_articulo"
                                pagination={false}
                                size="middle"
                                scroll={{ y: 'calc(100vh - 450px)', x: false }}
                            />
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl mt-4 border border-gray-200">
                            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                                <span className="text-gray-500 text-lg font-medium">Total a Pagar:</span>
                                <span className="text-3xl font-extrabold text-[#163269]">L. {getTotal().toFixed(2)}</span>
                            </Row>

                            <Button
                                type="primary"
                                size="large"
                                icon={<SaveOutlined />}
                                loading={loading}
                                onClick={handleCheckout}
                                block
                                style={{
                                    backgroundColor: '#163269',
                                    height: '56px',
                                    fontSize: '1.2rem',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 14px 0 rgba(22, 50, 105, 0.39)'
                                }}
                            >
                                PROCESAR VENTA
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Product Preview Modal */}
            <Modal
                open={previewModal}
                onCancel={() => setPreviewModal(false)}
                footer={null}
                width={600}
                centered
            >
                {selectedProduct && (
                    <div className="p-4">
                        <div className="flex flex-col items-center">
                            {/* Product Image */}
                            <div style={{
                                width: '100%',
                                maxHeight: '400px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: '#f9fafb',
                                padding: '20px',
                                borderRadius: '12px',
                                marginBottom: '20px'
                            }}>
                                {selectedProduct.foto_url ? (
                                    <img
                                        alt={selectedProduct.nombre}
                                        src={getImageUrl(selectedProduct.foto_url)}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '350px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                ) : (
                                    <ShoppingCartOutlined style={{ fontSize: 80, color: '#ccc' }} />
                                )}
                            </div>

                            {/* Product Details */}
                            <div className="w-full">
                                <h2 className="text-2xl font-bold text-[#163269] mb-2">{selectedProduct.nombre}</h2>
                                <p className="text-gray-500 mb-4">Código: {selectedProduct.codigo}</p>

                                <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Precio</p>
                                        <p className="text-3xl font-bold text-[#163269]">L. {selectedProduct.precio}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Stock Disponible</p>
                                        <p className={`text-2xl font-bold ${selectedProduct.cantidad_existencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedProduct.cantidad_existencia}
                                        </p>
                                    </div>
                                </div>

                                {selectedProduct.descripcion && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Descripción:</p>
                                        <p className="text-gray-600">{selectedProduct.descripcion}</p>
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
                                    style={{
                                        backgroundColor: '#163269',
                                        height: '50px',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {selectedProduct.cantidad_existencia > 0 ? 'Agregar al Carrito' : 'Producto Agotado'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Ventas;
