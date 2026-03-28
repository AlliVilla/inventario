import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaMapMarkerAlt, FaBox } from 'react-icons/fa';
import PedidoModal from './PedidoModal';
import { updateActivePedidos, stopLocationTracking } from '../location-tracking/location';

// Configurar axios para enviar token en todas las peticiones
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function DashboardRepartidor() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        
        // Obtener el ID del usuario del localStorage
        const usuarioData = localStorage.getItem('usuario');
        const usuario = usuarioData ? JSON.parse(usuarioData) : null;
        
        if (!usuario || !usuario.id_usuario) {
          setError('No se pudo identificar al usuario');
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pedidos/repartidor/${usuario.id_usuario}/pedidos`);
        
        if (response.data.status === 'success') {
          setPedidos(response.data.data);
        } else {
          setError('No se pudieron cargar los pedidos');
        }
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('Error al cargar los datos de pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  useEffect(() => {
    // Actualizar tracking para todos los pedidos en transcurso
    const serverUrl = (
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') ||
      window.location.origin
    );

    updateActivePedidos(serverUrl, pedidos);
  }, [pedidos]);

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  const handleVerPedido = (pedido) => {
    console.log('Dashboard - Abriendo modal de pedido:', pedido);
    setSelectedPedido(pedido);
    setShowModal(true);
  };

  const handleEstadoChange = (pedidoId, nuevoEstado) => {
    // Actualizar el estado del pedido en la lista local
    setPedidos(prevPedidos => 
      prevPedidos.map(pedido => 
        (pedido.id_pedido || pedido.id) === pedidoId 
          ? { ...pedido, estado: nuevoEstado }
          : pedido
      )
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPedido(null);
  };

  // Filtrar pedidos por estado
  const pedidosAsignados = pedidos.filter(p => p.estado === 'Asignado');
  const pedidosEnTranscurso = pedidos.filter(p => p.estado === 'En transcurso');
  const pedidosEntregados = pedidos.filter(p => p.estado === 'Entregado');

  // Formatear fecha
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header with blue bar */}
        <h1 className="text-2xl md:text-3xl font-bold mb-5 pb-4 border-b-4" style={{ color: '#163269', borderColor: '#163269' }}>
          Dashboard
        </h1>

        {/* Tarjetas de estadísticas */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
          <div className="bg-[#E5A944] rounded-full px-6 py-4 sm:px-8 sm:py-6 shadow-lg flex-1">
            <p className="text-white text-lg sm:text-xl font-bold text-center whitespace-nowrap">
              Pendientes: {pedidosAsignados.length}
            </p>
          </div>
          <div className="bg-[#E5A944] rounded-full px-6 py-4 sm:px-8 sm:py-6 shadow-lg flex-1">
            <p className="text-white text-lg sm:text-xl font-bold text-center whitespace-nowrap">
              En Transcurso: {pedidosEnTranscurso.length}
            </p>
          </div>
          <div className="bg-[#E5A944] rounded-full px-6 py-4 sm:px-8 sm:py-6 shadow-lg flex-1">
            <p className="text-white text-lg sm:text-xl font-bold text-center whitespace-nowrap">
              Entregados: {pedidosEntregados.length}
            </p>
          </div>
        </div>

        {/* Secciones de pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pedidos Asignados */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-[#163269] py-5">
              <h2 className="text-white text-2xl font-bold text-center">
                Pedidos Asignados
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {pedidosAsignados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay pedidos asignados
                </div>
              ) : (
                pedidosAsignados.map((pedido) => (
                  <div
                    key={pedido.id_pedido || pedido.id}
                    className="bg-[#EFEFEF] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <FaUser className="w-5 h-5 text-black flex-shrink-0" />
                        <span className="text-black font-medium text-sm sm:text-base">
                          {pedido.cliente_nombre || 'Cliente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="w-5 h-5 text-black flex-shrink-0" />
                        <span className="text-black text-xs sm:text-sm break-words">
                          {pedido.direccion_entrega || 'Sin dirección'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaBox className="w-5 h-5 text-black flex-shrink-0" />
                        <span className="text-black text-xs sm:text-sm">
                          Pedido #{pedido.numero_pedido} • {formatDate(pedido.fecha_creacion)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerPedido(pedido)}
                      className="bg-[#BC7D3B] hover:bg-[#A66D33] text-white font-semibold px-6 py-2 rounded-xl transition-colors text-sm sm:text-base whitespace-nowrap self-start sm:self-auto"
                    >
                      Ver Pedido
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pedidos en transcurso */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-[#163269] py-5">
              <h2 className="text-white text-2xl font-bold text-center">
                Pedidos en transcurso
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {pedidosEnTranscurso.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay pedidos en transcurso
                </div>
              ) : (
                pedidosEnTranscurso.map((pedido) => (
                  <div
                    key={pedido.id_pedido || pedido.id}
                    className="bg-[#EFEFEF] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <FaUser className="w-5 h-5 text-black flex-shrink-0" />
                        <span className="text-black font-medium text-sm sm:text-base">
                          {pedido.cliente_nombre || 'Cliente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="w-5 h-5 text-black flex-shrink-0" />
                        <span className="text-black text-xs sm:text-sm break-words">
                          {pedido.direccion_entrega || 'Sin dirección'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaBox className="w-5 h-5 text-black flex-shrink-0" />
                        <span className="text-black text-xs sm:text-sm">
                          Pedido #{pedido.numero_pedido} • {formatDate(pedido.fecha_creacion)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerPedido(pedido)}
                      className="bg-[#BC7D3B] hover:bg-[#A66D33] text-white font-semibold px-6 py-2 rounded-xl transition-colors text-sm sm:text-base whitespace-nowrap self-start sm:self-auto"
                    >
                      Ver Pedido
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal de Pedido */}
        {showModal && selectedPedido && (
          <PedidoModal 
            pedido={selectedPedido} 
            onClose={handleCloseModal}
            onEstadoChange={handleEstadoChange}
          />
        )}
      </div>
    </div>
  );
}
