import { useState } from 'react';
import { FaUser, FaMapMarkerAlt, FaBox } from 'react-icons/fa';
import axios from 'axios';
import { stopLocationTracking } from '../location-tracking/location';

// Configurar axios para enviar token en todas las peticiones
axios.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function PedidoModal({ pedido, onClose, onEstadoChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleIniciarEntrega = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pedidoNumero = pedido.numero_pedido || null;
      const pedidoDbId = pedido.id_pedido || pedido.id;
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/pedidos/${pedidoDbId}/estado`, {
        estado: 'En transcurso'
      });

      if (response.data.status === 'success') {
        // El tracking se actualizará automáticamente cuando el DashboardRepartidor detecte el cambio de estado
        onEstadoChange(pedidoDbId, 'En transcurso');
        onClose();
      } else {
        setError('No se pudo iniciar la entrega');
      }
    } catch (err) {
      console.error('Error al iniciar entrega:', err);
      setError('Error al iniciar la entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEntrega = async () => {
    try {
      setLoading(true);
      setError(null);
      const pedidoId = pedido.id_pedido || pedido.id;
      // Mostrar el modal para ingresar el código
      setShowCodigoModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error al preparar confirmación de entrega:', err);
      setError('Error al preparar confirmación de entrega');
      setLoading(false);
    }
  };

  const handleValidarCodigo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pedidoId = pedido.id_pedido || pedido.id;
      
      // Validar el código usando el endpoint existente
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/${codigoInput}/validar-codigo`);

      if (response.data.status === 'success') {
        // Detener tracking de ubicación del repartidor
        stopLocationTracking();
        
        onEstadoChange(pedidoId, 'Entregado');
        setShowCodigoModal(false);
        setCodigoInput('');
        onClose();
      } else {
        setError('Código de confirmación incorrecto');
      }
    } catch (err) {
      console.error('Error al validar código:', err);
      setError('Error al validar el código de confirmación');
    } finally {
      setLoading(false);
    }
  };

  if (!pedido) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="bg-[#163269] p-4 sm:p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl sm:text-2xl font-bold">
              Pedido #{pedido.numero_pedido}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#163269] border-b border-gray-200 pb-2">
                Información del Cliente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaUser className="w-5 h-5 text-[#BC7D3B]" />
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{pedido.cliente_nombre || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="w-5 h-5 text-[#BC7D3B]" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección de Entrega</p>
                    <p className="font-medium">{pedido.direccion_entrega || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaBox className="w-5 h-5 text-[#163269]" />
                  <div>
                    <p className="text-sm text-gray-500">Enlace de Seguimiento</p>
                    {pedido.numero_pedido ? (
                      <a 
                        href={`${window.location.origin}/cliente/tracking/${pedido.numero_pedido}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {`${window.location.origin}/cliente/tracking/${pedido.numero_pedido}`}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-500">No disponible</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaBox className="w-5 h-5 text-[#BC7D3B]" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha del Pedido</p>
                    <p className="font-medium">{formatDate(pedido.fecha_creacion)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del pedido */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#163269] border-b border-gray-200 pb-2">
                Detalles del Pedido
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    pedido.estado === 'Asignado' ? 'bg-yellow-100 text-yellow-800' :
                    pedido.estado === 'En transcurso' ? 'bg-blue-100 text-blue-800' :
                    pedido.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pedido.estado}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Número de Pedido</p>
                  <p className="font-medium">{pedido.numero_pedido || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono del Cliente</p>
                  <p className="font-medium">{pedido.cliente_telefono || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-4 justify-end flex-wrap">
              {pedido.estado === 'Asignado' && (
                <button
                  onClick={handleIniciarEntrega}
                  disabled={loading}
                  className="bg-[#BC7D3B] hover:bg-[#A66D33] disabled:bg-gray-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  {loading ? 'Iniciando...' : 'Iniciar Entrega'}
                </button>
              )}
              {pedido.estado === 'En transcurso' && (
                <button
                  onClick={handleConfirmarEntrega}
                  disabled={loading}
                  className="bg-[#BC7D3B] hover:bg-[#A66D33] disabled:bg-gray-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  {loading ? 'Confirmando...' : 'Confirmar Entrega'}
                </button>
              )}
              <button
                onClick={onClose}
                disabled={loading}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal para ingresar código de confirmación */}
      {showCodigoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
            {/* Header del modal de código */}
            <div className="bg-[#163269] p-6 rounded-t-3xl">
              <h2 className="text-white text-2xl font-bold text-center">
                Confirmar Entrega
              </h2>
            </div>

            {/* Contenido del modal de código */}
            <div className="p-6">
              <p className="text-gray-700 text-center mb-6">
                Ingresa el código de confirmación para completar la entrega
              </p>
              
              <input
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                placeholder="Código de confirmación"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#BC7D3B] focus:outline-none text-center text-lg font-semibold"
                autoFocus
              />

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setShowCodigoModal(false);
                    setCodigoInput('');
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleValidarCodigo}
                  disabled={loading || !codigoInput.trim()}
                  className="flex-1 bg-[#BC7D3B] hover:bg-[#A66D33] disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Validando...' : 'Validar Código'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
