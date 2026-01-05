var router = require("express").Router();

const detallesCtrl = require("../controllers/detalles");

router.post("/new", detallesCtrl.nuevoDetalle);
router.get("/list/:id_pedido", detallesCtrl.getDetallesByIDPedido);
router.get("/list", detallesCtrl.getDetalles);

module.exports = router;