var router = require("express").Router();

const usuarioCtrl = require("../controllers/usuario");
const { uploadImage } = require("../middleware/upload");

router.post("/usuarios", uploadImage('foto_perfil'), usuarioCtrl.createUsuario);
router.put("/usuarios/:id", uploadImage('foto_perfil'), usuarioCtrl.updateUsuario);
router.get("/usuarios", usuarioCtrl.getUsuario);
router.get("/usuarios/:id", usuarioCtrl.getUsuarioById);
router.get("/repartidores", usuarioCtrl.getRepartidoresConPedidosActivos);
router.get("/repartidores/:id/pedidos", usuarioCtrl.getRepartidorConPedidos);

module.exports = router;
