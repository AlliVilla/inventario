var router = require("express").Router();

const estadisticasCtrl = require("../controllers/estadisticas");

router.get("/repartidores-entregas-calificaciones", estadisticasCtrl.repartidoresConEntregasYCalificaciones);
router.get("/pedidos-por-estado", estadisticasCtrl.pedidosPorEstado);
router.get("/productos-ventas-periodo", estadisticasCtrl.productosVentasPorPeriodo);
router.get("/productos-proximos-agotarse", estadisticasCtrl.productosProximosAgotarse);
router.get("/proyeccion-ganancia-mes", estadisticasCtrl.proyeccionGananciaPorMes);

module.exports = router;

