const { stock } = require('../utils/inventory');
const { Pedido, Usuario, Detalle_Pedido, Articulo, Calificacion, sequelize } = require("../models");

const { randomInt } = require('node:crypto');
const { verify } = require('../utils/tokens');


// Función auxiliar para descontar inventario
const deductStockForOrder = async (pedidoId, transaction) => {
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
    const articulo = await stock(idArticulo, transaction);

    if (!articulo) {
      throw new Error(`Artículo asociado al pedido no encontrado (id_articulo: ${idArticulo})`);
    }

    const existenciaActual = Number(articulo.cantidad_existencia ?? 0);
    if (existenciaActual < cantidad) {
      throw new Error(`Stock insuficiente para el artículo ${idArticulo} al confirmar entrega.`);
    }

    await articulo.update(
      { cantidad_existencia: existenciaActual - cantidad },
      { transaction }
    );
  }
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
      id_admin_creador: request.usuario.id_usuario,
      id_repartidor_asignado: null,
      estado: "Pendiente",
      codigo_confirmacion: codigo,
    };

    const newPedido = await Pedido.create(pedidoData);

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
    console.log('=== INICIANDO getAllPedidos ===');

    const pedidos = await Pedido.findAll({
      include: [
        {
          model: Detalle_Pedido,
          include: [{
            model: Articulo,
            attributes: ['id_articulo', 'nombre', 'descripcion', 'precio', 'costo_unitario']
          }]
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    console.log('Pedidos cargados:', pedidos.length);

    if (pedidos.length > 0) {
      const firstPedido = pedidos[0].toJSON();
      console.log('Primer pedido (keys):', Object.keys(firstPedido));
      console.log('Tiene Detalle_Pedidos?', !!firstPedido.Detalle_Pedidos);
      console.log('Tiene Detalle_Pedido?', !!firstPedido.Detalle_Pedido);

      // Log all possible keys that start with "Detalle"
      Object.keys(firstPedido).forEach(key => {
        if (key.toLowerCase().includes('detalle')) {
          console.log(`Encontrada clave: ${key}`, firstPedido[key]);
        }
      });
    }

    return response.status(200).json({
      status: "success",
      data: pedidos,
    });
  } catch (error) {
    console.error("❌ Error en getAllPedidos:", error);
    console.error("Stack:", error.stack);
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
    await pedido.update(request.body, {
      fields: ['numero_pedido', 'cliente_nombre', 'cliente_telefono', 'cliente_identidad',
        'direccion_entrega', 'observacion', 'costo_envio', 'total']
    });
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

const replacePedidoDetalles = async (request, response) => {
  const { id } = request.params;
  const transaction = await sequelize.transaction();
  try {
    const pedido = await Pedido.findByPk(id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      return response.status(404).json({
        status: "Not Found",
        message: "Pedido not found",
      });
    }

    if (pedido.estado === "Entregado" || pedido.estado === "Cancelado") {
      await transaction.rollback();
      return response.status(409).json({
        status: "Error",
        message: "No se pueden editar detalles de un pedido Entregado o Cancelado"
      });
    }

    const detallesNuevos = request.body;
    if (!Array.isArray(detallesNuevos) || detallesNuevos.length === 0) {
      await transaction.rollback();
      return response.status(400).json({
        status: "Bad Request",
        message: "Se requiere un array de detalles"
      });
    }

    // 1. Eliminar detalles anteriores
    await Detalle_Pedido.destroy({
      where: { id_pedido: id },
      transaction
    });

    // 2. Insertar nuevos detalles
    let nuevoTotal = 0;
    const detallesToInsert = detallesNuevos.map(d => {
      const sub = Number(d.subtotal) || 0;
      nuevoTotal += sub;
      return {
        ...d,
        id_pedido: id
      };
    });

    await Detalle_Pedido.bulkCreate(detallesToInsert, { transaction });

    // 3. Update total del pedido
    const costoEnvio = Number(pedido.costo_envio) || 0;

    await pedido.update({ total: nuevoTotal + costoEnvio }, { transaction });

    await transaction.commit();

    return response.status(200).json({
      status: "success",
      message: "Detalles del pedido actualizados correctamente"
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error en replacePedidoDetalles:", error);
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
    const repartidor = await Usuario.findOne({
      where: { id_usuario: id_repartidor, rol: 'Repartidor', estado: 'Activo' }
    });
    if (!repartidor) return response.status(404).json({ message: 'Repartidor no disponible en esta sucursal' });
    await pedido.update({
      id_repartidor_asignado: repartidor.id_usuario,
      estado: 'Asignado',
      fecha_asignacion: new Date()
    });

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
  return randomInt(100000, 1000000).toString();
};

const mandarCodigoEntregado = async (request, response) => {
  const { id } = request.params;

  try {
    const where = { id_pedido: id, estado: 'Asignado' };
    if (request.usuario.rol === 'Repartidor') {
      where.id_repartidor_asignado = request.usuario.id_usuario;
    }
    const codigo = generarCodigo();
    const [updated] = await Pedido.update({
      codigo_confirmacion: codigo,
      estado: 'En transcurso'
    }, { where });
    if (!updated) {
      return response.status(409).json({ message: 'El pedido no está disponible para iniciar la entrega' });
    }

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
  const transaction = await sequelize.transaction();
  try {
    const pedido = await Pedido.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (pedido && request.usuario.rol === 'Repartidor' &&
        pedido.id_repartidor_asignado !== request.usuario.id_usuario) {
      await transaction.rollback();
      return response.sendStatus(404);
    }
    if (!pedido) {
      await transaction.rollback();
      return response
        .status(404)
        .json({ status: "Not Found", message: "Pedido not found" });
    }
    if (pedido.estado !== 'En transcurso' || pedido.codigo_confirmacion !== codigo) {
      await transaction.rollback();
      return response.status(400).json({
        status: "Bad Request",
        message: "Código de confirmación incorrecto",
      });
    }

    // Descontar inventario al entregar
    try {
      await deductStockForOrder(id, transaction);
    } catch (err) {
      await transaction.rollback();
      return response.status(409).json({
        status: "Error",
        message: err.message
      });
    }

    await pedido.update({ estado: "Entregado", fecha_entrega: new Date(), codigo_confirmacion: null }, { transaction });

    await transaction.commit();
    return response
      .status(200)
      .json({ status: "success", message: "Pedido marcado como entregado e inventario actualizado" });
  } catch (error) {
    await transaction.rollback();
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
    // Solo si estaba entregado devolvemos el stock (porque solo ahí se descontó)
    const detalles = await Detalle_Pedido.findAll({
      where: { id_pedido: pedidoId },
      transaction
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
      const articulo = await stock(idArticulo, transaction);

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

    // Si pasamos a entregado manual, descontar stock
    if (estado === "Entregado" && pedido.estado !== "Entregado") {
      const transaction = await sequelize.transaction();
      try {
        await deductStockForOrder(id, transaction);
        await pedido.update({ estado, fecha_entrega: new Date() }, { transaction });
        await transaction.commit();
        return response.status(200).json({
          status: "success",
          message: "Estado del pedido actualizado e inventario descontado",
          data: pedido,
        });
      } catch (err) {
        await transaction.rollback();
        return response.status(409).json({
          status: "Error",
          message: err.message
        });
      }
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
    let id;
    try {
      ({ id } = verify(request.params.id, 'tracking'));
    } catch {
      return response.sendStatus(404);
    }

    const pedido = await Pedido.findOne({
      where: { id_pedido: id },
      attributes: ['id_pedido', 'numero_pedido', 'estado', 'total', 'costo_envio',
        'fecha_creacion', 'fecha_asignacion', 'fecha_entrega', 'motivo_cancelacion',
        'direccion_entrega', 'codigo_confirmacion'],
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

    const data = pedido.toJSON();
    if (data.estado !== 'En transcurso') delete data.codigo_confirmacion;
    return response.status(200).json({ status: 'success', data });
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
  getPedidoClienteTracking,
  replacePedidoDetalles
};
