const { Pedido, Usuario, Detalle_Pedido, Articulo, Calificacion, sequelize } = require("../models");

// Función para generar enlace de tracking
const generarEnlaceTracking = (pedidoId) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/cliente/tracking/${pedidoId}`;
};

const createNewPedido = async (request, response) => {
  try {
    if (!request.body || Object.keys(request.body).length === 0) {
      return response.status(400).json({
        status: "BAD REQUEST",
        message: "Asegúrese de enviar todos los campos.",
      });
    }

    const repeatPedido = await Pedido.findOne({
      where: {
        numero_pedido: request.body.numero_pedido,
      },
    });

    if (repeatPedido) {
      return response.status(409).json({
        status: "pedido Conflict",
        message: "pedido already exist, pls use other pedido",
      });
    }

    // Generar código de confirmación automáticamente
    const codigo = generarCodigo();
    
    // Agregar código de confirmación al body del pedido
    const pedidoData = {
      ...request.body,
      codigo_confirmacion: codigo,
    };

    const newPedido = await Pedido.create(pedidoData);
    
    // Generar enlace de tracking
    const trackingLink = generarEnlaceTracking(newPedido.id_pedido);
    
    // Actualizar el pedido con el enlace de tracking
    await newPedido.update({ link_seguimiento: trackingLink });

    return response.status(201).json({
      status: "success",
      data: newPedido,
    });
  } catch (error) {
    console.error("Error en createNewPedido:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllPedidos = async (request, response) => {
  try {
    const pedidos = await Pedido.findAll();

    return response.status(200).json({
      status: "success",
      data: pedidos,
    });
  } catch (error) {
    console.error("Error en getAllPedidos:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deletePedido = async (request, response) => {
  const { id } = request.params;
  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }
    await pedido.destroy();
    return response.status(200).json({
      status: "success",
      message: "Pedido deleted successfully",
    });
  } catch (error) {
    console.error("Error en deletePedido:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updatePedido = async (request, response) => {
  const { id } = request.params;
  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }
    await pedido.update(request.body);
    return response.status(200).json({
      status: "success",
      data: pedido,
    });
  } catch (error) {
    console.error("Error en updatePedido:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const asignarRepartidor = async (request, response) => {
  const { id } = request.params;
  const { id_repartidor } = request.body;
  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }
    await pedido.update({ id_repartidor_asignado: id_repartidor });
    await pedido.update({ estado: "Asignado" });
    await pedido.update({ fecha_asignacion: new Date() });
    
    return response.status(200).json({
      status: "success",
      message: "Repartidor asignado correctamente",
    });
  } catch (error) {
    console.error("Error en asignarRepartidor:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const mandarCodigoEntregado = async (request, response) => {
  const { id } = request.params;

  try {
    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }

    const codigo = generarCodigo();

    await pedido.update({
      codigo_confirmacion: codigo,
      estado: "En transcurso",
    });

    return response.status(200).json({
      status: "success",
      message: "Código generado correctamente",
      codigo: codigo,
    });
  } catch (error) {
    console.error("Error en mandarCodigoEntregado:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const validarCodigoEntregado = async (request, response) => {
  const { id, codigo } = request.params;
  try {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return response
        .status(404)
        .json({ status: "Not Found", message: "Pedido not found" });
    }
    if (pedido.codigo_confirmacion !== codigo) {
      return response.status(400).json({
        status: "Bad Request",
        message: "Código de confirmación incorrecto",
      });
    }
    await pedido.update({ estado: "Entregado" });
    return response
      .status(200)
      .json({ status: "success", message: "Pedido marcado como entregado" });
  } catch (error) {
    console.error("Error en validarCodigoEntregado:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPedidosByRepartidor = async (request, response) => {
  const { id_repartidor } = request.params;
  try {
    const pedidos = await Pedido.findAll({
      where: { id_repartidor_asignado: id_repartidor }
    });

    return response.status(200).json({
      status: "success",
      data: pedidos,
      count: pedidos.length
    });
  } catch (error) {
    console.error("Error en getPedidosByRepartidor:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPedidosActivosByRepartidor = async (request, response) => {
  const { id_repartidor } = request.params;
  try {
    const pedidos = await Pedido.findAll({
      where: { 
        id_repartidor_asignado: id_repartidor,
        estado: ['Asignado', 'En transcurso']
      }
    });

    return response.status(200).json({
      status: "success",
      data: pedidos,
      count: pedidos.length
    });
  } catch (error) {
    console.error("Error en getPedidosActivosByRepartidor:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPedidoById = async (request, response) => {
  const { id } = request.params;
  try {
    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }

    return response.status(200).json({
      status: "success",
      data: pedido,
    });
  } catch (error) {
    console.error("Error en getPedidoById:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  };
};

const cancelarPedidoConReposicionInventario = async (pedidoId, transaction) => {
  const pedido = await Pedido.findByPk(pedidoId, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  if (!pedido) {
    return { statusCode: 404, body: { status: "Not Found", message: "Pedido not found" } };
  }

  if (pedido.estado === "Cancelado") {
    return { statusCode: 200, body: { status: "success", message: "Pedido ya estaba cancelado", data: pedido } };
  }

  if (pedido.estado === "Entregado") {
    return { statusCode: 409, body: { status: "error", message: "No se puede cancelar un pedido entregado" } };
  }

  const detalles = await Detalle_Pedido.findAll({
    where: { id_pedido: pedidoId },
    transaction,
  });

  const cantidadesPorArticulo = new Map();
  for (const detalle of detalles) {
    const idArticulo = detalle.id_articulo;
    const cantidad = Number(detalle.cantidad ?? 0);
    if (!idArticulo || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    cantidadesPorArticulo.set(
      idArticulo,
      (cantidadesPorArticulo.get(idArticulo) ?? 0) + cantidad
    );
  }

  for (const [idArticulo, cantidad] of cantidadesPorArticulo.entries()) {
    const articulo = await Articulo.findByPk(idArticulo, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!articulo) {
      return {
        statusCode: 404,
        body: {
          status: "Not Found",
          message: `Artículo asociado al pedido no encontrado (id_articulo: ${idArticulo})`,
        }
      };
    }

    const existenciaActual = Number(articulo.cantidad_existencia ?? 0);
    await articulo.update(
      { cantidad_existencia: existenciaActual + cantidad },
      { transaction }
    );
  }

  await pedido.update(
    { estado: "Cancelado", fecha_cancelacion: new Date() },
    { transaction }
  );

  return { statusCode: 200, body: { status: "success", message: "Pedido cancelado correctamente", data: pedido } };
};

const cancelarEnvio = async (request, response) => {
  const { id } = request.params;
  const transaction = await sequelize.transaction();
  try {
    const result = await cancelarPedidoConReposicionInventario(id, transaction);
    if (result.statusCode !== 200) {
      await transaction.rollback();
      return response.status(result.statusCode).json(result.body);
    }

    await transaction.commit();
    return response.status(200).json(result.body);
  } catch (error) {
    await transaction.rollback();
    console.error("Error en cancelarEnvio:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateEstadoPedido = async (request, response) => {
  const { id } = request.params;
  const { estado } = request.body;
  
  try {
    if (estado === "Cancelado") {
      const transaction = await sequelize.transaction();
      try {
        const result = await cancelarPedidoConReposicionInventario(id, transaction);
        if (result.statusCode !== 200) {
          await transaction.rollback();
          return response.status(result.statusCode).json(result.body);
        }
        await transaction.commit();
        return response.status(200).json({
          status: "success",
          message: "Estado del pedido actualizado correctamente",
          data: result.body.data,
        });
      } catch (error) {
        await transaction.rollback();
        console.error("Error en updateEstadoPedido:", error);
        return response.status(500).json({
          status: "error",
          message: "Internal server error",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }

    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }

    await pedido.update({ estado });

    return response.status(200).json({
      status: "success",
      message: "Estado del pedido actualizado correctamente",
      data: pedido,
    });
  } catch (error) {
    console.error("Error en updateEstadoPedido:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getDetallesPedido = async (request, response) => {
  const { id } = request.params;
  try {
    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: Detalle_Pedido,
          include: [
            {
              model: Articulo,
              attributes: ['id_articulo', 'nombre', 'descripcion', 'precio'],
            },
          ],
        },
      ],
    });

    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }

    const pedidoData = pedido.toJSON();
    const detalles = Array.isArray(pedidoData.Detalle_Pedidos)
      ? pedidoData.Detalle_Pedidos
      : (Array.isArray(pedidoData.Detalle_Pedido) ? pedidoData.Detalle_Pedido : []);

    pedidoData.Detalle_Pedidos = detalles;

    let subtotalPedido = 0;
    for (const detalle of detalles) {
      const cantidad = Number(detalle.cantidad ?? 0);
      const precioUnitario = detalle.precio_unitario != null
        ? Number(detalle.precio_unitario)
        : Number(detalle.Articulo?.precio ?? 0);

      const subtotalDetalle = detalle.subtotal != null
        ? Number(detalle.subtotal)
        : cantidad * precioUnitario;

      detalle.precio_unitario = precioUnitario;
      detalle.subtotal = subtotalDetalle;
      subtotalPedido += subtotalDetalle;
    }

    pedidoData.subtotal = subtotalPedido;

    return response.status(200).json({
      status: "success",
      data: pedidoData,
    });
  } catch (error) {
    console.error("Error en getDetallesPedido:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPedidoClienteTracking = async (request, response) => {
  try {
    const { id } = request.params;

    const pedido = await Pedido.findOne({
      where: { numero_pedido: id },
      include: [
        {
          model: Usuario,
          foreignKey: 'id_admin_creador',
          attributes: ['nombre', 'telefono'],
        },
        {
          model: Usuario,
          foreignKey: 'id_repartidor_asignado',
          attributes: ['nombre', 'telefono'],
          required: false
        },
        {
          model: Detalle_Pedido,
          include: [
            {
              model: Articulo,
              attributes: ['id_articulo', 'nombre', 'descripcion', 'precio'],
            },
          ],
        },
        {
          model: Calificacion,
          required: false,
          attributes: ['id_calificacion', 'puntuacion', 'comentario', 'fecha_calificacion'],
        },
      ],
    });

    if (!pedido) {
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido no encontrado",
      });
    }

    return response.status(200).json({
      status: "success",
      data: pedido,
    });
  } catch (error) {
    console.error("Error en getPedidoClienteTracking:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createNewPedido,
  getAllPedidos,
  getPedidoById,
  getDetallesPedido,
  deletePedido,
  updatePedido,
  mandarCodigoEntregado,
  validarCodigoEntregado,
  getPedidosByRepartidor,
  getPedidosActivosByRepartidor,
  asignarRepartidor,
  cancelarEnvio,
  updateEstadoPedido,
  getPedidoClienteTracking
};
