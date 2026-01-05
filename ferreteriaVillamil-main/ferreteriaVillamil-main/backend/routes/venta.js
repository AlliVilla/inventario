var router = require("express").Router();
const ventaCtrl = require("../controllers/venta");

router.post('/new', ventaCtrl.createVenta);
router.get('/list', ventaCtrl.getVentas);

module.exports = router;
