import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DetallePedidoModal = ({ pedidoId, onClose }) => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPedidoDetalles = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || '/api'}/pedidos/${pedidoId}/detalles`
        );
        
        if (response.data.status === 'success') {
          setPedido(response.data.data);
        } else {
          setError('No se pudieron cargar los detalles del pedido');
        }
      } catch (err) {
        console.error('Error al cargar detalles del pedido:', err);
        setError('Error al cargar los datos del pedido');
      } finally {
        setLoading(false);
      }
    };

    if (pedidoId) {
      fetchPedidoDetalles();
    }
  }, [pedidoId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Pedido no encontrado'}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Detalles del Pedido #{pedido.numero_pedido}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold self-end sm:self-auto"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Información del Cliente</h3>
          <div className="bg-gray-50 rounded p-4 space-y-2">
            <p><span className="font-medium">Nombre:</span> {pedido.cliente_nombre}</p>
            <p><span className="font-medium">Teléfono:</span> {pedido.cliente_telefono}</p>
            <p><span className="font-medium">Identidad:</span> {pedido.cliente_identidad || 'No proporcionada'}</p>
            <p><span className="font-medium">Dirección:</span> {pedido.direccion_entrega}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Información del Pedido</h3>
          <div className="bg-gray-50 rounded p-4 space-y-2">
            <p><span className="font-medium">Número de Pedido:</span> #{pedido.numero_pedido}</p>
            <p><span className="font-medium">Fecha de Creación:</span> {formatDate(pedido.fecha_creacion)}</p>
            <p><span className="font-medium">Fecha de Asignación:</span> {formatDate(pedido.fecha_asignacion)}</p>
            <p><span className="font-medium">Fecha de Entrega:</span> {formatDate(pedido.fecha_entrega)}</p>
            <p><span className="font-medium">Estado:</span> 
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                pedido.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                pedido.estado === 'En transcurso' ? 'bg-blue-100 text-blue-800' :
                pedido.estado === 'Asignado' ? 'bg-yellow-100 text-yellow-800' :
                pedido.estado === 'Pendiente' ? 'bg-gray-100 text-gray-800' :
                pedido.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {pedido.estado}
              </span>
            </p>
            <p><span className="font-medium">Enlace de Seguimiento:</span> 
              {pedido.numero_pedido ? (
                <a 
                  href={`${window.location.origin}/cliente/tracking/${pedido.numero_pedido}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline ml-2"
                >
                  {`${window.location.origin}/cliente/tracking/${pedido.numero_pedido}`}
                </a>
              ) : (
                <span className="text-gray-500 ml-2">No disponible</span>
              )}
            </p>
            {pedido.observacion && (
              <p><span className="font-medium">Observaciones:</span> {pedido.observacion}</p>
            )}
            {pedido.motivo_cancelacion && (
              <p><span className="font-medium">Motivo de Cancelación:</span> {pedido.motivo_cancelacion}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Artículos del Pedido</h3>
          <div className="bg-gray-50 rounded p-4">
            {pedido.Detalle_Pedidos && pedido.Detalle_Pedidos.length > 0 ? (
              <div className="space-y-3">
                {pedido.Detalle_Pedidos.map((detalle, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{detalle.Articulo?.nombre || 'Artículo no disponible'}</p>
                      <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(detalle.precio_unitario)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(detalle.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay artículos disponibles</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Resumen de Costos</h3>
          <div className="bg-gray-50 rounded p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(pedido.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Envío:</span>
              <span>{formatCurrency(pedido.costo_envio || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(pedido.total || 0)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetallePedidoModal;