const { Venta, Detalle_Venta, Articulo, sequelize } = require('../models');

exports.createVenta = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { cliente_nombre, items, total, id_usuario_vendedor } = req.body;

        // 1. Crear la Venta
        const venta = await Venta.create({
            cliente_nombre,
            total,
            id_usuario_vendedor
        }, { transaction });

        // 2. Procesar cada item
        for (const item of items) {
            const { id_articulo, cantidad, precio_unitario, subtotal } = item;

            // Verificar stock
            const articulo = await Articulo.findByPk(id_articulo, { transaction });
            if (!articulo) {
                throw new Error(`Articulo con ID ${id_articulo} no encontrado.`);
            }

            if (articulo.cantidad_existencia < cantidad) {
                throw new Error(`Stock insuficiente para el artículo: ${articulo.nombre}`);
            }

            // Crear Detalle
            await Detalle_Venta.create({
                id_venta: venta.id_venta,
                id_articulo,
                cantidad,
                precio_unitario,
                subtotal
            }, { transaction });

            // Actualizar stock
            await articulo.decrement('cantidad_existencia', { by: cantidad, transaction });
        }

        await transaction.commit();
        res.status(201).json({ message: 'Venta registrada con éxito', venta });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear venta:', error);
        res.status(500).json({ message: 'Error al registrar la venta', error: error.message });
    }
};

exports.getVentas = async (req, res) => {
    try {
        const ventas = await Venta.findAll({
            include: [
                {
                    model: Detalle_Venta,
                    include: [Articulo]
                }
            ],
            order: [['fecha_venta', 'DESC']]
        });
        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ message: 'Error al obtener las ventas' });
    }
};
