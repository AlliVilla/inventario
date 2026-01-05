import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { ArrowLeftOutlined, PictureOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function VerArticulo() {
  const [articulo, setArticulo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { codigo } = useParams();
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchArticulo = async () => {
      try {
        const response = await axios.get(`${baseUrl}/articulos/code/${codigo}`);
        setArticulo(response.data.data);
      } catch (err) {
        message.error('Error al cargar el artículo');
        navigate('/admin/inventario');
      } finally {
        setLoading(false);
      }
    };

    if (codigo) {
      fetchArticulo();
    }
  }, [codigo, navigate, baseUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!articulo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Artículo no encontrado</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/inventario')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftOutlined className="w-6 h-6 text-[#163269]" />
          </button>
          <h1 
            className="text-3xl font-bold pb-4 border-b-4 flex-1"
            style={{ color: "#163269", borderColor: "#163269" }}
          >
            Detalles del Artículo
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-10 mt-10">
          {/* Photo Section */}
          <div className="flex flex-col gap-5 lg:w-64">
            <div className="w-full h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
              {articulo.foto_url ? (
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}/${articulo.foto_url.startsWith('/') ? articulo.foto_url.slice(1) : articulo.foto_url}`}
                  alt={articulo.nombre}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <PictureOutlined className="text-6xl text-gray-400 mb-2" />
                  <div className="text-sm text-gray-500">Sin foto</div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Código:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {articulo.codigo}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Nombre:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {articulo.nombre}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Descripción:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg min-h-[80px]">
                  {articulo.descripcion || 'Sin descripción'}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Costo Compra (L.):
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {Number(articulo.costo_unitario).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Costo Venta (L.):
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {Number(articulo.precio).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Inventario Actual:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {Number(articulo.cantidad_existencia)}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Inventario Mínimo:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {Number(articulo.stock_minimo)}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Proveedor:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {articulo.proveedor || 'No especificado'}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Estado:
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      articulo.estado === 'Disponible' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {articulo.estado}
                  </span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                  Costo Utilitario (L.):
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                  {(Number(articulo.precio) - Number(articulo.costo_unitario)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => navigate(`/admin/inventario/editar-articulo/${articulo.codigo}`)}
                className="font-medium py-3 px-4 rounded-lg transition-colors"
                style={{
                  backgroundColor: "#163269",
                  color: "white",
                }}
              >
                Editar Artículo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerArticulo;
