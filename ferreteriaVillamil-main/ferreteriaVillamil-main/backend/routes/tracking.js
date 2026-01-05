var router = require("express").Router();
const pedidoCtrl = require("../controllers/pedido");
const calificacionCtrl = require("../controllers/calificacion");

// Endpoint público para tracking de pedidos (sin autenticación)
router.get("/:id", pedidoCtrl.getPedidoClienteTracking);
// Endpoint público para crear calificación desde el tracking (sin autenticación)
router.post("/calificar", calificacionCtrl.createNewCalificacion);

module.exports = router;

