const { Server } = require('socket.io');
const { Pedido } = require('../../models');


/*
##eventos###

 - order:join -> repartidor/cliente envían { role, pedido } para unirse a la sala del pedido.
 - order:leave -> (a implementar) permitiría salir de la sala.
 - location:update -> el repartidor comparte su lat/lng y se reenvía a todos los sockets en la sala.
*/
const attachSocket = (server) =>{
    const lastLocations = new Map();
    const normalizePedidoRoom = async (pedido) => {
        const raw = pedido == null ? '' : String(pedido);
        if (!raw) return null;

        const isNumeric = /^\d+$/.test(raw);
        const where = isNumeric ? { id_pedido: Number(raw) } : { numero_pedido: raw };
 
        const pedidoDb = await Pedido.findOne({
            where,
            attributes: ['numero_pedido']
        });

        return pedidoDb?.numero_pedido ? String(pedidoDb.numero_pedido) : null;
    };

    const io = new Server(server, {
        cors: {
            origin: [
                "https://localhost:5173", 
                "http://localhost:5173", 
                "http://localhost:3000",
                "https://grab-remarkable-clips-virgin.trycloudflare.com",
                "https://paradise-corp-version-inch.trycloudflare.com",
                /^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):[0-9]+$/,
                /^https:\/\/.*\.trycloudflare\.com$/
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        let role = null;
        const repartidorRooms = new Set(); // Track todas las salas del repartidor

        // Listener de location:update para repartidores (fuera de order:join para que funcione para todas las salas)
        socket.on('location:update', async (locationData) => {
            // Solo procesar si el socket tiene salas de repartidor activas
            if (repartidorRooms.size === 0) {
                return;
            }

            const { lat, lng, accuracy, timestamp } = locationData;
            
            // Validar y emitir a todas las salas del repartidor
            const roomsToUpdate = [];
            
            for (const roomPedido of repartidorRooms) {
                try {
                    const pedidoDb = await Pedido.findOne({
                        where: { numero_pedido: roomPedido },
                        attributes: ['estado']
                    });

                    if (pedidoDb && pedidoDb.estado === 'En transcurso') {
                        roomsToUpdate.push(roomPedido);
                    }
                } catch (err) {
                    console.error(`Error validando estado del pedido ${roomPedido} para tracking:`, err);
                }
            }

            if (roomsToUpdate.length === 0) {
                return;
            }

            const payload = { lat, lng, accuracy, timestamp };
            
            // Emitir a todas las salas válidas
            roomsToUpdate.forEach(roomPedido => {
                lastLocations.set(String(roomPedido), payload);
                io.to(roomPedido).emit('location:update', payload);
            });
            
            console.log(`Ubicacion del repartidor emitida a ${roomsToUpdate.length} sala(s): Latitud ${lat}, Longitud ${lng}`);
        });

        socket.on('order:join', async (data) => {
            const { role: localRole, pedido } = data;
            role = localRole;

            try {
                const roomPedido = await normalizePedidoRoom(pedido);
                if (!roomPedido) {
                    console.log(`order:join rechazado (socket=${socket.id}, role=${role}, pedido=${String(pedido)})`);
                    socket.emit('order:joined', { response: false });
                    return;
                }

                console.log(`usuario ${role} se ha conectado (socket=${socket.id})`);
                socket.join(roomPedido);
                console.log(`El ${role} se ha unido a la sala del pedido: ${roomPedido}`);
                socket.emit('order:joined', { response: true });

                // Si es repartidor, agregar la sala a la lista de salas activas
                if (role === 'repartidor') {
                    repartidorRooms.add(roomPedido);
                    console.log(`Repartidor ahora está en ${repartidorRooms.size} sala(s)`);
                }

                if (role === 'cliente') {
                    const last = lastLocations.get(String(roomPedido));
                    if (last) {
                        socket.emit('location:update', last);
                    }
                }
            } catch (err) {
                console.error('Error en order:join:', err);
                socket.emit('order:joined', { response: false });
            }
        });

        socket.on('order:leave', async (data) => {
            const { pedido } = data;
            if (!pedido) return;

            try {
                const roomPedido = await normalizePedidoRoom(pedido);
                if (roomPedido) {
                    socket.leave(roomPedido);
                    if (role === 'repartidor') {
                        repartidorRooms.delete(roomPedido);
                        console.log(`Repartidor salió de la sala ${roomPedido}. Quedan ${repartidorRooms.size} sala(s)`);
                    }
                    console.log(`Usuario ${socket.id} salió de la sala del pedido: ${roomPedido}`);
                }
            } catch (err) {
                console.error('Error en order:leave:', err);
            }
        });


        socket.on('disconnect', (reason) => {
            console.log(`usuario ${role} desconectado (socket=${socket.id}, reason=${reason})`);
            if (role === 'repartidor') {
                repartidorRooms.clear();
            }
        });

    });

    return io;

};

module.exports = { attachSocket };