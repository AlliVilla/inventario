import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configurar axios para enviar token en todas las peticiones
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function PedidoCardRepartidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('pendiente');

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        setLoading(true);
        console.log('PedidoCard - ID del pedido:', id);
        
        if (!id) {
          console.error('PedidoCard - ID es undefined');
          setError('ID de pedido no proporcionado');
          return;
        }
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pedidos/${id}`);
        
        if (response.data.status === 'success') {
          const pedidoData = response.data.data;
          setPedido(pedidoData);
          
          // Determinar el estado basado en el estado del pedido
          if (pedidoData.estado === 'Asignado') {
            setStatus('pendiente');
          } else if (pedidoData.estado === 'En transcurso') {
            setStatus('en-curso');
          }
        } else {
          setError('No se pudo cargar el pedido');
        }
      } catch (err) {
        console.error('Error al cargar pedido:', err);
        setError('Error al cargar los datos del pedido');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPedido();
    }
  }, [id]);

  const handleClose = () => {
    navigate('/repartidor');
  };
  
  const handleAction = async () => {
    try {
      if (status === 'pendiente') {
        // Iniciar entrega - generar código de confirmación
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/pedidos/${id}/generar-codigo`);
        
        if (response.data.status === 'success') {
          setStatus('en-curso');
          alert(`Código de confirmación: ${response.data.codigo}`);
        }
      } else {
        // Confirmar entrega - validar código (necesitarías el código del cliente)
        const codigo = prompt('Ingrese el código de confirmación del cliente:');
        if (codigo) {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/pedidos/${id}/${codigo}/validar-codigo`);
          
          if (response.data.status === 'success') {
            navigate('/repartidor');
          } else {
            alert('Código incorrecto');
          }
        }
      }
    } catch (err) {
      console.error('Error al procesar acción:', err);
      alert('Error al procesar la acción');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Cargando datos del pedido...</div>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center text-red-600 mb-4">{error || 'Pedido no encontrado'}</div>
          <button
            onClick={handleClose}
            className="w-full bg-blue-900 text-white py-2 px-4 rounded-lg hover:bg-blue-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative">
        {/* Botón de cerrar */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FaTimes size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Detalles del Pedido</h2>

          {/* Info Cliente */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Info Cliente</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium w-24 text-gray-600">Nombre:</span>
                <span className="text-gray-800">{pedido.cliente_nombre}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-24 text-gray-600">Teléfono:</span>
                <span className="text-gray-800">{pedido.cliente_telefono}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-24 text-gray-600">Direccion:</span>
                <span className="text-gray-800">{pedido.direccion_entrega}</span>
              </div>
            </div>
          </div>

          {/* Info Pedido */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Info Pedido</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Número Pedido:</span>
                <span className="text-gray-800">{pedido.numero_pedido}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Cantidad de Artículos:</span>
                <span className="text-gray-800">N/A (requiere detalles)</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Total a Pagar:</span>
                <span className="text-gray-800">L. {parseFloat(pedido.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Costo Envío:</span>
                <span className="text-gray-800">L. {parseFloat(pedido.costo_envio || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Info Adicional */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Info Adicional</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Observación:</span>
                <span className="text-gray-800 text-sm">{pedido.observacion || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Fecha Asignación:</span>
                <span className="text-gray-800">
                  {pedido.fecha_asignacion ? new Date(pedido.fecha_asignacion).toLocaleString('es-HN') : 'N/A'}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Enlace de Seguimiento:</span>
                {pedido.numero_pedido ? (
                  <a 
                    href={`${window.location.origin}/cliente/tracking/${pedido.numero_pedido}`}
                    className="text-blue-600 hover:underline text-sm break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`${window.location.origin}/cliente/tracking/${pedido.numero_pedido}`}
                  </a>
                ) : (
                  <span className="text-gray-800 text-sm">N/A</span>
                )}
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <button
            onClick={handleAction}
            className="w-full bg-blue-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            {status === 'pendiente' ? 'Iniciar Entrega' : 'Confirmar Entrega'}
          </button>
        </div>
      </div>
    </div>
  );
}
