import React, { useState, useEffect } from 'react';
import { Avatar, message, Image } from 'antd';
import { DeleteOutlined, EditOutlined, LockOutlined, PlusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ModalDeshabilitarArticulo from './ItemEstadoModal';
import ModalEditarCantidad from './ItemInventarioModal';
import ModalEliminarArticulo from './ItemBorrarModal';

function InventarioList() {
    const [articulos, setArticulos] = useState([]);
    const [error, setError] = useState('');
    const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
    const [modalCantidadOpen, setModalCantidadOpen] = useState(false);
    const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
    const [articuloSel, setArticuloSel] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_API_URL;
    const baseImageUrl = baseUrl?.replace('/api', '') || 'http://localhost:3000';

    const getFullImageUrl = (foto_url) => {
        if (!foto_url) return '/placeholder-product.png'; // Make sure this asset exists or use a fallback
        if (foto_url.startsWith('http')) return foto_url;
        const cleanPath = foto_url.startsWith('/') ? foto_url.slice(1) : foto_url;
        return `${baseImageUrl}/${cleanPath}`;
    };

    const fetchArticulos = async (searchQuery = '') => {
        try {
            const params = searchQuery ? { search: searchQuery, limit: 200 } : { limit: 200 };
            const response = await axios.get(`${baseUrl}/articulos/list`, { params });
            setArticulos(response.data.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al cargar articulos';
            message.error(errorMsg);
        }
    }

    const sortedArticulos = React.useMemo(() => {
        if (!articulos) return [];

        let filtered = [...articulos];

        // Sorting only (search is now server-side)
        const sortable = [...filtered];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                // ... (rest of sorting logic remains same)
                if (sortConfig.key === 'costo_unitario' || sortConfig.key === 'precio') {
                    aValue = Number(a[sortConfig.key]);
                    bValue = Number(b[sortConfig.key]);
                } else if (sortConfig.key === 'costo_util') {
                    aValue = Number(a.precio) - Number(a.costo_unitario);
                    bValue = Number(b.precio) - Number(b.costo_unitario);
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                // Para strings
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [articulos, sortConfig]);

    // Debounced search handler
    const handleSearchChange = (value) => {
        setSearchText(value);
        if (window.inventorySearchTimeout) clearTimeout(window.inventorySearchTimeout);
        window.inventorySearchTimeout = setTimeout(() => {
            fetchArticulos(value);
        }, 300);
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const clearSort = () => {
        setSortConfig({ key: null, direction: 'asc' });
    }

    const abrirModalBloqueo = (articulo) => {
        setArticuloSel(articulo);
        setModalEstadoOpen(true);
    };

    const abrirModalCantidad = (articulo) => {
        setArticuloSel(articulo);
        setModalCantidadOpen(true);
    };

    const abrirModalEliminar = (articulo) => {
        setArticuloSel(articulo);
        setModalEliminarOpen(true)
    }

    const handleNuevoArticulo = async () => {
        navigate('/admin/inventario/crear-articulo')
    }

    useEffect(() => {
        fetchArticulos();
    }, []);

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                {/* Header with blue bar */}
                <h1 className="text-2xl md:text-3xl font-bold mb-5 pb-4 border-b-4" style={{ color: '#163269', borderColor: '#163269' }}>
                    Inventario
                </h1>

                {/* New Article Button Only */}
                <div className="flex justify-end mb-6">
                    <button className="px-6 py-3 bg-white border-2 border-black rounded-lg shadow-md hover:bg-gray-50 transition-colors font-medium text-lg"
                        onClick={handleNuevoArticulo}>
                        Nuevo artículo
                    </button>
                </div>

                {/* Inventory Table Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Table Header with Embedded Search */}
                    <div
                        className="flex flex-col md:flex-row items-center justify-between py-4 px-6 gap-4"
                        style={{ backgroundColor: '#5DADE2' }}
                    >
                        <h2 className="text-2xl font-bold text-inventory-navy text-center md:text-left flex-1" style={{ color: '#003366' }}>
                            Inventario actual
                        </h2>

                        {/* Search Input embedded in header */}
                        <div className="w-full md:w-1/3">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                autoFocus
                                className="w-full px-4 py-2 rounded-md border-none focus:ring-2 focus:ring-blue-800 text-gray-800 font-medium"
                                value={searchText}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>

                        <button
                            className="px-4 py-2 bg-white/90 text-inventory-navy rounded-md hover:bg-white transition-colors font-medium shadow-sm whitespace-nowrap"
                            onClick={clearSort}
                        >
                            Quitar ordenamiento
                        </button>
                    </div>


                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="px-3 py-4 text-left text-sm lg:text-lg font-bold text-black">
                                        Imagen
                                    </th>
                                    <th className="px-3 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('codigo')}>
                                        Codigo {sortConfig.key === 'codigo' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('nombre')}>
                                        Articulo {sortConfig.key === 'nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('costo_unitario')}>
                                        Costo Compra (L.) {sortConfig.key === 'costo_unitario' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('precio')}>
                                        Costo Venta (L.) {sortConfig.key === 'precio' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('costo_util')}>
                                        Costo Utilitario (L.) {sortConfig.key === 'costo_util' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-2 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('cantidad_existencia')}>
                                        En Existencia {sortConfig.key === 'cantidad_existencia' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm lg:text-lg font-bold text-black" onClick={() => requestSort('estado')}>
                                        Estado {sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="px-4 py-4 text-right text-sm lg:text-lg font-bold text-black">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedArticulos.map((item, index) => (
                                    <tr
                                        key={item.codigo}
                                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            }`}
                                    >
                                        <td className="px-4 py-2">
                                            <Image
                                                width={60}
                                                height={60}
                                                className="rounded-lg object-cover shadow-sm cursor-zoom-in"
                                                src={getFullImageUrl(item.foto_url)}
                                                fallback="https://via.placeholder.com/150?text=No+Imagen"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {item.codigo}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {item.nombre}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {Number(item.costo_unitario).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {Number(item.precio).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {(Number(item.precio) - Number(item.costo_unitario)).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg text-black">
                                            {Number(item.cantidad_existencia)}
                                        </td>
                                        <td className="px-4 py-4 text-sm lg:text-lg">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${item.estado === 'Disponible'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    title="Ver detalles"
                                                    onClick={() =>
                                                        navigate(`/admin/inventario/ver-articulo/${item.codigo}`)
                                                    }
                                                >
                                                    <EyeOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    title="Editar"
                                                    onClick={() =>
                                                        navigate(`/admin/inventario/editar-articulo/${item.codigo}`)}
                                                >
                                                    <EditOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    onClick={() => abrirModalEliminar(item)}
                                                    title="Eliminar"
                                                >
                                                    <DeleteOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    onClick={() => abrirModalCantidad(item)}
                                                    title="Añadir"
                                                >
                                                    <PlusCircleOutlined className="w-5 h-5 text-black" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    onClick={() => abrirModalBloqueo(item)}
                                                    title="Bloquear"
                                                >
                                                    <LockOutlined className="w-5 h-5 text-black" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <ModalDeshabilitarArticulo
                    open={modalEstadoOpen}
                    onClose={() => setModalEstadoOpen(false)}
                    articulo={articuloSel}
                    onGuardar={async (articuloActualizado) => {
                        try {
                            await axios.put(
                                `${baseUrl}/articulos/edit/${articuloActualizado.codigo}`,
                                { estado: articuloActualizado.estado }
                            );
                            message.success("Articulo editado con éxito");
                        } catch (error) {
                            message.error("Error inesperado al editar artículo");
                        }
                        fetchArticulos();
                    }}
                />
                <ModalEditarCantidad
                    open={modalCantidadOpen}
                    onClose={() => setModalCantidadOpen(false)}
                    articulo={articuloSel}
                    onGuardar={async (articuloActualizado) => {
                        try {
                            await axios.put(
                                `${baseUrl}/articulos/edit/${articuloActualizado.codigo}`,
                                { cantidad_existencia: articuloActualizado.cantidad_existencia }
                            );
                            message.success("Articulo editado con éxito");
                        } catch (error) {
                            message.error("Error inesperado al editar artículo");
                        }
                        fetchArticulos();
                    }}
                />
                <ModalEliminarArticulo
                    open={modalEliminarOpen}
                    onClose={() => setModalEliminarOpen(false)}
                    articulo={articuloSel}
                    onConfirm={async (articulo) => {
                        try {
                            await axios.delete(
                                `${baseUrl}/articulos/delete/${articulo.codigo}`
                            );
                            message.success("Articulo borrado con éxito");
                        } catch (error) {
                            message.error("Error inesperado al borrar artículo");
                        }
                        fetchArticulos();
                    }}
                />
            </div >
        </div >
    )
}

export default InventarioList
