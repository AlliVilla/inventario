import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Table, Card, Row, Col, Typography, message, InputNumber, Divider, Modal, Space } from 'antd';
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
    const navigate = useNavigate();

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));

    useEffect(() => {
        fetchArticulos();
    }, []);

    useEffect(() => {
        handleSearch(searchText);
    }, [articulos]);

    const fetchArticulos = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list/active`
            );
            if (response.data && response.data.data) {
                setArticulos(response.data.data);
            }
        } catch (error) {
            console.error("Error cargando artículos:", error);
            message.error("Error al cargar inventario");
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
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
                id_usuario_vendedor: 1 // TODO: Obtener del contexto de usuario autenticado
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/cotizaciones`, cotizacionData, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
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
        const pageHeight = doc.internal.pageSize.height;
        const footerHeight = 35; // Espacio para firma y agradecimientos
        const totalsHeight = 50; // Espacio para el desglose de totales
        const reservedSpace = totalsHeight + footerHeight + 10;
        const totalsY = pageHeight - reservedSpace;

        // Función para dibujar el encabezado en cada página
        const drawHeader = () => {
            doc.addImage(FerreteriaLogo, 'PNG', 20, 12, 45, 30);
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text("INVERSIONES MERCANTILES VILLAMIL", 130, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Colonia Pinto Calle Principal Naco Cortes. San Pedro Sula,", 130, 26, { align: "center" });
            doc.text("Tres Cuadras Arriba del Centro de Salud", 130, 31, { align: "center" });
            doc.text("R.T.N. 05011998149871  Tel. 95086231- 96096433", 130, 36, { align: "center" });
            doc.text("Correo: ferrevillamil@gmail.com", 130, 41, { align: "center" });

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("COTIZACIÓN", 170, 55, { align: "right" });
            doc.setFontSize(12);

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(`Cliente: ${clientName || "Cliente General"}`, 20, 75);
            doc.text(`Fecha: ${date}`, 140, 75);
        };

        // Función para dibujar los términos y condiciones fijos
        const drawTerms = (yPos) => {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "bold");
            doc.text("TÉRMINOS Y CONDICIONES:", 20, yPos);
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.text("1. Los precios están sujetos a cambios sin previo aviso.", 20, yPos + 5);
            doc.text("2. Esta cotización tiene una validez de 15 días calendario.", 20, yPos + 9);
            doc.text("3. La entrega de materiales está sujeta a disponibilidad de inventario.", 20, yPos + 13);
            doc.text("4. Favor confirmar existencias antes de realizar su pago.", 20, yPos + 17);
            doc.setFont("helvetica", "bold");
            doc.text("¡ES UN PLACER SERVIRLE!", 20, yPos + 25);
        };

        // --- Tabla de Productos ---
        const tableColumn = ["Cantidad", "Descripción", "Precio Unit.", "Desc. Y Rebajas", "Total"];
        const tableRows = cart.map(item => [
            item.cantidad,
            item.nombre,
            item.precio_unitario.toFixed(2),
            "0.00",
            item.subtotal.toFixed(2)
        ]);

        autoTable(doc, {
            startY: 82,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain', // Estilo limpio sin bordes en el cuerpo
            headStyles: {
                fillColor: [114, 133, 165], // Azul acero como en la imagen
                textColor: [255, 255, 255], // Texto blanco
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.5,
                lineColor: [255, 255, 255] // Líneas divisorias blancas en el encabezado
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 25 },
                1: { halign: 'left' },
                2: { halign: 'right', cellWidth: 30 },
                3: { halign: 'right', cellWidth: 35 },
                4: { halign: 'right', cellWidth: 30 }
            },
            styles: {
                fontSize: 9,
                cellPadding: 2,
                minCellHeight: 6,
                textColor: [50, 50, 50]
            },
            margin: { left: 20, right: 20, bottom: 95, top: 80 },
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
        const totalX = 130;
        const valueX = 190;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const subtotal = getTotal();
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

        doc.setFont("helvetica", "bold");
        doc.text("Total A Pagar L.", totalX, totalsY + 42);
        doc.text(subtotal.toFixed(2), valueX, totalsY + 42, { align: "right" });

        // --- Pie de página (Fijo al final) ---
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Firma: ________________________________________", 20, pageHeight - 20);
        doc.text("¡Gracias por su Preferencia!", 190, pageHeight - 25, { align: "right" });
        doc.text("La Cotización es un compromiso de precio por 15 días", 190, pageHeight - 20, { align: "right" });

        doc.save(`Cotizacion_${clientName || 'Cliente'}_${date.replace(/\//g, '-')}.pdf`);
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
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    return (
        <div style={{ padding: '30px' }}>
            {/* Header / Breadcrumb */}
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/cotizaciones')} shape="circle" size="large" />
                <div>
                    <Title level={2} style={{ color: '#163269', margin: 0 }}>Nueva Cotización</Title>
                    <Text type="secondary">Crea una nueva propuesta para tu cliente</Text>
                </div>
            </div>

            <Row gutter={24}>
                {/* Left Panel: Search and Add */}
                <Col span={10}>
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
                        style={{ height: 'calc(100vh - 200px)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, overflowY: 'auto', padding: '16px' }}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={filteredArticulos}
                            renderItem={item => (
                                <List.Item
                                    style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.3s' }}
                                    className="hover:bg-blue-50"
                                    onClick={() => addToCart(item)}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={getImageUrl(item.foto_url)} shape="square" size={48} />}
                                        title={<span style={{ fontWeight: '600' }}>{item.nombre}</span>}
                                        description={
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#163269', fontWeight: 'bold' }}>L. {item.precio}</span>
                                                <span style={{ fontSize: '0.8rem' }}>Stock: {item.cantidad_existencia}</span>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* Right Panel: Transaction Table */}
                <Col span={14}>
                    <Card
                        style={{ height: 'calc(100vh - 160px)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ marginBottom: '8px', fontWeight: '500' }}>Nombre del Cliente:</div>
                            <Input
                                placeholder="Escribe el nombre del cliente aquí..."
                                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                style={{ borderRadius: '8px' }}
                            />
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden', marginBottom: '20px' }}>
                            <Table
                                dataSource={cart}
                                columns={columns}
                                rowKey="id_articulo"
                                pagination={false}
                                size="middle"
                                locale={{ emptyText: "Selecciona productos del listado a la izquierda" }}
                                scroll={{ y: 'calc(100vh - 540px)' }} // Altura dinámica para el scroll de la tabla
                            />
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <Divider style={{ margin: '12px 0' }} />

                            <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                                <Col>
                                    <Title level={4} style={{ color: '#6b7280', margin: 0 }}>Total Cotizado:</Title>
                                </Col>
                                <Col>
                                    <Title level={2} style={{ color: '#163269', margin: 0 }}>L. {getTotal().toFixed(2)}</Title>
                                </Col>
                            </Row>

                            <Space style={{ width: '100%', justifyContent: 'stretch' }} size="middle">
                                <Button
                                    size="large"
                                    onClick={() => {
                                        setCart([]);
                                        setClientName('');
                                        message.info("Formulario limpiado");
                                    }}
                                    icon={<ClearOutlined />}
                                    style={{ flex: 1, height: '50px', borderRadius: '8px' }}
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
                                        backgroundColor: '#163269',
                                        height: '50px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Guardar y Exportar PDF
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default CotizacionNueva;
