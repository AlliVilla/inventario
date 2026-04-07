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

exports.cancelVenta = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        console.log("Intentando cancelar venta ID:", id);

        const venta = await Venta.findByPk(id, {
            include: [{ model: Detalle_Venta }],
            transaction
        });

        if (!venta) {
            console.log("Venta ID", id, "no encontrada");
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        if (venta.estado === 'Cancelada') {
            return res.status(400).json({ message: 'La venta ya ha sido cancelada' });
        }

        // Devolver stock
        const detalles = venta.Detalle_Venta || venta.Detalle_Ventas || [];
        console.log("Detalles encontrados para la venta:", detalles.length);

        for (const detalle of detalles) {
            const articulo = await Articulo.findByPk(detalle.id_articulo, { transaction });
            if (articulo) {
                console.log("Reponiendo stock para artículo:", articulo.nombre, "Cantidad:", detalle.cantidad);
                await articulo.increment('cantidad_existencia', { by: detalle.cantidad, transaction });
            }
        }

        // Marcar venta como cancelada
        venta.estado = 'Cancelada';
        await venta.save({ transaction });

        await transaction.commit();
        console.log("Venta ID", id, "cancelada con éxito");
        res.json({ message: 'Venta cancelada con éxito y stock repuesto', venta });
    } catch (error) {
        await transaction.rollback();
        console.error('Error detallado al cancelar venta:', error);
        res.status(500).json({ message: 'Error al cancelar la venta: ' + error.message, error: error.message });
    }
};

exports.removeItem = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id_venta, id_detalle } = req.params;

        const venta = await Venta.findByPk(id_venta, { transaction });
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });

        if (venta.estado === 'Cancelada') {
            return res.status(400).json({ message: 'No se puede devolver productos de una venta ya cancelada en su totalidad' });
        }

        const detalle = await Detalle_Venta.findOne({
            where: { id_detalle_venta: id_detalle, id_venta: id_venta },
            transaction
        });

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de venta no encontrado' });
        }

        // Devolver stock
        const articulo = await Articulo.findByPk(detalle.id_articulo, { transaction });
        if (articulo) {
            await articulo.increment('cantidad_existencia', { by: detalle.cantidad, transaction });
        }

        // Actualizar total venta
        venta.total = parseFloat(venta.total) - parseFloat(detalle.subtotal);
        if (venta.total <= 0) {
            venta.total = 0;
            venta.estado = 'Cancelada'; // Si el total llega a 0, queda como cancelada
        }
        await venta.save({ transaction });

        // Borrar el detalle
        await detalle.destroy({ transaction });

        await transaction.commit();
        res.json({ message: 'Producto devuelto al inventario con éxito', venta });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al remover item de venta:', error);
        res.status(500).json({ message: 'Error al devolver el producto: ' + error.message, error: error.message });
    }
};
