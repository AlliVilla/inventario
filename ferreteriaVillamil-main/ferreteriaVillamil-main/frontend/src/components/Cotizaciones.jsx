import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Row, Col, Space, Empty, message, Modal, Table, Popconfirm, Tag, Divider } from 'antd';
import { PlusOutlined, EyeOutlined, CalendarOutlined, InboxOutlined, DeleteOutlined, ExclamationCircleOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FerreteriaLogo from '../assets/LogoFerreteriaVillamil.png';

const { Title, Text } = Typography;

const CotizacionesList = () => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchCotizaciones();
    }, []);

    const fetchCotizaciones = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/cotizaciones`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.data) {
                setOriginalData(response.data);
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

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/cotizaciones/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            message.success("Cotización eliminada correctamente");
            fetchCotizaciones();
        } catch (error) {
            console.error("Error deleting quote:", error);
            message.error("No se pudo eliminar la cotización");
        }
    };

    const generateDetailPDF = (cot) => {
        const doc = new jsPDF();
        const date = new Date(cot.fecha_cotizacion).toLocaleDateString();

        // Header
        doc.addImage(FerreteriaLogo, 'PNG', 15, 10, 50, 30);
        doc.setFontSize(18);
        doc.text("Ferretería Villamil", 70, 20);
        doc.setFontSize(10);
        doc.text("Cotización de Productos", 70, 28);
        doc.text(`Fecha: ${date}`, 70, 34);
        doc.text(`Cliente: ${cot.cliente_nombre}`, 15, 50);

        const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Subtotal"];
        const tableRows = cot.Detalles.map(item => [
            item.Articulo?.nombre || "Producto",
            item.cantidad,
            `L. ${parseFloat(item.precio_unitario).toFixed(2)}`,
            `L. ${parseFloat(item.subtotal).toFixed(2)}`
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
        doc.text(`Total a Pagar: L. ${parseFloat(cot.total).toFixed(2)}`, 140, finalY);
        
        return doc;
    };

    const handlePrint = (cot) => {
        const doc = generateDetailPDF(cot);
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDownload = (cot) => {
        const doc = generateDetailPDF(cot);
        const date = new Date(cot.fecha_cotizacion).toLocaleDateString().replace(/\//g, '-');
        doc.save(`Cotizacion_${cot.cliente_nombre}_${date}.pdf`);
    };

    const showDetails = (id) => {
        const fullData = originalData.find(c => c.id_cotizacion === id);
        setSelectedCotizacion(fullData);
        setDetailsVisible(true);
    };

    const detailColumns = [
        { title: 'Articulo', dataIndex: ['Articulo', 'nombre'], key: 'nombre' },
        { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', align: 'center' },
        {
            title: 'Precio Unit.',
            dataIndex: 'precio_unitario',
            key: 'precio',
            render: (val) => `L. ${parseFloat(val).toLocaleString()}`
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            render: (val) => <Text strong>L. {parseFloat(val).toLocaleString()}</Text>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '40px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                <Title level={isMobile ? 2 : 1} style={{
                    color: '#163269',
                    marginBottom: '8px',
                    borderBottom: '2px solid #163269',
                    display: 'inline-block',
                    paddingBottom: '4px'
                }}>
                    Cotizaciones
                </Title>
                <div style={{ color: '#6b7280', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                    Gestiona y crea cotizaciones para tus clientes
                </div>
            </div>

            {/* Content Section */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0' }}>
                <Col style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Title level={isMobile ? 4 : 3} style={{ color: '#4b5563', margin: 0, textAlign: isMobile ? 'center' : 'left' }}>Listado de cotizaciones</Title>
                </Col>
                <Col style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Button
                        type="primary"
                        size="large"
                        block={isMobile}
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/cotizaciones/nueva')}
                        style={{
                            backgroundColor: '#163269',
                            borderRadius: '10px',
                            height: '45px',
                            fontWeight: '600'
                        }}
                    >
                        Nueva cotización
                    </Button>
                </Col>
            </Row>

            <Space orientation="vertical" size={24} style={{ width: '100%' }}>
                {cotizaciones.length > 0 ? (
                    cotizaciones.map((cot) => (
                        <Card
                            key={cot.id}
                            className="shadow-sm"
                            style={{
                                borderRadius: '20px',
                                border: 'none',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                marginBottom: '16px',
                                background: 'white'
                            }}
                            styles={{ body: { padding: isMobile ? '20px' : '24px' } }}
                        >
                            <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} md={17}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '12px'
                                    }}>
                                        <Title level={isMobile ? 4 : 3} style={{ color: '#163269', margin: 0 }}>
                                            {cot.cliente}
                                        </Title>
                                        {isMobile && (
                                            <div style={{ color: '#163269', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                L. {cot.total.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '12px' : '24px', marginBottom: '16px' }}>
                                        <Text style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                            <CalendarOutlined /> {cot.fecha}
                                        </Text>
                                        <Text style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                            <InboxOutlined /> {cot.count} productos
                                        </Text>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        color: '#64748b',
                                        fontSize: '13px',
                                        fontStyle: 'italic'
                                    }}>
                                        {cot.resumen}
                                    </div>
                                </Col>
                                <Col xs={24} md={7} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                    {!isMobile && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>TOTAL COTIZADO</div>
                                            <div style={{ color: '#163269', fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>
                                                L. {cot.total.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: isMobile ? 'stretch' : 'flex-end',
                                        marginTop: isMobile ? '16px' : '0'
                                    }}>
                                        <Popconfirm
                                            title="¿Eliminar cotización?"
                                            onConfirm={() => handleDelete(cot.id)}
                                            okText="Sí"
                                            cancelText="No"
                                        >
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="large"
                                                style={{ borderRadius: '12px', height: '42px', width: isMobile ? '60px' : '42px' }}
                                            />
                                        </Popconfirm>
                                        <Button
                                            type="primary"
                                            icon={<EyeOutlined />}
                                            size="large"
                                            onClick={() => showDetails(cot.id)}
                                            style={{
                                                flex: isMobile ? 1 : 'none',
                                                borderRadius: '12px',
                                                backgroundColor: '#163269',
                                                height: '42px',
                                                padding: isMobile ? '0' : '0 24px',
                                                fontWeight: '600',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Ver detalles
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    ))
                ) : (
                    <Empty description="No hay cotizaciones registradas" />
                )}
            </Space>

            {/* Modal de Detalles */}
            <Modal
                title={null}
                open={detailsVisible}
                onCancel={() => setDetailsVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailsVisible(false)}>
                        Cerrar
                    </Button>,
                    <Button
                        key="download"
                        icon={<FilePdfOutlined />}
                        onClick={() => handleDownload(selectedCotizacion)}
                    >
                        Descargar PDF
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => handlePrint(selectedCotizacion)}
                        style={{ backgroundColor: '#163269' }}
                    >
                        Imprimir
                    </Button>
                ]}
                width={isMobile ? '100%' : 850}
                centered
                styles={{
                    body: { padding: isMobile ? '16px' : '40px' },
                    header: { display: isMobile ? 'none' : 'block' }
                }}
                className="quotation-detail-modal"
            >
                {selectedCotizacion && (
                    <div id="cotizacion-print-area">
                        {/* Header mimicking PDF */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '30px',
                            gap: '20px',
                            textAlign: 'center'
                        }}>
                            <img src={FerreteriaLogo} alt="Logo" style={{ width: isMobile ? '100px' : '150px' }} />
                            <div style={{ flex: 1 }}>
                                <Title level={isMobile ? 5 : 3} style={{ margin: 0, color: '#000' }}>INVERSIONES MERCANTILES VILLAMIL</Title>
                                <Text style={{ display: 'block', fontSize: '12px' }}>Colonia Pinto Calle Principal Naco Cortes. SPS</Text>
                                <Text style={{ display: 'block', fontSize: '12px' }}>R.T.N. 05011998149871  Tel. 95086231</Text>
                            </div>
                            <div style={{ textAlign: isMobile ? 'center' : 'right' }}>
                                <Title level={5} style={{ margin: 0, color: '#000' }}>COTIZACIÓN</Title>
                                <Text strong>N° {String(selectedCotizacion.id_cotizacion).padStart(7, '0')}</Text>
                            </div>
                        </div>

                        <Row gutter={isMobile ? [0, 12] : 24} style={{ marginBottom: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <Col xs={24} md={12}>
                                <Text strong>Cliente: </Text>
                                <Text>{selectedCotizacion.cliente_nombre}</Text>
                            </Col>
                            <Col xs={24} md={12} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                <Text strong>Fecha: </Text>
                                <Text>{new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</Text>
                            </Col>
                        </Row>

                        <Table
                            dataSource={selectedCotizacion.Detalles}
                            columns={[
                                { title: 'Cant.', dataIndex: 'cantidad', key: 'qty', width: 60, align: 'center' },
                                { title: 'Descripción', dataIndex: ['Articulo', 'nombre'], key: 'desc' },
                                {
                                    title: 'Total',
                                    dataIndex: 'subtotal',
                                    key: 'total',
                                    align: 'right',
                                    render: (val) => <Text strong>L. {parseFloat(val).toFixed(2)}</Text>
                                }
                            ]}
                            pagination={false}
                            rowKey="id_detalle_cotizacion"
                            size="small"
                            style={{ marginBottom: '20px' }}
                        />

                        <Row gutter={[20, 20]}>
                            <Col xs={24} md={14}>
                                <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                    <Text strong style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                                        TÉRMINOS Y CONDICIONES:
                                    </Text>
                                    <ul style={{ fontSize: '0.75rem', color: '#6b7280', paddingLeft: '15px', margin: 0 }}>
                                        <li>Precios sujetos a cambios sin previo aviso.</li>
                                        <li>Vigencia: 15 días calendario.</li>
                                    </ul>
                                </div>
                            </Col>
                            <Col xs={24} md={10}>
                                <div style={{ textAlign: 'right' }}>
                                    <Row justify="space-between">
                                        <Text>Subtotal:</Text>
                                        <Text>L. {(parseFloat(selectedCotizacion.total) / 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </Row>
                                    <Row justify="space-between">
                                        <Text>I.S.V. (15%):</Text>
                                        <Text>L. {(parseFloat(selectedCotizacion.total) - (parseFloat(selectedCotizacion.total) / 1.15)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </Row>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Row justify="space-between">
                                        <Text strong style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>Total:</Text>
                                        <Text strong style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#163269' }}>
                                            L. {parseFloat(selectedCotizacion.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </Row>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <Row justify="space-between" align="bottom" gutter={[0, 30]}>
                                <Col xs={24} md={12}>
                                    <div style={{
                                        borderTop: '1px solid #000',
                                        width: isMobile ? '100%' : '250px',
                                        marginTop: isMobile ? '20px' : '40px',
                                        textAlign: 'center'
                                    }}>
                                        <Text style={{ fontSize: '12px' }}>Firma Autorizada</Text>
                                    </div>
                                </Col>
                                <Col xs={24} md={12} style={{ textAlign: isMobile ? 'center' : 'right' }}>
                                    <Text strong style={{ color: '#163269', display: 'block', fontSize: '14px' }}>¡Gracias por su Preferencia!</Text>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Cotización válida por 15 días</Text>
                                </Col>
                            </Row>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CotizacionesList;
