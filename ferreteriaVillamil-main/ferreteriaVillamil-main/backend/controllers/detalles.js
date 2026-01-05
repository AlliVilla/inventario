const { Detalle_Pedido, Articulo, sequelize } = require('../models');

function checkForNull(data, res){
    if (!data || Object.keys(data).length === 0) {
        res.status(400).json({
            status: "Error",
            message: "Request body cannot be empty"
        });
        return false;
    };
        if (!data.id_pedido) {
        res.status(422).json({
            status: "Error",
            message: "Field 'id_pedido' is required"
        });
        return false;
    }
    if (!data.id_articulo) {
        res.status(422).json({
            status: "Error",
            message: "Field 'id_articulo' is required"
        });
        return false;
    }
    if (data.cantidad == null) {
        res.status(422).json({
            status: "Error",
            message: "Field 'cantidad' is required"
        });
        return false;
    }
    return true;
}

const nuevoDetalle = async (request, response) => {
    const transaction = await sequelize.transaction();
    try {
        const data = request.body;
        if (!checkForNull(data, response)) {
            await transaction.rollback();
            return;
        }

        const cantidadSolicitada = Number(data.cantidad ?? 0);
        if (!Number.isFinite(cantidadSolicitada) || cantidadSolicitada <= 0) {
            await transaction.rollback();
            return response.status(422).json({
                status: "Error",
                message: "Field 'cantidad' must be a positive number"
            });
        }

        const articulo = await Articulo.findByPk(data.id_articulo, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!articulo) {
            await transaction.rollback();
            return response.status(404).json({
                status: "Not Found",
                message: "Artículo no encontrado"
            });
        }

        const existenciaActual = Number(articulo.cantidad_existencia ?? 0);
        if (existenciaActual < cantidadSolicitada) {
            await transaction.rollback();
            return response.status(409).json({
                status: "Error",
                message: "Stock insuficiente para el artículo solicitado"
            });
        }

        await articulo.update(
            { cantidad_existencia: existenciaActual - cantidadSolicitada },
            { transaction }
        );

        const newDetalle = await Detalle_Pedido.create(data, { transaction });

        await transaction.commit();
        return response.status(201).json({
            status: "Success",
            message: "Detalles del pedido creado con éxito",
            data: newDetalle
        });
    } catch (error) {
        await transaction.rollback();
        return response.status(500).json({
                status: "Error",
                message: error.message
            });
    }
}

const getDetallesByIDPedido = async (request, response) => {
    const { id_pedido } = request.params;
    if (!id_pedido) {
        return response.status(400).json({
            status: "Error",
            message: "ID de pedido no proporcionado"
        });
    }

    try {
        const detalles = await Detalle_Pedido.findAll({
            where: { id_pedido: id_pedido }
        });

        return response.status(200).json({
            status: "Success",
            message: "Detalles del pedido obtenidos con éxito",
            data: detalles
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            status: "Error",
            message: error.message
        });
    }
}

const getDetalles = async (request, response) => {
    try {
        const detalles = await Detalle_Pedido.findAll();

        return response.status(200).json({
            status: "Success",
            message: "Detalles del pedido obtenidos con éxito",
            data: detalles
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            status: "Error",
            message: error.message
        });
    }
}

module.exports = {
    nuevoDetalle,
    getDetallesByIDPedido,
    getDetalles
};