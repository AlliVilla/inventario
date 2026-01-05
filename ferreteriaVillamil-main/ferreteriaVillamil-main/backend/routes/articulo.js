var router = require("express").Router();

const articuloCtrl = require("../controllers/articulo");
const { uploadImage } = require("../middleware/upload");

router.post('/new', uploadImage('foto_url'), articuloCtrl.nuevoArticulo);
router.put('/edit/:codigo', uploadImage('foto_url'), articuloCtrl.editArticulo);
router.get('/low-stock', articuloCtrl.lowStockItems);
router.get('/list', articuloCtrl.getAllItems);
router.get('/code/:codigo', articuloCtrl.getItemByID);
router.delete('/delete/:codigo', articuloCtrl.deleteItem);
router.get('/list/active', articuloCtrl.getAllActiveItems);


module.exports = router;