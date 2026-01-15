const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacion');

router.post('/', cotizacionController.createCotizacion);
router.get('/', cotizacionController.getCotizaciones);
router.delete('/:id', cotizacionController.deleteCotizacion);

module.exports = router;
