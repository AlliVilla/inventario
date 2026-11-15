const router = require("express").Router();
const sucursalCtrl = require("../controllers/sucursal");

router.get("/", sucursalCtrl.getSucursales);
router.post("/", sucursalCtrl.createSucursal);

module.exports = router;
