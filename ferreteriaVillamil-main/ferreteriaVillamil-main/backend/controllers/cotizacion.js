const { Cotizacion, Detalle_Cotizacion, Articulo, sequelize } = require('../models');

exports.createCotizacion = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { cliente_nombre, items, total, id_usuario_vendedor } = req.body;

        // 1. Crear la Cotizacion
        const cotizacion = await Cotizacion.create({
            cliente_nombre,
            total,
            id_usuario_vendedor
        }, { transaction });

        // 2. Procesar cada item
        for (const item of items) {
            const { id_articulo, cantidad, precio_unitario, subtotal } = item;

            // Crear Detalle
            await Detalle_Cotizacion.create({
                id_cotizacion: cotizacion.id_cotizacion,
                id_articulo,
                cantidad,
                precio_unitario,
                subtotal
            }, { transaction });
        }

        await transaction.commit();
        res.status(201).json({ message: 'Cotización guardada con éxito', cotizacion });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear cotización:', error);
        res.status(500).json({ message: 'Error al guardar la cotización', error: error.message });
    }
};

exports.getCotizaciones = async (req, res) => {
    try {
        const cotizaciones = await Cotizacion.findAll({
            include: [
                {
                    model: Detalle_Cotizacion,
                    as: 'Detalles',
                    include: [Articulo]
                }
            ],
            order: [['fecha_cotizacion', 'DESC']]
        });
        res.json(cotizaciones);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ message: 'Error al obtener las cotizaciones' });
    }
};
