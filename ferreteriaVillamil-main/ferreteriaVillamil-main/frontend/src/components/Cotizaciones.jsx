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
    const [originalData, setOriginalData] = useState([]); // Para guardar la data cruda del backend
    const [loading, setLoading] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
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
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
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
        const pageHeight = doc.internal.pageSize.height;
        const footerHeight = 35;
        const totalsHeight = 50;
        const reservedSpace = totalsHeight + footerHeight + 10;
        const totalsY = pageHeight - reservedSpace;

        const drawHeader = (pageDoc) => {
            pageDoc.addImage(FerreteriaLogo, 'PNG', 20, 12, 45, 30);
            pageDoc.setFontSize(16);
            pageDoc.setTextColor(0, 0, 0);
            pageDoc.setFont("helvetica", "bold");
            pageDoc.text("INVERSIONES MERCANTILES VILLAMIL", 130, 20, { align: "center" });
            pageDoc.setFontSize(10);
            pageDoc.setFont("helvetica", "normal");
            pageDoc.text("Colonia Pinto Calle Principal Naco Cortes. San Pedro Sula,", 130, 26, { align: "center" });
            pageDoc.text("Tres Cuadras Arriba del Centro de Salud", 130, 31, { align: "center" });
            pageDoc.text("R.T.N. 05011998149871  Tel. 95086231- 96096433", 130, 36, { align: "center" });
            pageDoc.text("Correo: ferrevillamil@gmail.com", 130, 41, { align: "center" });
            pageDoc.setFontSize(14);
            pageDoc.setFont("helvetica", "bold");
            pageDoc.text("COTIZACIÓN", 170, 55, { align: "right" });
            pageDoc.setFontSize(12);
            pageDoc.text(`N° ${String(cot.id_cotizacion).padStart(7, '0')}`, 170, 62, { align: "right" });
            pageDoc.setFontSize(11);
            pageDoc.setFont("helvetica", "normal");
            pageDoc.text(`Cliente: ${cot.cliente_nombre}`, 20, 75);
            pageDoc.text(`Fecha: ${date}`, 140, 75);
        };

        const drawTerms = (pageDoc, yPos) => {
            pageDoc.setFontSize(8);
            pageDoc.setTextColor(100, 100, 100);
            pageDoc.setFont("helvetica", "bold");
            pageDoc.text("TÉRMINOS Y CONDICIONES:", 20, yPos);
            pageDoc.setFontSize(7);
            pageDoc.setFont("helvetica", "normal");
            pageDoc.text("1. Los precios están sujetos a cambios sin previo aviso.", 20, yPos + 5);
            pageDoc.text("2. Esta cotización tiene una validez de 15 días calendario.", 20, yPos + 9);
            pageDoc.text("3. La entrega de materiales está sujeta a disponibilidad de inventario.", 20, yPos + 13);
            pageDoc.text("4. Favor confirmar existencias antes de realizar su pago.", 20, yPos + 17);
            pageDoc.setFont("helvetica", "bold");
            pageDoc.text("¡ES UN PLACER SERVIRLE!", 20, yPos + 25);
        };

        const tableColumn = ["Cantidad", "Descripción", "Precio Unit.", "Desc. Y Rebajas", "Total"];
        const tableRows = cot.Detalles.map(item => [
            item.cantidad,
            item.Articulo?.nombre || "Producto",
            parseFloat(item.precio_unitario).toFixed(2),
            "0.00",
            parseFloat(item.subtotal).toFixed(2)
        ]);

        autoTable(doc, {
            startY: 82,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain',
            headStyles: {
                fillColor: [114, 133, 165],
                textColor: [255, 255, 255],
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
            styles: { fontSize: 9, cellPadding: 2, minCellHeight: 6, textColor: [50, 50, 50] },
            margin: { left: 20, right: 20, bottom: 95, top: 80 },
            didDrawPage: (data) => {
                drawHeader(doc);
                drawTerms(doc, pageHeight - 80);
            }
        });

        const lastY = doc.lastAutoTable.finalY;
        if (lastY > totalsY) {
            doc.addPage();
            drawHeader(doc);
            drawTerms(doc, pageHeight - 80);
        }
        doc.setPage(doc.internal.getNumberOfPages());

        const subtotal = parseFloat(cot.total);
        const gravado15 = subtotal / 1.15;
        const isv15 = subtotal - gravado15;
        const totalX = 130;
        const valueX = 190;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
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
        doc.setFont("helvetica", "bold");
        doc.text("Total A Pagar L.", totalX, totalsY + 42);
        doc.text(subtotal.toFixed(2), valueX, totalsY + 42, { align: "right" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Firma: ________________________________________", 20, pageHeight - 20);
        doc.text("¡Gracias por su Preferencia!", 190, pageHeight - 25, { align: "right" });
        doc.text("La Cotización es un compromiso de precio por 15 días", 190, pageHeight - 20, { align: "right" });

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

            <Space orientation="vertical" size={24} style={{ width: '100%' }}>
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
                            styles={{ body: { padding: '24px' } }}
                        >
                            <Row justify="space-between" align="middle">
                                <Col span={14}>
                                    <Title level={4} style={{ color: '#163269', marginBottom: '16px' }}>
                                        {cot.cliente}
                                    </Title>
                                    <Space size={24} style={{ marginBottom: '12px' }} orientation="horizontal">
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
                                <Col span={10} style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total</div>
                                        <div style={{ color: '#163269', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            L. {cot.total.toLocaleString()}
                                        </div>
                                    </div>
                                    <Space size="middle" orientation="horizontal">
                                        <Popconfirm
                                            title="¿Eliminar cotización?"
                                            description="Esta acción no se puede deshacer."
                                            onConfirm={() => handleDelete(cot.id)}
                                            okText="Sí, eliminar"
                                            cancelText="Cancelar"
                                            okButtonProps={{ danger: true }}
                                            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                                        >
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="large"
                                                style={{ borderRadius: '10px', height: '45px' }}
                                            />
                                        </Popconfirm>
                                        <Button
                                            icon={<EyeOutlined />}
                                            size="large"
                                            onClick={() => showDetails(cot.id)}
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
                                    </Space>
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
                width={850}
                centered
                styles={{ body: { padding: '40px' } }}
            >
                {selectedCotizacion && (
                    <div id="cotizacion-print-area">
                        {/* Header mimicking PDF */}
                        <Row align="middle" style={{ marginBottom: '30px' }}>
                            <Col span={6}>
                                <img src={FerreteriaLogo} alt="Logo" style={{ width: '150px' }} />
                            </Col>
                            <Col span={12} style={{ textAlign: 'center' }}>
                                <Title level={3} style={{ margin: 0, color: '#000' }}>INVERSIONES MERCANTILES VILLAMIL</Title>
                                <Text style={{ display: 'block' }}>Colonia Pinto Calle Principal Naco Cortes. San Pedro Sula,</Text>
                                <Text style={{ display: 'block' }}>Tres Cuadras Arriba del Centro de Salud</Text>
                                <Text style={{ display: 'block' }}>R.T.N. 05011998149871  Tel. 95086231- 96096433</Text>
                                <Text style={{ display: 'block' }}>Correo: ferrevillamil@gmail.com</Text>
                            </Col>
                            <Col span={6} style={{ textAlign: 'right' }}>
                                <Title level={4} style={{ margin: 0, color: '#000' }}>COTIZACIÓN</Title>
                                <Title level={5} style={{ margin: 0, color: '#000' }}>N° {String(selectedCotizacion.id_cotizacion).padStart(7, '0')}</Title>
                            </Col>
                        </Row>

                        <Row gutter={24} style={{ marginBottom: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <Col span={12}>
                                <Text strong>Cliente: </Text>
                                <Text>{selectedCotizacion.cliente_nombre}</Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Text strong>Fecha: </Text>
                                <Text>{new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</Text>
                            </Col>
                        </Row>

                        <Table
                            dataSource={selectedCotizacion.Detalles}
                            columns={[
                                { title: 'Cant.', dataIndex: 'cantidad', key: 'qty', width: 80, align: 'center' },
                                { title: 'Descripción', dataIndex: ['Articulo', 'nombre'], key: 'desc' },
                                {
                                    title: 'Precio Unit.',
                                    dataIndex: 'precio_unitario',
                                    key: 'price',
                                    align: 'right',
                                    render: (val) => `L. ${parseFloat(val).toFixed(2)}`
                                },
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
                            className="custom-detail-table"
                            style={{ marginBottom: '30px' }}
                        />

                        <Row gutter={40}>
                            <Col span={14}>
                                <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                    <Text strong style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                                        TÉRMINOS Y CONDICIONES:
                                    </Text>
                                    <ul style={{ fontSize: '0.75rem', color: '#6b7280', paddingLeft: '15px', margin: 0 }}>
                                        <li>Los precios están sujetos a cambios sin previo aviso.</li>
                                        <li>Esta cotización tiene una validez de 15 días calendario.</li>
                                        <li>La entrega de materiales está sujeta a disponibilidad de inventario.</li>
                                        <li>Favor confirmar existencias antes de realizar su pago.</li>
                                    </ul>
                                    <Text strong style={{ fontSize: '0.8rem', color: '#163269', display: 'block', marginTop: '12px' }}>
                                        ¡ES UN PLACER SERVIRLE!
                                    </Text>
                                </div>
                            </Col>
                            <Col span={10}>
                                <div style={{ textAlign: 'right' }}>
                                    <Row justify="space-between" style={{ marginBottom: '4px' }}>
                                        <Text>Subtotal:</Text>
                                        <Text>L. {(parseFloat(selectedCotizacion.total) / 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </Row>
                                    <Row justify="space-between" style={{ marginBottom: '4px' }}>
                                        <Text>I.S.V. (15%):</Text>
                                        <Text>L. {(parseFloat(selectedCotizacion.total) - (parseFloat(selectedCotizacion.total) / 1.15)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Row justify="space-between">
                                        <Text strong style={{ fontSize: '1.2rem' }}>Total:</Text>
                                        <Text strong style={{ fontSize: '1.5rem', color: '#163269' }}>
                                            L. {parseFloat(selectedCotizacion.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                    <Text type="secondary" style={{ fontSize: '0.8rem' }}>La Cotización es un compromiso de precio por 15 días</Text>
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
