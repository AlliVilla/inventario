import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Row, Col, Space, Empty, message } from 'antd';
import { PlusOutlined, EyeOutlined, CalendarOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const CotizacionesList = () => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        fetchCotizaciones();
    }, []);

    const fetchCotizaciones = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/cotizaciones`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            if (response.data) {
                // Mapear los datos del backend al formato que espera la UI
                const mappedData = response.data.map(cot => ({
                    id: cot.id_cotizacion,
                    cliente: cot.cliente_nombre,
                    fecha: new Date(cot.fecha_cotizacion).toLocaleDateString('es-HN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }),
                    count: cot.Detalles?.length || 0,
                    resumen: cot.Detalles?.slice(0, 3).map(d => d.Articulo?.nombre).join(', ') +
                        (cot.Detalles?.length > 3 ? '...' : ''),
                    total: parseFloat(cot.total)
                }));
                setCotizaciones(mappedData);
            }
        } catch (error) {
            console.error("Error fetching quotes:", error);
            message.error("Error al cargar el listado de cotizaciones");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '40px' }}>
                <Title level={1} style={{ color: '#163269', marginBottom: '8px', borderBottom: '2px solid #163269', display: 'inline-block', paddingBottom: '4px' }}>
                    Cotizaciones
                </Title>
                <div style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                    Gestiona y crea cotizaciones para tus clientes
                </div>
            </div>

            {/* Content Section */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                <Col>
                    <Title level={3} style={{ color: '#4b5563', margin: 0 }}>Listado de cotizaciones</Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/cotizaciones/nueva')}
                        style={{
                            backgroundColor: '#163269',
                            borderRadius: '8px',
                            height: '45px',
                            padding: '0 24px',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        Nueva cotización
                    </Button>
                </Col>
            </Row>

            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                {cotizaciones.length > 0 ? (
                    cotizaciones.map((cot) => (
                        <Card
                            key={cot.id}
                            className="shadow-sm"
                            style={{
                                borderRadius: '16px',
                                border: '1px solid #f0f0f0',
                                padding: '8px'
                            }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Row justify="space-between" align="middle">
                                <Col span={16}>
                                    <Title level={4} style={{ color: '#163269', marginBottom: '16px' }}>
                                        {cot.cliente}
                                    </Title>
                                    <Space size={24} style={{ marginBottom: '12px' }}>
                                        <Text style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CalendarOutlined /> {cot.fecha}
                                        </Text>
                                        <Text style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <InboxOutlined /> {cot.count} productos
                                        </Text>
                                    </Space>
                                    <div style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
                                        {cot.resumen}
                                    </div>
                                </Col>
                                <Col span={8} style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total</div>
                                        <div style={{ color: '#163269', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            ${cot.total.toLocaleString()}
                                        </div>
                                    </div>
                                    <Button
                                        icon={<EyeOutlined />}
                                        size="large"
                                        style={{
                                            borderRadius: '10px',
                                            borderColor: '#163269',
                                            color: '#163269',
                                            height: '45px',
                                            padding: '0 32px'
                                        }}
                                    >
                                        Ver detalle
                                    </Button>
                                </Col>
                            </Row>
                        </Card>
                    ))
                ) : (
                    <Empty description="No hay cotizaciones registradas" />
                )}
            </Space>
        </div>
    );
};

export default CotizacionesList;
