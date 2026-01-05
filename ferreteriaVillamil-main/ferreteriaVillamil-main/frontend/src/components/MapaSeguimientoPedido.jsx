import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Circle, MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DetallePedidoCliente from './DetallePedidoCliente';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Coordenadas de Honduras
const HONDURAS_BOUNDS = [
  [12.98, -89.36], // Suroeste
  [16.51, -83.13]  // Noreste
];

// Centro por defecto (Tegucigalpa)
const DEFAULT_MAP_CENTER = [14.0818, -87.2068];

function MapaSeguimientoPedido({ pedidoId: pedidoIdProp }) {
  const { pedidoId: pedidoIdParam } = useParams();
  const pedidoId = pedidoIdProp || pedidoIdParam;
  const [pedidoData, setPedidoData] = useState(null);
  const [repartidorLocation, setRepartidorLocation] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [clienteLocation, setClienteLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const hasCenteredOnRepartidorRef = useRef(false);
  const [calificacion, setCalificacion] = useState(null);
  const [showCalificacionForm, setShowCalificacionForm] = useState(false);
  const [calificacionPuntuacion, setCalificacionPuntuacion] = useState(0);
  const [calificacionComentario, setCalificacionComentario] = useState('');
  const [calificando, setCalificando] = useState(false);
  const [calificacionError, setCalificacionError] = useState('');

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsTracking(false);
    setRepartidorLocation(null);
  }, []);

  const fetchPedidoData = useCallback(async ({ silent = false } = {}) => {
    if (!pedidoId) {
      setError('Pedido inválido');
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }

      // Ruta pública sin /api ya que está montada directamente en /cliente/tracking
      const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '';
      const response = await fetch(`${baseUrl || ''}/cliente/tracking/${pedidoId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setPedidoData(data.data);
        // Verificar si hay calificación
        if (data.data.Calificacion) {
          setCalificacion(data.data.Calificacion);
        }
        setMapReady(true);
        setError('');
      } else {
        setError('No se pudo cargar la información del pedido');
      }
    } catch (err) {
      console.error('Error al cargar datos del pedido:', err);
      setError('Error al cargar datos del pedido');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [pedidoId]);

  const connectSocket = useCallback(() => {
    if (!pedidoId) return;
    if (socketRef.current) return;

    try {
      const serverUrl = (
        import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') ||
        window.location.origin
      );
      socketRef.current = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        autoConnect: true
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('order:join', { role: 'cliente', pedido: pedidoId });
      });

      socketRef.current.on('location:update', (locationData) => {
        setRepartidorLocation({
          lat: locationData.lat,
          lng: locationData.lng,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp
        });
      });

      socketRef.current.on('connect_error', (socketError) => {
        console.error('Error de conexión al socket:', socketError);
      });

      socketRef.current.on('disconnect', () => {
        setIsTracking(false);
      });
    } catch (err) {
      console.error('Error al inicializar socket:', err);
    }
  }, [pedidoId]);

  useEffect(() => {
    fetchPedidoData();

    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket, fetchPedidoData]);

  useEffect(() => {
    if (!pedidoData) return;

    if (pedidoData.estado === 'En transcurso') {
      connectSocket();
      setIsTracking(true);
    } else {
      disconnectSocket();
    }
  }, [connectSocket, disconnectSocket, pedidoData]);

  useEffect(() => {
    if (!pedidoData) return;

    if (pedidoData.estado === 'Entregado' || pedidoData.estado === 'Cancelado') {
      return;
    }

    const intervalId = setInterval(() => {
      fetchPedidoData({ silent: true });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchPedidoData, pedidoData]);

  // Eliminado el efecto de geocodificación de dirección de destino - no es necesario

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('La geolocalización no es compatible con tu navegador');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('Ubicación del cliente obtenida:', { latitude, longitude, accuracy });
        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        };
        setClienteLocation(newLocation);
        // También establecer como ubicación del usuario actual (para que el repartidor vea su propia ubicación)
        setCurrentUserLocation(newLocation);
        
        // Actualizar el centro del mapa si es la primera vez que obtenemos la ubicación
        setMapCenter([latitude, longitude]);
        setLocationError(null);
      },
      (err) => {
        console.error('Error de geolocalización:', err);
        setLocationError('No se pudo obtener tu ubicación. Verifica los permisos.');
      },
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!isMapInitialized) return;
    if (!mapRef.current) return;
    if (!repartidorLocation?.lat || !repartidorLocation?.lng) return;

    // Si tenemos ubicación del cliente, mostrar vista que incluya ambos
    if (clienteLocation?.lat && clienteLocation?.lng) {
      try {
        const bounds = L.latLngBounds([
          [repartidorLocation.lat, repartidorLocation.lng],
          [clienteLocation.lat, clienteLocation.lng]
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        return;
      }
    } else {
      // Si no hay ubicación del cliente, centrar en repartidor
      if (!hasCenteredOnRepartidorRef.current) {
        hasCenteredOnRepartidorRef.current = true;
        try {
          mapRef.current.setView([repartidorLocation.lat, repartidorLocation.lng], 15, { animate: true });
        } catch (e) {
          return;
        }
      }
    }
  }, [isMapInitialized, repartidorLocation, clienteLocation]);

  const startTracking = () => {
    if (!isTracking && socketRef.current && socketRef.current.connected) {
      setIsTracking(true);
    }
  };

  const requestClientLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Ubicación del cliente obtenida manualmente:', pos.coords);
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setClienteLocation(newLocation);
        // Actualizar el centro del mapa al obtener la ubicación manualmente
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      },
      (error) => {
        console.warn('Error obteniendo ubicación del cliente:', error.message);
        alert('No se pudo obtener tu ubicación. Asegúrate de haber dado permiso de geolocalización.');
      },
      options
    );
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Asignado':
        return '#BC7D3B'; // Naranja
      case 'En transcurso':
        return '#5E9C08'; // Verde
      case 'Entregado':
        return '#5E9C08'; // Verde
      case 'Cancelado':
        return '#DC2626'; // Rojo
      default:
        return '#6B7280'; // Gris
    }
  };

  const handleCalificar = async () => {
    if (!calificacionPuntuacion || calificacionPuntuacion < 1 || calificacionPuntuacion > 5) {
      setCalificacionError('Por favor selecciona una puntuación');
      return;
    }

    if (!pedidoData || !pedidoData.id_pedido) {
      setCalificacionError('Error: No se pudo identificar el pedido');
      return;
    }

    setCalificando(true);
    setCalificacionError('');

    try {
      // Ruta pública sin /api ya que está montada directamente en /cliente/tracking
      const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '';
      const response = await fetch(`${baseUrl || ''}/cliente/tracking/calificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_pedido: pedidoData.id_pedido,
          puntuacion: calificacionPuntuacion,
          comentario: calificacionComentario.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setCalificacion(data.data);
        setShowCalificacionForm(false);
        setCalificacionPuntuacion(0);
        setCalificacionComentario('');
        // Recargar datos del pedido para actualizar la calificación
        fetchPedidoData();
      } else {
        setCalificacionError(data.message || 'Error al enviar la calificación');
      }
    } catch (err) {
      console.error('Error al calificar:', err);
      setCalificacionError('Error al enviar la calificación. Por favor intenta de nuevo.');
    } finally {
      setCalificando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa de seguimiento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!pedidoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No se encontró información del pedido</p>
      </div>
    );
  }

  // Si el pedido está entregado o cancelado, mostrar mensaje en lugar del mapa
  const isFinalizado = pedidoData.estado === 'Entregado' || pedidoData.estado === 'Cancelado';
  const puedeCalificar = pedidoData.estado === 'Entregado' && !calificacion;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Seguimiento del Pedido</h1>
              <span 
                className="ml-3 px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: getEstadoColor(pedidoData.estado) }}
              >
                {pedidoData.estado}
              </span>
            </div>
            <div className="flex gap-2">
              {!isFinalizado && !clienteLocation && (
                <button
                  onClick={requestClientLocation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Obtener mi ubicación
                </button>
              )}
              {!isFinalizado && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showDetails ? 'Ocultar' : 'Ver'} Detalles
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Mapa o Mensaje de estado finalizado */}
        <div className="flex-1 relative">
          {isFinalizado ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
                {pedidoData.estado === 'Entregado' ? (
                  <>
                    <div className="mb-6">
                      <svg className="mx-auto h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido Entregado</h2>
                    <p className="text-gray-600 mb-6">
                      Tu pedido ha sido entregado exitosamente. ¡Gracias por tu compra!
                    </p>
                    {calificacion ? (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Tu calificación:</p>
                        <div className="flex items-center justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-6 w-6 ${star <= calificacion.puntuacion ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {calificacion.comentario && (
                          <p className="text-sm text-gray-700 italic">"{calificacion.comentario}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Calificado el {new Date(calificacion.fecha_calificacion).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    ) : (
                      <>
                        {showCalificacionForm ? (
                          <div className="mt-6 text-left">
                            <h3 className="text-lg font-semibold mb-4">Califica tu experiencia</h3>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Puntuación
                              </label>
                              <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setCalificacionPuntuacion(star)}
                                    className={`h-10 w-10 ${star <= calificacionPuntuacion ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                  >
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comentario (opcional)
                              </label>
                              <textarea
                                value={calificacionComentario}
                                onChange={(e) => setCalificacionComentario(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Comparte tu experiencia..."
                              />
                            </div>
                            {calificacionError && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{calificacionError}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={handleCalificar}
                                disabled={calificando || !calificacionPuntuacion}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {calificando ? 'Enviando...' : 'Enviar Calificación'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowCalificacionForm(false);
                                  setCalificacionError('');
                                  setCalificacionPuntuacion(0);
                                  setCalificacionComentario('');
                                }}
                                disabled={calificando}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCalificacionForm(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            Calificar Pedido
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <svg className="mx-auto h-16 w-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido Cancelado</h2>
                    <p className="text-gray-600 mb-2">
                      Este pedido ha sido cancelado.
                    </p>
                    {pedidoData.motivo_cancelacion && (
                      <p className="text-sm text-gray-500 italic">
                        Motivo: {pedidoData.motivo_cancelacion}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            mapReady ? (
              <MapContainer 
              center={mapCenter}
              zoom={13}
              minZoom={6}
              maxZoom={16}
              maxBounds={HONDURAS_BOUNDS}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              attributionControl={false}
              whenReady={(map) => {
                mapRef.current = map.target;
                setIsMapInitialized(true);
                if (!repartidorLocation?.lat || !repartidorLocation?.lng) {
                  map.target.fitBounds(HONDURAS_BOUNDS);
                }
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                bounds={HONDURAS_BOUNDS}
                minZoom={6}
                maxZoom={16}
                maxNativeZoom={18}
                noWrap={true}
                updateWhenIdle={false}
                updateWhenZooming={false}
              />

              {/* Mensaje de error de geolocalización */}
              {locationError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 border border-red-200 px-4 py-2 rounded-lg shadow max-w-sm">
                  <span className="text-sm text-red-700">{locationError}</span>
                </div>
              )}

              {/* Mensaje de espera de repartidor */}
              {pedidoData.estado === 'En transcurso' && !repartidorLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 border border-gray-200 px-4 py-2 rounded-lg shadow">
                  <span className="text-sm text-gray-700">Esperando ubicación del repartidor...</span>
                </div>
              )}

              {/* Marcador del repartidor si está en transcurso */}
              {pedidoData.estado === 'En transcurso' && repartidorLocation && (
                <Marker 
                  position={[repartidorLocation.lat, repartidorLocation.lng]}
                  icon={L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838694.png',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                  })}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent>
                    Repartidor
                  </Tooltip>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Repartidor en camino</p>
                      {repartidorLocation.timestamp && (
                        <p className="text-sm text-gray-600">Actualizado: {new Date(repartidorLocation.timestamp).toLocaleTimeString()}</p>
                      )}
                      <p className="text-sm text-gray-600">Precisión: {Math.round(repartidorLocation.accuracy)} m</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Marcador del usuario actual (cliente o repartidor) */}
              {currentUserLocation && (
                <Marker 
                  position={[currentUserLocation.lat, currentUserLocation.lng]}
                  icon={L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                  })}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent>
                    Tú
                  </Tooltip>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Tu ubicación</p>
                      <p className="text-sm text-gray-600">
                        Precisión: {currentUserLocation.accuracy ? `${Math.round(currentUserLocation.accuracy)} m` : 'Desconocida'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Panel de Detalles */}
        {showDetails && !isFinalizado && (
          <div className="w-full lg:w-96 bg-white shadow-lg p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Detalles del Pedido</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <DetallePedidoCliente pedidoId={pedidoId} />
          </div>
        )}
        
        {/* Panel de Detalles cuando está finalizado */}
        {isFinalizado && (
          <div className="w-full lg:w-96 bg-white shadow-lg p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Detalles del Pedido</h2>
            </div>
            
            <DetallePedidoCliente pedidoId={pedidoId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MapaSeguimientoPedido;
