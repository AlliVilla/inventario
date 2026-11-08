var router = require("express").Router();
const { Pedido } = require('../models');
const { context } = require('../utils/branch-context');
const { verify } = require('../utils/tokens');
const pedidoCtrl = require("../controllers/pedido");
const calificacionCtrl = require("../controllers/calificacion");

// Endpoint público para tracking de pedidos (sin autenticación)
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get("/:id", pedidoCtrl.getPedidoClienteTracking);
// Endpoint público para crear calificación desde el tracking (sin autenticación)
router.post("/calificar", async (req, res, next) => {
  let id;
  try {
    ({ id } = verify(req.body.trackingToken, 'tracking'));
  } catch {
    return res.sendStatus(404);
  }
  try {
    const pedido = await Pedido.findByPk(id, { attributes: ['id_sucursal'] });
    if (!pedido) return res.sendStatus(404);
    req.body.id_pedido = id;
    return context.run(pedido.id_sucursal, () => calificacionCtrl.createNewCalificacion(req, res));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

