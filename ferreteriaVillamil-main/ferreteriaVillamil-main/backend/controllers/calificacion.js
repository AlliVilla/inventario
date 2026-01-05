const { Calificacion } = require("../models");
const { getAllItems } = require("./articulo");

const getAllCalificaciones = async (request, response) => {
  try {
    const calificaciones = await Calificacion.findAll({
      attributes: [
        "id_calificacion",
        "id_pedido",
        "puntuacion",
        "comentario",
        "fecha_calificacion",
      ],
    });
    return response.status(200).json({
      status: "success",
      data: calificaciones,
    });
  } catch (error) {
    console.error("Error en getAllCalificaciones:", error);
    return response.status(500).json({
      status: "error",
      message: "Error al obtener las calificaciones",
    });
  }
};

const createNewCalificacion = async (request, response) => {
  const { id_pedido, puntuacion, comentario } = request.body;
  
  try {
    // Validar que se envíen los campos requeridos
    if (!id_pedido || !puntuacion) {
      return response.status(400).json({
        status: "error",
        message: "id_pedido y puntuacion son requeridos",
      });
    }

    // Validar que la puntuación esté entre 1 y 5
    if (puntuacion < 1 || puntuacion > 5) {
      return response.status(400).json({
        status: "error",
        message: "La puntuación debe estar entre 1 y 5",
      });
    }

    // Verificar si ya existe una calificación para este pedido
    const calificacionExistente = await Calificacion.findOne({
      where: { id_pedido }
    });

    if (calificacionExistente) {
      return response.status(409).json({
        status: "error",
        message: "Este pedido ya ha sido calificado",
      });
    }

    // Verificar que el pedido existe y está entregado
    const { Pedido } = require("../models");
    const pedido = await Pedido.findByPk(id_pedido);
    
    if (!pedido) {
      return response.status(404).json({
        status: "error",
        message: "Pedido no encontrado",
      });
    }

    if (pedido.estado !== 'Entregado') {
      return response.status(400).json({
        status: "error",
        message: "Solo se pueden calificar pedidos entregados",
      });
    }

    const newCalificacion = await Calificacion.create({
      id_pedido,
      puntuacion,
      comentario: comentario || null,
    });
    
    return response.status(201).json({
      status: "success",
      message: "Calificación creada exitosamente",
      data: newCalificacion,
    });
  } catch (error) {
    console.error("Error en createNewCalificacion:", error);
    
    // Manejar error de unique constraint
    if (error.name === 'SequelizeUniqueConstraintError') {
      return response.status(409).json({
        status: "error",
        message: "Este pedido ya ha sido calificado",
      });
    }
    
    return response.status(500).json({
      status: "error",
      message: "Error al crear la calificación",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteCalificacion = async (request, response) => {
  const { id } = request.params;
  try {
    const calificacion = await Calificacion.findByPk(id);
    if (!calificacion) {
      return response.status(404).json({
        status: "Not Found",
        message: "Calificación not found",
      });
    }
    await calificacion.destroy();
    return response.status(200).json({
      status: "success",
      message: "Calificación deleted successfully",
    });
  } catch (error) {
    console.error("Error en deleteCalificacion:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateCalificacion = async (request, response) => {
  const { id } = request.params;
  const { puntuacion, comentario } = request.body;
  try {
    const calificacion = await Calificacion.findByPk(id);
    if (!calificacion) {
      return response.status(404).json({
        status: "Not Found",
        message: "Calificación not found",
      });
    }
    await calificacion.update({ puntuacion, comentario });
    return response.status(200).json({
      status: "success",
      data: calificacion,
    });
  } catch (error) {
    console.error("Error en updateCalificacion:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllCalificaciones,
  createNewCalificacion,
  deleteCalificacion,
  updateCalificacion,
};
