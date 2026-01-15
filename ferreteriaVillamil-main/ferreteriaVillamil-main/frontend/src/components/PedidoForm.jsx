import React, { useEffect, useState } from 'react';
import { Avatar, message, Modal, Input, Button, Table, Card, Row, Col, Typography, InputNumber, Divider, Space, List, Tag, Empty } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, DeleteOutlined, UserOutlined, PhoneOutlined, IdcardOutlined, EnvironmentOutlined, MessageOutlined, PlusOutlined, ArrowLeftOutlined, ExpandOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

function NuevoPedidoForm() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const id_admin_creador = usuario?.id_usuario;
    const navigate = useNavigate();
    const [form, setForm] = useState({
        numero_pedido: "",
        cliente_nombre: "",
        cliente_telefono: "",
        cliente_identidad: "",
        id_admin_creador: id_admin_creador,
        estado: 'Pendiente',
        costo_envio: 0.0,
        total: 0.0,
        direccion_entrega: "",
        observacion: "",
    })
    const [loading, setLoading] = useState(false);

    const [articulos, setArticulos] = useState([]);
    const [filteredArticulos, setFilteredArticulos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [detalles, setDetalles] = useState([]);
    const [isCartModalVisible, setIsCartModalVisible] = useState(false);

    const fetchArticulos = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list/active`,
                {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    }
                }
            );
            setArticulos(response.data.data);
            setFilteredArticulos(response.data.data);
        } catch (error) {
            console.error("Error cargando artículos:", error);
            message.error("No se pudieron cargar los productos. Verifique su sesión.");
        }
    }

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (!value) {
            setFilteredArticulos(articulos);
            return;
        }
        const lower = value.toLowerCase();
        const filtered = articulos.filter(a =>
            a.nombre.toLowerCase().includes(lower) ||
            a.codigo.toLowerCase().includes(lower)
        );
        setFilteredArticulos(filtered);
    };

    useEffect(() => {
        fetchArticulos();
    }, []);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value })
        console.log(form);
    }

    const handleIdentidad = (event) => {
        let value = event.target.value.replace(/\D/g, "");
        if (value.length > 4 && value.length <= 8) {
            value = value.slice(0, 4) + "-" + value.slice(4);
        } else if (value.length > 8) {
            value = value.slice(0, 4) + "-" + value.slice(4, 8) + "-" + value.slice(8, 13);
        }
        handleChange({
            target: { name: event.target.name, value }
        });
    }

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedidos/newPedido`, { ...form, numero_pedido: "PED" }, config);

            const id_pedido = response.data.data.id_pedido;
            const idFormat = String(id_pedido).padStart(3, '0');
            const numeroPedidoNew = `PED${idFormat}`;

            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedidos/updatePedido/${id_pedido}`, { numero_pedido: numeroPedidoNew }, config);

            message.success('Pedido creado exitosamente');
            setForm({
                numero_pedido: "",
                cliente_nombre: "",
                cliente_telefono: "",
                cliente_identidad: "",
                id_admin_creador: id_admin_creador,
                estado: 'Pendiente',
                costo_envio: 0.0,
                total: 0.0,
                direccion_entrega: "",
                observacion: "",
            });

            const detallesConPedido = detalles.map(({ nombre, ...det }) => ({
                ...det,
                id_pedido
            }));

            console.log(detallesConPedido)

            await Promise.all(
                detallesConPedido.map(detalle =>
                    axios.post(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/detalles/new`,
                        detalle,
                        {
                            headers: {
                                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                            }
                        }
                    )
                )
            );
            navigate('/admin/pedidos');
        } catch (err) {
            message.error(`Error al crear pedido`);
            console.log(err)
        } finally {
            setLoading(false);
        }
    }

    const handleCancel = () => {
        navigate("/admin/pedidos")
    }

    const agregarArticulo = (art) => {
        if (!art) return;

        // Validar Stock
        if (art.cantidad_existencia < 1) {
            message.warning(`El producto ${art.nombre} no tiene stock disponible.`);
            return;
        }

        const existe = detalles.find(d => d.id_articulo === art.id_articulo);
        if (existe) {
            if (art.cantidad_existencia < (existe.cantidad + 1)) {
                message.warning(`Stock insuficiente para agregar más de ${art.nombre}.`);
                return;
            }

            const nuevos = detalles.map(d =>
                d.id_articulo === art.id_articulo ? { ...d, cantidad: d.cantidad + 1, subtotal: (d.cantidad + 1) * d.precio_unitario } : d
            );
            setDetalles(nuevos);

            setForm(prev => ({
                ...prev,
                total: prev.total + art.precio
            }));
        } else {
            setDetalles([
                ...detalles,
                {
                    id_articulo: art.id_articulo,
                    nombre: art.nombre,
                    precio_unitario: Number(art.precio),
                    cantidad: 1,
                    subtotal: Number(art.precio)
                }
            ]);

            setForm(prev => ({
                ...prev,
                total: prev.total + Number(art.precio)
            }));
        }

        message.success(`${art.nombre} agregado al pedido`);
    };

    const columns = [
        {
            title: 'Producto',
            dataIndex: 'nombre',
            key: 'nombre',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Precio',
            dataIndex: 'precio_unitario',
            key: 'precio',
            align: 'right',
            render: (val) => `L. ${val.toFixed(2)}`
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'center',
            render: (qty, record) => (
                <InputNumber
                    min={1}
                    value={qty}
                    onChange={(val) => {
                        const artReal = articulos.find(a => a.id_articulo === record.id_articulo);
                        if (val > artReal.cantidad_existencia) {
                            message.warning("Cantidad excede el stock");
                            val = artReal.cantidad_existencia;
                        }
                        const nuevos = detalles.map(d =>
                            d.id_articulo === record.id_articulo ? { ...d, cantidad: val, subtotal: val * d.precio_unitario } : d
                        );
                        setDetalles(nuevos);
                        const nuevoTotal = nuevos.reduce((acc, curr) => acc + curr.subtotal, 0);
                        setForm(prev => ({ ...prev, total: nuevoTotal }));
                    }}
                />
            )
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            align: 'right',
            render: (val) => <Text strong style={{ color: '#163269' }}>L. {val.toFixed(2)}</Text>
        },
        {
            title: '',
            key: 'action',
            render: (_, record, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                        const sub = record.subtotal;
                        setDetalles(prev => prev.filter((_, i) => i !== index));
                        setForm(prev => ({ ...prev, total: prev.total - sub }));
                    }}
                />
            )
        }
    ];

    const getImageUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') return undefined;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    const eliminarDetalle = (index) => {
        Modal.confirm({
            title: "¿Eliminar detalle?",
            content: "Esta acción no se puede deshacer.",
            okText: "Eliminar",
            cancelText: "Cancelar",
            okType: "danger",
            onOk() {
                setDetalles(prev => prev.filter((_, i) => i !== index));
            }
        });
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header Superior */}
            <div style={{
                marginBottom: '24px',
                background: '#fff',
                padding: '20px 30px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleCancel}
                        shape="circle"
                        size="large"
                        style={{ border: 'none', background: '#f5f5f5' }}
                    />
                    <div>
                        <Title level={3} style={{ color: '#163269', margin: 0 }}>Nuevo Pedido</Title>
                        <Text type="secondary">Selecciona productos y completa los datos del cliente</Text>
                    </div>
                </div>

                <Input
                    placeholder="Buscar producto por nombre o código..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    size="large"
                    allowClear
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: '400px', borderRadius: '12px' }}
                />
            </div>

            <Row gutter={24}>
                {/* Panel Central: Grid de Productos */}
                <Col span={15}>
                    <div style={{
                        height: 'calc(100vh - 180px)',
                        overflowY: 'auto',
                        paddingRight: '8px'
                    }} className="custom-scroll">
                        {filteredArticulos.length > 0 ? (
                            <Row gutter={[16, 16]}>
                                {filteredArticulos.map(item => (
                                    <Col span={8} key={item.id_articulo}>
                                        <Card
                                            hoverable
                                            style={{
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }}
                                            styles={{ body: { padding: '12px' } }}
                                            cover={
                                                <div style={{
                                                    height: '140px',
                                                    background: '#f8fafc',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <img
                                                        alt={item.nombre}
                                                        src={getImageUrl(item.foto_url)}
                                                        style={{
                                                            maxHeight: '100%',
                                                            maxWidth: '100%',
                                                            objectFit: 'contain',
                                                            padding: '10px'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
                                                        }}
                                                    />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px'
                                                    }}>
                                                        <Tag color={item.cantidad_existencia > 10 ? 'green' : item.cantidad_existencia > 0 ? 'orange' : 'red'} style={{ borderRadius: '6px' }}>
                                                            {item.cantidad_existencia} en stock
                                                        </Tag>
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1f2937', height: '40px', overflow: 'hidden' }}>
                                                    {item.nombre}
                                                </div>
                                                <Text type="secondary" style={{ fontSize: '0.75rem' }}>SKU: {item.codigo}</Text>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#163269' }}>
                                                    L. {parseFloat(item.precio).toLocaleString()}
                                                </span>
                                                <Button
                                                    type="primary"
                                                    shape="circle"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => agregarArticulo(item)}
                                                    disabled={item.cantidad_existencia <= 0}
                                                    style={{ background: '#163269' }}
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '16px' }}>
                                <Empty description="No se encontraron productos coincidentes" />
                            </Card>
                        )}
                    </div>
                </Col>

                {/* Panel Derecho: Resumen y Datos (Optimizado con scroll fijo) */}
                <Col span={9}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100vh - 140px)',
                        gap: '15px'
                    }}>
                        {/* Datos Cliente - Compacto pero legible */}
                        <Card
                            title={<Title level={5} style={{ margin: 0 }}><UserOutlined /> Datos de Entrega</Title>}
                            style={{ borderRadius: '16px', flexShrink: 0, border: '2px solid #e6e6e6' }}
                            styles={{ body: { padding: '15px' } }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size={10}>
                                <Input
                                    placeholder="Nombre del Cliente"
                                    name="cliente_nombre"
                                    value={form.cliente_nombre}
                                    onChange={handleChange}
                                    prefix={<UserOutlined style={{ color: '#163269' }} />}
                                    size="large"
                                    style={{ fontSize: '1.1rem', fontWeight: '600' }}
                                />
                                <Row gutter={10}>
                                    <Col span={12}>
                                        <Input
                                            placeholder="Teléfono"
                                            name="cliente_telefono"
                                            value={form.cliente_telefono}
                                            onChange={handleChange}
                                            prefix={<PhoneOutlined style={{ color: '#163269' }} />}
                                            size="large"
                                            style={{ fontSize: '1.1rem' }}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Input
                                            placeholder="Identidad"
                                            name="cliente_identidad"
                                            value={form.cliente_identidad}
                                            onChange={handleIdentidad}
                                            prefix={<IdcardOutlined style={{ color: '#163269' }} />}
                                            maxLength={17}
                                            size="large"
                                            style={{ fontSize: '1.1rem' }}
                                        />
                                    </Col>
                                </Row>
                                <Input.TextArea
                                    placeholder="Dirección exacta..."
                                    name="direccion_entrega"
                                    value={form.direccion_entrega}
                                    onChange={handleChange}
                                    rows={2}
                                    style={{ fontSize: '1.1rem' }}
                                />
                            </Space>
                        </Card>

                        {/* Carrito / Resumen - Altura Flexible con scroll interno */}
                        <Card
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <ShoppingCartOutlined style={{ fontSize: '1.2rem' }} />
                                        <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>Tu Orden</span>
                                        <Tag color="geekblue" style={{ fontSize: '1rem' }}>{detalles.length}</Tag>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={<ExpandOutlined style={{ fontSize: '1.2rem', color: '#163269' }} />}
                                        onClick={() => setIsCartModalVisible(true)}
                                        title="Ver en grande"
                                    />
                                </div>
                            }
                            style={{
                                borderRadius: '16px',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                border: '2px solid #163269',
                                overflow: 'hidden'
                            }}
                            styles={{ body: { flex: 1, padding: 0, overflowY: 'hidden', display: 'flex', flexDirection: 'column' } }}
                        >
                            {/* Lista scrolleable */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                                <Table
                                    dataSource={detalles}
                                    pagination={false}
                                    rowKey="id_articulo"
                                    showHeader={false}
                                    columns={[
                                        {
                                            title: 'Producto',
                                            key: 'info',
                                            render: (_, record) => (
                                                <div style={{ padding: '10px 0' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#163269', marginBottom: '4px' }}>{record.nombre}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#595959', fontWeight: 'bold' }}>L.</span>
                                                        <InputNumber
                                                            size="small"
                                                            min={0}
                                                            value={record.precio_unitario}
                                                            style={{ width: '110px', fontSize: '1rem', fontWeight: '700' }}
                                                            onChange={(val) => {
                                                                const nuevoPrecio = parseFloat(val) || 0;
                                                                const nuevos = detalles.map(d =>
                                                                    d.id_articulo === record.id_articulo
                                                                        ? { ...d, precio_unitario: nuevoPrecio, subtotal: d.cantidad * nuevoPrecio }
                                                                        : d
                                                                );
                                                                setDetalles(nuevos);
                                                                const nuevoTotal = nuevos.reduce((acc, curr) => acc + curr.subtotal, 0);
                                                                setForm(prev => ({ ...prev, total: nuevoTotal }));
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        },
                                        {
                                            title: 'Control',
                                            key: 'qty_control',
                                            width: 100,
                                            render: (_, record) => (
                                                <InputNumber
                                                    size="large"
                                                    min={1}
                                                    value={record.cantidad}
                                                    style={{ width: '70px', fontSize: '1.1rem', fontWeight: '700' }}
                                                    onChange={(val) => {
                                                        const artReal = articulos.find(a => a.id_articulo === record.id_articulo);
                                                        if (val > (artReal?.cantidad_existencia || 0)) {
                                                            message.warning("Stock alcanzado");
                                                            val = artReal.cantidad_existencia;
                                                        }
                                                        const nuevos = detalles.map(d =>
                                                            d.id_articulo === record.id_articulo ? { ...d, cantidad: val, subtotal: val * d.precio_unitario } : d
                                                        );
                                                        setDetalles(nuevos);
                                                        const nuevoTotal = nuevos.reduce((acc, curr) => acc + curr.subtotal, 0);
                                                        setForm(prev => ({ ...prev, total: nuevoTotal }));
                                                    }}
                                                />
                                            )
                                        },
                                        {
                                            title: 'Accion',
                                            key: 'action',
                                            width: 45,
                                            render: (_, record, index) => (
                                                <Button
                                                    type="primary"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="mid"
                                                    onClick={() => {
                                                        const sub = record.subtotal;
                                                        setDetalles(prev => prev.filter((_, i) => i !== index));
                                                        setForm(prev => ({ ...prev, total: prev.total - sub }));
                                                    }}
                                                />
                                            )
                                        }
                                    ]}
                                />
                            </div>

                            {/* Totales Fijos abajo */}
                            <div style={{
                                padding: '15px',
                                background: '#f8fafc',
                                borderTop: '2px solid #e6e6e6'
                            }}>
                                <div style={{
                                    padding: '15px',
                                    background: '#163269',
                                    color: '#fff',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>Subtotal:</Text>
                                        <Text style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>L. {parseFloat(form.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>Envío:</Text>
                                        <InputNumber
                                            min={0}
                                            size="small"
                                            value={form.costo_envio}
                                            onChange={(val) => setForm(prev => ({ ...prev, costo_envio: val || 0 }))}
                                            style={{ width: '90px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontWeight: '700' }}
                                            prefix={<span style={{ color: '#fff' }}>L.</span>}
                                        />
                                    </div>
                                    <Divider style={{ background: 'rgba(255,255,255,0.2)', margin: '10px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.1rem' }}>TOTAL A PAGAR:</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: '900' }}>
                                            L. {(Number(form.total) + Number(form.costo_envio)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={handleSubmit}
                                    style={{
                                        height: '60px',
                                        marginTop: '15px',
                                        borderRadius: '12px',
                                        background: '#BC7D3B',
                                        fontSize: '1.4rem',
                                        fontWeight: '800'
                                    }}
                                    loading={loading}
                                    disabled={detalles.length === 0}
                                >
                                    GUARDAR PEDIDO
                                </Button>
                            </div>
                        </Card>
                    </div>
                </Col>
            </Row>

            {/* Modal de Vista Ampliada (XL) */}
            <Modal
                title={
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <Space size="middle">
                            <div style={{ background: '#163269', padding: '10px', borderRadius: '12px' }}>
                                <ShoppingCartOutlined style={{ fontSize: '1.8rem', color: '#fff' }} />
                            </div>
                            <div>
                                <Text strong style={{ fontSize: '1.6rem', color: '#163269', display: 'block', lineHeight: 1.2 }}>
                                    Resumen Detallado de la Orden
                                </Text>
                                <Text type="secondary" style={{ fontSize: '1rem' }}>Revisa y ajusta los detalles antes de procesar el pedido</Text>
                            </div>
                        </Space>
                    </div>
                }
                open={isCartModalVisible}
                onCancel={() => setIsCartModalVisible(false)}
                width={1100}
                footer={null}
                centered
                styles={{ body: { padding: '24px' } }}
            >
                <Row gutter={40}>
                    <Col span={15}>
                        <div style={{ background: '#fff', borderRadius: '16px' }}>
                            <Table
                                dataSource={detalles}
                                pagination={false}
                                rowKey="id_articulo"
                                scroll={{ y: 450 }}
                                columns={[
                                    {
                                        title: <Text type="secondary" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>PRODUCTO</Text>,
                                        dataIndex: 'nombre',
                                        key: 'nombre',
                                        render: (text) => (
                                            <div style={{ padding: '8px 0' }}>
                                                <Text strong style={{ fontSize: '1.2rem', color: '#163269' }}>{text}</Text>
                                            </div>
                                        )
                                    },
                                    {
                                        title: <Text type="secondary" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>PRECIO (L.)</Text>,
                                        dataIndex: 'precio_unitario',
                                        key: 'precio',
                                        width: 160,
                                        render: (val, record) => (
                                            <InputNumber
                                                size="large"
                                                min={0}
                                                value={val}
                                                style={{ width: '130px', fontSize: '1.2rem', fontWeight: '700', borderRadius: '8px' }}
                                                onChange={(newVal) => {
                                                    const v = parseFloat(newVal) || 0;
                                                    const nuevos = detalles.map(d =>
                                                        d.id_articulo === record.id_articulo ? { ...d, precio_unitario: v, subtotal: v * d.cantidad } : d
                                                    );
                                                    setDetalles(nuevos);
                                                    setForm(prev => ({ ...prev, total: nuevos.reduce((acc, c) => acc + c.subtotal, 0) }));
                                                }}
                                            />
                                        )
                                    },
                                    {
                                        title: <Text type="secondary" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>CANT.</Text>,
                                        dataIndex: 'cantidad',
                                        key: 'cantidad',
                                        width: 120,
                                        render: (val, record) => (
                                            <InputNumber
                                                size="large"
                                                min={1}
                                                value={val}
                                                style={{ width: '90px', fontSize: '1.2rem', fontWeight: '700', borderRadius: '8px' }}
                                                onChange={(newVal) => {
                                                    const artReal = articulos.find(a => a.id_articulo === record.id_articulo);
                                                    if (newVal > (artReal?.cantidad_existencia || 0)) {
                                                        message.warning("Stock máximo alcanzado");
                                                        newVal = artReal.cantidad_existencia;
                                                    }
                                                    const nuevos = detalles.map(d =>
                                                        d.id_articulo === record.id_articulo ? { ...d, cantidad: newVal, subtotal: newVal * d.precio_unitario } : d
                                                    );
                                                    setDetalles(nuevos);
                                                    setForm(prev => ({ ...prev, total: nuevos.reduce((acc, c) => acc + c.subtotal, 0) }));
                                                }}
                                            />
                                        )
                                    },
                                    {
                                        title: <Text type="secondary" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>SUBTOTAL</Text>,
                                        dataIndex: 'subtotal',
                                        key: 'subtotal',
                                        width: 150,
                                        align: 'right',
                                        render: (val) => <Text strong style={{ fontSize: '1.3rem' }}>L. {val.toFixed(2)}</Text>
                                    }
                                ]}
                            />
                        </div>
                    </Col>
                    <Col span={9}>
                        <div style={{
                            background: '#f8fafc',
                            padding: '30px',
                            borderRadius: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Title level={4} style={{ color: '#163269', marginBottom: '25px', borderBottom: '2px solid #163269', paddingBottom: '10px' }}>
                                Resumen de Pago
                            </Title>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <Text style={{ fontSize: '1.1rem', color: '#64748b' }}>Suma de Productos:</Text>
                                <Text strong style={{ fontSize: '1.2rem' }}>L. {form.total.toFixed(2)}</Text>
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <Text style={{ fontSize: '1.1rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>Costo de Envío:</Text>
                                <InputNumber
                                    size="large"
                                    value={form.costo_envio}
                                    style={{ width: '100%', borderRadius: '12px', fontSize: '1.4rem', fontWeight: '700' }}
                                    onChange={(v) => setForm(p => ({ ...p, costo_envio: v || 0 }))}
                                    prefix="L."
                                />
                            </div>

                            <Divider style={{ margin: '20px 0' }} />

                            <div style={{ textAlign: 'center', marginBottom: '35px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Text type="secondary" style={{ fontSize: '1.1rem', display: 'block', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                                    Total a Pagar
                                </Text>
                                <Text strong style={{ fontSize: '3.2rem', color: '#163269', display: 'block', lineHeight: 1.1 }}>
                                    L. {(form.total + form.costo_envio).toFixed(2)}
                                </Text>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleSubmit}
                                loading={loading}
                                style={{
                                    height: '75px',
                                    fontSize: '1.5rem',
                                    fontWeight: '800',
                                    background: '#BC7D3B',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(188, 125, 59, 0.4)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                CONFIRMAR PEDIDO
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Modal>
        </div>
    );
}

export default NuevoPedidoForm
