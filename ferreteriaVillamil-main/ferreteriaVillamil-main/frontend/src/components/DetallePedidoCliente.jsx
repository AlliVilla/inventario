import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InfoRepartidorCliente from './InfoRepartidorCliente';

// Crear instancia de axios sin autenticación para tracking público
// La ruta pública está montada en /cliente/tracking, no en /api
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  // Remover /api del final si existe
  return apiUrl.replace(/\/api\/?$/, '') || '';
};

const publicAxios = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

function DetallePedidoCliente({ pedidoId }) {
  const [pedidoData, setPedidoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pedidoId) {
      fetchPedidoData();
    }
  }, [pedidoId]);

  const fetchPedidoData = async () => {
    setLoading(true);
    try {
      const response = await publicAxios.get(`/cliente/tracking/${pedidoId}`);
      setPedidoData(response.data.data);
    } catch (err) {
      setError('Error al cargar datos del pedido');
      console.error('Error fetching pedido:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <p className="text-center">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  if (!pedidoData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <p className="text-center">No se encontró información del pedido</p>
      </div>
    );
  }

  // Extraer datos del repartidor
  const repartidor = pedidoData.Usuario;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
      {/* Código de Confirmación */}
      <div className="mb-6 sm:mb-8 text-center">
        <p className="text-sm sm:text-base font-medium text-gray-600 mb-2">Código de Confirmación</p>
        <div className="bg-gray-100 rounded-lg p-3 sm:p-4 inline-block">
          <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#163269' }}>
            {pedidoData.codigo_confirmacion}
          </p>
        </div>
      </div>

      {/* Información del Repartidor */}
      {repartidor && (
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4" style={{ color: '#163269' }}>
            Información del Repartidor
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <InfoRepartidorCliente 
              nombre={repartidor.nombre} 
              telefono={repartidor.telefono} 
            />
          </div>
        </div>
      )}

      {/* Detalles del Envío */}
      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold" style={{ color: '#163269' }}>
          Detalles del Envío
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-3 border-b border-gray-200">
          <span className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-0">Estado:</span>
          <span 
            className="px-3 py-1 sm:px-4 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: pedidoData.estado === 'Entregado' ? '#5E9C08' : '#BC7D3B'
            }}
          >
            {pedidoData.estado}
          </span>
        </div>

        <div className="py-2 sm:py-3">
          <span className="text-gray-600 block mb-2 text-sm sm:text-base">Dirección de Entrega:</span>
          <p className="font-medium text-sm sm:text-base" style={{ color: '#163269' }}>
            {pedidoData.direccion_entrega}
          </p>
        </div>

        {/* Artículos del Pedido */}
        {pedidoData.Detalle_Pedidos && pedidoData.Detalle_Pedidos.length > 0 && (
          <div className="py-2 sm:py-3">
            <span className="text-gray-600 block mb-3 sm:mb-4 text-sm sm:text-base">Artículos:</span>
            <div className="space-y-2 sm:space-y-3">
              {pedidoData.Detalle_Pedidos.map((detalle, index) => (
                <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="font-medium text-sm sm:text-base mb-1">{detalle.Articulo.nombre}</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Cantidad: {detalle.cantidad} | Precio: L.{detalle.Articulo.precio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetallePedidoCliente;
