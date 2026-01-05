var router = require("express").Router();
const calificacionCtrl = require("../controllers/calificacion");
const { route } = require("./articulo");

router.get("/list", calificacionCtrl.getAllCalificaciones);
router.post("/create", calificacionCtrl.createNewCalificacion);
router.delete("/delete/:id", calificacionCtrl.deleteCalificacion);
router.put("/update/:id", calificacionCtrl.updateCalificacion);

module.exports = router;
