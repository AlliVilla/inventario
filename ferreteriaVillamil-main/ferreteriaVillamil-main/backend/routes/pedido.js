var router = require("express").Router();

const { limitAttempts } = require('../middleware/limit-attempts');
const { admin } = require('../middleware/auth');
const { Pedido } = require('../models');

function ownCourier(req, res, next) {
  if (req.usuario.rol === 'Administrador' || String(req.usuario.id_usuario) === req.params.id_repartidor) return next();
  return res.status(403).json({ message: 'Acceso denegado' });
}

async function assignedOrder(req, res, next) {
  if (req.usuario.rol === 'Administrador') return next();
  if (!/^\d+$/.test(req.params.id)) return res.sendStatus(404);
  try {
    const pedido = await Pedido.findOne({
      where: { id_pedido: req.params.id, id_repartidor_asignado: req.usuario.id_usuario },
      attributes: ['id_pedido']
    });
    if (pedido) return next();
    return res.sendStatus(404);
  } catch (error) {
    return next(error);
  }
}

const userCtrl = require("../controllers/pedido.js");

router.post("/newPedido", admin, userCtrl.createNewPedido);
router.get("/getAllPedidos", admin, userCtrl.getAllPedidos);
router.get("/:id", assignedOrder, userCtrl.getPedidoById);
router.get("/:id/detalles", assignedOrder, userCtrl.getDetallesPedido);
router.delete("/deletePedido/:id", admin, userCtrl.deletePedido);
router.put("/updatePedido/:id", admin, userCtrl.updatePedido);
router.post("/:id/generar-codigo", assignedOrder, userCtrl.mandarCodigoEntregado);
router.post("/:id/:codigo/validar-codigo", assignedOrder, limitAttempts(10, req => req.usuario.id_usuario), userCtrl.validarCodigoEntregado);
router.put("/:id/detalles", admin, userCtrl.replacePedidoDetalles);
router.get("/repartidor/:id_repartidor/pedidos", ownCourier, userCtrl.getPedidosByRepartidor);
router.get("/repartidor/:id_repartidor/pedidos-activos", ownCourier, userCtrl.getPedidosActivosByRepartidor);
router.post("/:id/asignar-repartidor", admin, userCtrl.asignarRepartidor);
router.post("/:id/cancelar-envio", admin, userCtrl.cancelarEnvio);
router.put("/:id/estado", admin, userCtrl.updateEstadoPedido);
//Este comentario deberia arreglar el bug de sync con el repo

module.exports = router;
