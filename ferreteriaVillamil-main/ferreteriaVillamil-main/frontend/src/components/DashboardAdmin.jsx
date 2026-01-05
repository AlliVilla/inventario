import React, { useEffect, useState } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import axios from 'axios';

function Card({ title, color, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className={`${color} px-4 py-2`}>
                <h3 className="text-white font-semibold">
                    {title}
                </h3>
            </div>

            <div className="p-4">
                {children}
            </div>
        </div>
    );
}

function DashboardAdmin() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [repartidores, setRepartidores] = useState([]);
    const [popular, setPopular] = useState([]);
    const [bajoInv, setBajoInv] = useState([]);
    const [capitalUtil, setCapitalUtil] = useState({
        pedidos_entregados: 0,
        costo_items: 0.0,
        ingresos_brut: 0.0,
        utilidad: 0.0
    });
    const [rawData, setRawData] = useState({
        pedidos: [],
        detalles: [],
        articulos: [],
        calificaciones: [],
        usuarios: [],
        ventas: []
    });
    const [pedidosChart, setPedidosChart] = useState([]);
    const [periodo, setPeriodo] = useState("mes");
    const COLORS = [
        "#ECB01F",
        "#163269",
        "#2C4D8E",
        "#5E9C08",
        "#BC7D3B"
    ]
    const now = new Date();

    const filtrarPorPeriodo = (fechaStr) => {
        if (!fechaStr) return false; // Si no hay fecha, no incluir en ningún período
        const fecha = new Date(fechaStr);

        if (periodo === "historico") {
            return true; // Mostrar todos los registros
        }

        if (periodo === "semana") {
            const inicioSemana = new Date();
            inicioSemana.setHours(0, 0, 0, 0);
            inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay()); // Domingo de esta semana
            return fecha >= inicioSemana;
        }

        if (periodo === "mes") {
            const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
            return fecha >= inicioMes;
        }

        if (periodo === "anio") {
            const inicioAnio = new Date(now.getFullYear(), 0, 1);
            return fecha >= inicioAnio;
        }

        return false;
    };

    useEffect(() => {
        fetchDashboardData();
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (rawData.pedidos.length > 0) {
            filter();
        }
    }, [rawData, periodo]);

    const fetchDashboardData = async () => {
        try {
            const [calificacionesRes, pedidosRes, usuariosRes, detallesRes, articulosRes, lowStockRes, ventasRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/calificaciones/list`),
                axios.get(`${import.meta.env.VITE_API_URL}/pedidos/getAllPedidos`),
                axios.get(`${import.meta.env.VITE_API_URL}/usuarios/usuarios`),
                axios.get(`${import.meta.env.VITE_API_URL}/detalles/list`),
                axios.get(`${import.meta.env.VITE_API_URL}/articulos/list`),
                axios.get(`${import.meta.env.VITE_API_URL}/articulos/low-stock`),
                axios.get(`${import.meta.env.VITE_API_URL}/ventas/list`)
            ]);

            const lowStock = lowStockRes.data.data.map((a) => ({
                id_articulo: a.id_articulo,
                nombre: a.nombre,
                existencia: a.cantidad_existencia,
                minimo: a.stock_minimo,
                foto_url: a.foto_url
            }));

            setBajoInv(lowStock);

            setRawData({
                pedidos: pedidosRes.data.data,
                detalles: detallesRes.data.data,
                articulos: articulosRes.data.data,
                calificaciones: calificacionesRes.data.data,
                usuarios: usuariosRes.data,
                ventas: ventasRes.data || [] // Ensure it defaults to array if undefined
            });

        } catch (err) {
            console.error("Error obteniendo la data", err);
        }
    }

    const filter = () => {
        const calificacionesMap = new Map();
        rawData.calificaciones.forEach(c => {
            calificacionesMap.set(c.id_pedido, c.puntuacion);
        });

        const usuariosMap = new Map();
        rawData.usuarios.forEach(u => {
            usuariosMap.set(u.id_usuario, u.nombre);
        });

        const detallesMap = new Map();
        rawData.detalles.forEach(d => {
            if (!detallesMap.has(d.id_pedido)) detallesMap.set(d.id_pedido, []);
            detallesMap.get(d.id_pedido).push(d);
        });

        const articulosMap = new Map();
        rawData.articulos.forEach(a => {
            articulosMap.set(a.id_articulo, a);
        });

        const pedidosMap = new Map();
        rawData.pedidos.forEach(p => {
            pedidosMap.set(p.id_pedido, p);
        });

        // Sección Gráfico

        const pedidosFiltrados = rawData.pedidos.filter(p =>
            filtrarPorPeriodo(p.fecha_creacion)
        );

        const estadosCount = pedidosFiltrados.reduce((acc, p) => {
            acc[p.estado] = (acc[p.estado] || 0) + 1;
            return acc;
        }, {});

        const pedidosChartData = [
            { name: "Pendiente", value: estadosCount["Pendiente"] || 0 },
            { name: "Asignado", value: estadosCount["Asignado"] || 0 },
            { name: "En transcurso", value: estadosCount["En transcurso"] || 0 },
            { name: "Entregado", value: estadosCount["Entregado"] || 0 },
            { name: "Cancelado", value: estadosCount["Cancelado"] || 0 },
        ];

        setPedidosChart(pedidosChartData);

        // Sección Repartidores
        console.log('Pedidos completos:', rawData.pedidos);

        // Primero filtramos los pedidos entregados
        const pedidosEntregados = rawData.pedidos.filter(p => {
            const esEntregado = p.estado === "Entregado";
            const tieneRepartidor = !!p.id_repartidor_asignado;
            // Si es histórico, no filtramos por fecha
            const enPeriodo = periodo === "historico" ? true : filtrarPorPeriodo(p.fecha_creacion || p.fecha_entrega);

            console.log(`Pedido ${p.id_pedido}:`, {
                estado: p.estado,
                repartidor: p.id_repartidor_asignado,
                fecha_creacion: p.fecha_creacion,
                fecha_entrega: p.fecha_entrega,
                enPeriodo,
                cumple: esEntregado && tieneRepartidor && enPeriodo
            });

            return esEntregado && tieneRepartidor && enPeriodo;
        });

        console.log('Pedidos entregados filtrados:', pedidosEntregados);

        const resumenRepartidores = pedidosEntregados.reduce((acc, item) => {
            if (!item.id_repartidor_asignado) return acc;

            const repartidorId = item.id_repartidor_asignado;

            if (!acc[repartidorId]) {
                acc[repartidorId] = {
                    id_repartidor_asignado: repartidorId,
                    envios: 0,
                    totalEstrellas: 0,
                    calificados: 0
                };
            }

            acc[repartidorId].envios += 1;
            const puntos = calificacionesMap.get(item.id_pedido);
            if (puntos !== undefined && puntos !== null) {
                acc[repartidorId].totalEstrellas += parseFloat(puntos);
                acc[repartidorId].calificados += 1;
            }

            return acc;
        }, {});
        console.log('Resumen repartidores:', resumenRepartidores);

        const resultadoFinal = Object.values(resumenRepartidores)
            .map(r => {
                const nombreRepartidor = usuariosMap.get(parseInt(r.id_repartidor_asignado)) || "Desconocido";
                const promedio = r.calificados > 0
                    ? (r.totalEstrellas / r.calificados).toFixed(2)
                    : "N/A";

                console.log('Procesando repartidor:', {
                    id: r.id_repartidor_asignado,
                    nombre: nombreRepartidor,
                    envios: r.envios,
                    promedio,
                    calificados: r.calificados,
                    totalEstrellas: r.totalEstrellas
                });

                return {
                    repartidor: nombreRepartidor,
                    envios: r.envios,
                    promedio: promedio,
                    id_repartidor: r.id_repartidor_asignado
                };
            })
            .sort((a, b) => {
                // Ordenar por promedio descendente, poniendo los "N/A" al final
                if (a.promedio === "N/A") return 1;
                if (b.promedio === "N/A") return -1;
                return parseFloat(b.promedio) - parseFloat(a.promedio);
            });

        console.log('Resultado final:', resultadoFinal);
        setRepartidores(resultadoFinal);

        // Sección más vendido (Combinar Pedidos y Ventas)
        const detallesMapV = new Map();

        // 1. Procesar Pedidos
        rawData.detalles.forEach(d => {
            const pedido = pedidosMap.get(d.id_pedido);
            if (!pedido) return;
            if (!filtrarPorPeriodo(pedido.fecha_creacion)) return;

            if (detallesMapV.has(d.id_articulo)) {
                detallesMapV.set(d.id_articulo, detallesMapV.get(d.id_articulo) + d.cantidad);
            } else {
                detallesMapV.set(d.id_articulo, d.cantidad);
            }
        });

        // 2. Procesar Ventas
        if (rawData.ventas && Array.isArray(rawData.ventas)) {
            rawData.ventas.forEach(venta => {
                if (!filtrarPorPeriodo(venta.fecha_venta)) return; // Filtrar ventas por fecha

                if (venta.Detalle_Ventas && Array.isArray(venta.Detalle_Ventas)) {
                    venta.Detalle_Ventas.forEach(detalle => {
                        if (detallesMapV.has(detalle.id_articulo)) {
                            detallesMapV.set(detalle.id_articulo, detallesMapV.get(detalle.id_articulo) + detalle.cantidad);
                        } else {
                            detallesMapV.set(detalle.id_articulo, detalle.cantidad);
                        }
                    });
                }
            });
        }


        const masVendidos = Array.from(detallesMapV.entries())
            .map(([id_articulo, cantidad]) => {
                const articulo = articulosMap.get(id_articulo);
                return {
                    id_articulo,
                    nombre: articulo?.nombre ?? "Desconocido",
                    cantidad_vendida: cantidad,
                    inventario_actual: articulo?.cantidad_existencia ?? 0,
                    foto_url: articulo?.foto_url
                };
            })
            .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida);

        setPopular(masVendidos);

        // Sección de ingresos (Combinar Pedidos y Ventas)
        let pedidos_count = pedidosEntregados.length;
        let costo_items = 0;
        let ingresos_brut = 0;
        let ventas_count = 0;

        // 1. Ingresos por Pedidos
        pedidosEntregados.forEach(pedido => {
            ingresos_brut += Number(pedido.total) ?? 0;

            const detalles = detallesMap.get(pedido.id_pedido) || [];
            detalles.forEach(d => {
                const articulo = articulosMap.get(d.id_articulo);
                const precio_compra = Number(articulo?.costo_unitario) ?? 0;
                costo_items += Number(d.cantidad) * precio_compra;
            });
        });

        // 2. Ingresos por Ventas directas
        if (rawData.ventas && Array.isArray(rawData.ventas)) {
            rawData.ventas.forEach(venta => {
                if (!filtrarPorPeriodo(venta.fecha_venta)) return;

                ventas_count++;
                ingresos_brut += Number(venta.total) ?? 0;

                if (venta.Detalle_Ventas && Array.isArray(venta.Detalle_Ventas)) {
                    venta.Detalle_Ventas.forEach(detalle => {
                        // Intentar obtener costo del articulo desde el mapa global o desde la estructura anidada si existe
                        // Nota: El endpoint getVentas incluye Articulo, así que podríamos usar eso si articulosMap falla o para redundancia
                        let costoUnitario = 0;

                        // Opción A: Usar mapa global (más seguro si están sincronizados)
                        const articuloGlobal = articulosMap.get(detalle.id_articulo);
                        if (articuloGlobal) {
                            costoUnitario = Number(articuloGlobal.costo_unitario) || 0;
                        } else if (detalle.Articulo) {
                            // Opción B: Usar dato anidado
                            costoUnitario = Number(detalle.Articulo.costo_unitario) || 0;
                        }

                        costo_items += Number(detalle.cantidad) * costoUnitario;
                    });
                }
            });
        }


        const utilidad = ingresos_brut - costo_items;

        const resumenIngresos = {
            pedidos_entregados: pedidos_count + ventas_count, // Sumamos ventas al contador "pedidos_entregados" para simplicidad visual o cambiamos label
            costo_items,
            ingresos_brut,
            utilidad
        };

        setCapitalUtil(resumenIngresos);
    }

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <h1
                        className="text-2xl md:text-3xl font-bold pb-4 border-b-4 flex-1"
                        style={{ color: "#163269", borderColor: "#163269" }}
                    >
                        Dashboard
                    </h1>
                </div>

                <div className="flex items-center justify-between gap-5">
                    <div>
                        <strong>Fecha:</strong>
                        {now.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                    <select
                        value={periodo}
                        onChange={e => setPeriodo(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="semana">Esta semana</option>
                        <option value="mes">Este mes</option>
                        <option value="anio">Este año</option>
                        <option value="historico">Histórico</option>
                    </select>
                </div>

                {/* GRID */}
                <div className="grid py-3 grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card title="Informe repartidores" color="bg-[#163269]">
                        <div className="h-[150px] overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th>Nombre</th>
                                        <th className="text-right">Entregas</th>
                                        <th className="text-right">Valor.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repartidores.length > 0 ? (
                                        repartidores.map((repartidor) => (
                                            <tr key={repartidor.repartidor}>
                                                <td className="truncate max-w-[100px]">
                                                    {repartidor.repartidor}
                                                </td>
                                                <td className="text-right">
                                                    {repartidor.envios}
                                                </td>
                                                <td className="text-right">
                                                    {repartidor.promedio}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center py-2 text-gray-500">
                                                No hay datos de repartidores
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title="Lo más vendido" color="bg-[#163269]">
                        <div className="h-[150px] overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="w-12"></th>
                                        <th>Articulo</th>
                                        <th className="text-right">Ventas</th>
                                        <th className="text-right">Inventario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {popular.length > 0 ? (
                                        popular.map((item) => (
                                            <tr key={item.id_articulo}>
                                                <td className="w-12 py-1">
                                                    <img
                                                        src={getImageUrl(item.foto_url) || "https://via.placeholder.com/40"}
                                                        alt=""
                                                        className="w-10 h-10 object-cover rounded"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40" }}
                                                    />
                                                </td>
                                                <td className="truncate max-w-[100px]">
                                                    {item.nombre}
                                                </td>
                                                <td className="text-right">
                                                    {item.cantidad_vendida}
                                                </td>
                                                <td className="text-right">
                                                    {item.inventario_actual}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-2 text-gray-500">
                                                No hay datos de artículos vendidos
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title="Bajo en inventario" color="bg-red-400">
                        <div className="h-[150px] overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="w-12"></th>
                                        <th>Articulo</th>
                                        <th className="text-right">Existencia</th>
                                        <th className="text-right">Minimo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bajoInv.length > 0 ? (
                                        bajoInv.map((articulo) => (
                                            <tr key={articulo.id_articulo}>
                                                <td className="w-12 py-1">
                                                    <img
                                                        src={getImageUrl(articulo.foto_url) || "https://via.placeholder.com/40"}
                                                        alt=""
                                                        className="w-10 h-10 object-cover rounded"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40" }}
                                                    />
                                                </td>
                                                <td className="truncate max-w-[100px]">
                                                    {articulo.nombre}
                                                </td>
                                                <td className="text-right">
                                                    {articulo.existencia}
                                                </td>
                                                <td className="text-right">
                                                    {articulo.minimo}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-2 text-gray-500">
                                                No hay artículos bajos en inventario
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className='grid py-3 grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* fila inferior */}
                    <div>
                        <Card title="Pedidos" color="bg-[#163269]">
                            <div className="w-full h-[200px] md:h-[170px] overflow-y-auto flex items-center justify-center">
                                {pedidosChart.some(item => item.value > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pedidosChart}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={50}
                                                label
                                            >
                                                {pedidosChart.map((_, index) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend layout={isMobile ? "horizontal" : "vertical"}
                                                verticalAlign={isMobile ? "bottom" : "middle"}
                                                align={isMobile ? "center" : "right"} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-gray-500">No hay datos de pedidos</div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <Card title="Ingresos del mes" color="bg-yellow-400">
                        <div className="h-[170px] overflow-y-auto">
                            {capitalUtil.pedidos_entregados > 0 ? (
                                <>
                                    <div><strong>Pedidos entregados:</strong> {capitalUtil.pedidos_entregados}</div>
                                    <div><strong>Costo de items:</strong> L.{capitalUtil.costo_items.toFixed(2)}</div>
                                    <div><strong>Ingresos brutos:</strong> L.{capitalUtil.ingresos_brut.toFixed(2)}</div>
                                    <div><strong>Utilidad:</strong> L.{capitalUtil.utilidad.toFixed(2)}</div>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    No hay datos de ingresos
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );



}

export default DashboardAdmin;