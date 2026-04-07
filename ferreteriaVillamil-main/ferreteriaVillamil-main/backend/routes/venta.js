var router = require("express").Router();
const ventaCtrl = require("../controllers/venta");

router.post('/new', ventaCtrl.createVenta);
router.get('/list', ventaCtrl.getVentas);
router.put('/cancel/:id', ventaCtrl.cancelVenta);
router.put('/removeItem/:id_venta/:id_detalle', ventaCtrl.removeItem);

module.exports = router;
