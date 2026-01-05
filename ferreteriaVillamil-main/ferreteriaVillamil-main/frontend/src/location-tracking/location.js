import { io } from 'socket.io-client';

let socket = null;
let watchId = null;
let activePedidos = new Set(); // Set de pedidos activos que están siendo rastreados
let currentLocation = null;

export function connectSocket(serverUrl) {
  if (socket && socket.connected) 
    return socket;

  const url = serverUrl || window.location.origin;
  socket = io(url, {
    transports: ['websocket', 'polling'],
    timeout: 5000
  });

  socket.on('connect', () => {
    console.log('Conectado al servidor de ubicación:', serverUrl);
    // Re-join todas las salas activas cuando se reconecta
    activePedidos.forEach(pedido => {
      socket.emit('order:join', { role: 'repartidor', pedido });
    });
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err?.message || err);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket desconectado:', reason);
  });

  return socket;
}

// Agregar un pedido al tracking
export function addPedidoToTracking(serverUrl, pedido) {
  if (!pedido) {
    console.warn('No se proporcionó un identificador de pedido');
    return;
  }

  const pedidoStr = String(pedido);
  
  if (activePedidos.has(pedidoStr)) {
    console.log(`Pedido ${pedidoStr} ya está siendo rastreado`);
    return;
  }

  connectSocket(serverUrl);

  if (socket && socket.connected) {
    socket.emit('order:join', { role: 'repartidor', pedido: pedidoStr });
    activePedidos.add(pedidoStr);
    console.log(`Agregado pedido ${pedidoStr} al tracking. Total activos: ${activePedidos.size}`);
  } else {
    // Si el socket no está conectado, esperar a que se conecte
    socket?.once('connect', () => {
      socket.emit('order:join', { role: 'repartidor', pedido: pedidoStr });
      activePedidos.add(pedidoStr);
      console.log(`Agregado pedido ${pedidoStr} al tracking después de reconexión. Total activos: ${activePedidos.size}`);
    });
  }

  // Iniciar tracking de ubicación si aún no está activo
  if (watchId === null) {
    startLocationWatch();
  }
}

// Remover un pedido del tracking
export function removePedidoFromTracking(pedido) {
  if (!pedido) return;

  const pedidoStr = String(pedido);
  
  if (activePedidos.has(pedidoStr)) {
    activePedidos.delete(pedidoStr);
    console.log(`Removido pedido ${pedidoStr} del tracking. Total activos: ${activePedidos.size}`);

    if (socket && socket.connected) {
      socket.emit('order:leave', { pedido: pedidoStr });
    }

    // Si no hay más pedidos activos, detener el watch de ubicación
    if (activePedidos.size === 0) {
      stopLocationWatch();
    }
  }
}

// Actualizar la lista de pedidos activos (para cuando cambian los pedidos en transcurso)
export function updateActivePedidos(serverUrl, pedidos) {
  const pedidosEnTranscurso = pedidos
    .filter(p => p.estado === 'En transcurso')
    .map(p => String(p.numero_pedido || p.id_pedido || p.id))
    .filter(Boolean);

  const pedidosSet = new Set(pedidosEnTranscurso);

  // Agregar nuevos pedidos
  pedidosSet.forEach(pedido => {
    if (!activePedidos.has(pedido)) {
      addPedidoToTracking(serverUrl, pedido);
    }
  });

  // Remover pedidos que ya no están en transcurso
  activePedidos.forEach(pedido => {
    if (!pedidosSet.has(pedido)) {
      removePedidoFromTracking(pedido);
    }
  });
}

// Iniciar el watch de ubicación (solo una vez)
function startLocationWatch() {
  if (!('geolocation' in navigator)) {
    console.error('Geolocalización no soportada');
    return null;
  }

  if (watchId !== null) {
    return; // Ya está activo
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      };

      // Enviar ubicación a todas las salas activas
      if (socket && socket.connected && activePedidos.size > 0) {
        socket.emit('location:update', currentLocation);
        console.log(`Emitiendo location:update para ${activePedidos.size} pedido(s) activo(s)`, currentLocation);
      }
    },
    (error) => {
      console.error('Error de geolocalización:', error);
    },
    options
  );

  console.log('Iniciado watch de ubicación');
}

// Detener el watch de ubicación
function stopLocationWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.log('Detenido watch de ubicación');
  }
}

// Función legacy para compatibilidad (ahora usa addPedidoToTracking internamente)
export function startLocationTracking(serverUrl, trackingInfo = {}, onLocationUpdate) {
  const pedido = trackingInfo.pedido;
  
  if (pedido) {
    addPedidoToTracking(serverUrl, pedido);
  } else {
    console.warn('No se proporcionó un identificador de pedido, no se unirá a ninguna sala.');
  }

  return watchId;
}

// Función legacy para compatibilidad
export function stopLocationTracking() {
  // Limpiar todos los pedidos activos
  activePedidos.forEach(pedido => {
    if (socket && socket.connected) {
      socket.emit('order:leave', { pedido });
    }
  });
  activePedidos.clear();

  stopLocationWatch();

  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

