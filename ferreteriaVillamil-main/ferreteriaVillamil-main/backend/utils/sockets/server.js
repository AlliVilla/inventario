const { Server } = require('socket.io');
const { Pedido } = require('../../models');
const { activeUser } = require('../../middleware/auth');
const { verify } = require('../tokens');

function attachSocket(server) {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' }
  });

  io.on('connection', (socket) => {
    const deliveries = new Map();
    const rooms = new Map();

    socket.on('order:join', async (data) => {
      try {
        const { role, pedido } = data || {};
        let where;
        if (role === 'cliente') {
          const { id } = verify(pedido, 'tracking');
          where = { id_pedido: id };
        } else if (role === 'repartidor') {
          const user = await activeUser(socket.handshake.auth.token);
          if (!user || user.rol !== 'Repartidor' || typeof pedido !== 'string') throw new Error('Acceso denegado');
          where = { numero_pedido: pedido, id_repartidor_asignado: user.id_usuario, id_sucursal: user.id_sucursal };
        } else {
          throw new Error('Rol inválido');
        }

        const order = await Pedido.findOne({ where, attributes: ['id_pedido'] });
        if (!order) throw new Error('Pedido no encontrado');
        const room = 'pedido:' + order.id_pedido;
        rooms.set(pedido, room);
        if (role === 'repartidor') deliveries.set(room, order.id_pedido);
        await socket.join(room);
        socket.emit('order:joined', { response: true });
      } catch {
        socket.emit('order:joined', { response: false });
      }
    });

    socket.on('order:leave', (data) => {
      const { pedido } = data || {};
      const room = rooms.get(pedido);
      if (!room) return;
      deliveries.delete(room);
      rooms.delete(pedido);
      socket.leave(room);
    });

    let lastUpdate = 0;
    socket.on('location:update', async (data) => {
      const { lat, lng, accuracy, timestamp } = data || {};
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
      if (!deliveries.size || Date.now() - lastUpdate < 1000) return;
      lastUpdate = Date.now();
      try {
        const user = await activeUser(socket.handshake.auth.token);
        if (!user || user.rol !== 'Repartidor') return;
        for (const [room, id_pedido] of deliveries) {
          const order = await Pedido.findOne({
            where: { id_pedido, id_repartidor_asignado: user.id_usuario, id_sucursal: user.id_sucursal, estado: 'En transcurso' },
            attributes: ['id_pedido']
          });
          if (order && deliveries.has(room)) {
            io.to(room).emit('location:update', {
              lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : null,
              timestamp: Number.isFinite(timestamp) ? timestamp : Date.now()
            });
          }
        }
      } catch {
        // Ignore invalid sessions and failed lookups.
      }
    });
  });

  return io;
}

module.exports = { attachSocket };
