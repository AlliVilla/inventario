import React, { useState } from 'react';
import { Button, message } from 'antd';
import axios from 'axios';

const TestCostos = () => {
    const [resultado, setResultado] = useState(null);

    const probarCostos = async () => {
        try {
            // 1. Cargar artículos
            const articlesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/articulos/list`);
            console.log('=== ARTÍCULOS CARGADOS ===');
            console.log('Total artículos:', articlesRes.data?.data?.length);

            const primeros3 = articlesRes.data?.data?.slice(0, 3) || [];
            primeros3.forEach(a => {
                console.log(`ID: ${a.id_articulo}, Nombre: ${a.nombre}, Costo: ${a.costo_unitario}, Precio: ${a.precio}`);
            });

            // 2. Cargar ventas
            const ventasRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas/list`);
            console.log('\n=== VENTAS CARGADAS ===');
            console.log('Total ventas:', ventasRes.data?.length);

            if (ventasRes.data && ventasRes.data.length > 0) {
                const primeraVenta = ventasRes.data[0];
                console.log('Primera venta completa:', JSON.stringify(primeraVenta, null, 2));
                console.log('Detalle_Venta:', primeraVenta.Detalle_Venta);

                if (primeraVenta.Detalle_Venta && primeraVenta.Detalle_Venta.length > 0) {
                    const primerDetalle = primeraVenta.Detalle_Venta[0];
                    console.log('Primer detalle:', JSON.stringify(primerDetalle, null, 2));
                    console.log('¿Tiene Articulo anidado?', !!primerDetalle.Articulo);
                    if (primerDetalle.Articulo) {
                        console.log('Artículo anidado:', {
                            id: primerDetalle.Articulo.id_articulo,
                            nombre: primerDetalle.Articulo.nombre,
                            costo_unitario: primerDetalle.Articulo.costo_unitario,
                            precio: primerDetalle.Articulo.precio
                        });
                    }
                }
            }

            // 3. Cargar pedidos
            const pedidosRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedidos/getAllPedidos`);
            console.log('\n=== PEDIDOS CARGADOS ===');
            console.log('Total pedidos:', pedidosRes.data?.data?.length);

            if (pedidosRes.data?.data && pedidosRes.data.data.length > 0) {
                const primerPedido = pedidosRes.data.data[0];
                console.log('Primer pedido completo:', JSON.stringify(primerPedido, null, 2));
                console.log('Detalle_Pedidos:', primerPedido.Detalle_Pedidos);
                console.log('Detalle_Pedido:', primerPedido.Detalle_Pedido);

                const detalles = primerPedido.Detalle_Pedidos || primerPedido.Detalle_Pedido || [];
                if (detalles.length > 0) {
                    const primerDetalle = detalles[0];
                    console.log('Primer detalle:', JSON.stringify(primerDetalle, null, 2));
                    console.log('¿Tiene Articulo anidado?', !!primerDetalle.Articulo);
                    if (primerDetalle.Articulo) {
                        console.log('Artículo anidado:', {
                            id: primerDetalle.Articulo.id_articulo,
                            nombre: primerDetalle.Articulo.nombre,
                            costo_unitario: primerDetalle.Articulo.costo_unitario,
                            precio: primerDetalle.Articulo.precio
                        });
                    }
                }
            }

            setResultado('Revisa la consola del navegador (F12) para ver los datos completos');
            message.success('Datos cargados. Revisa la consola.');

        } catch (error) {
            console.error('Error:', error);
            message.error('Error al cargar datos: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Herramienta de Depuración - Costos</h2>
            <Button type="primary" onClick={probarCostos}>
                Probar Carga de Datos
            </Button>
            {resultado && (
                <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                    {resultado}
                </div>
            )}
        </div>
    );
};

export default TestCostos;
