const { sequelize } = require("../models");
const { Sequelize } = require("sequelize");

//Repartidores con entregas y calificaciones
const repartidoresConEntregasYCalificaciones = async (request, response) => {
  try {
    const resultado = await sequelize.query(
      `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.correo,
        u.telefono,
        COUNT(DISTINCT CASE WHEN p.estado = 'Entregado' THEN p.id_pedido END) as numero_entregas,
        COUNT(DISTINCT c.id_calificacion) as total_calificaciones,
        COALESCE(AVG(c.puntuacion), NULL) as promedio_calificacion
      FROM "Usuario" u
      LEFT JOIN "Pedido" p ON p.id_repartidor_asignado = u.id_usuario
      LEFT JOIN "Calificacion" c ON c.id_pedido = p.id_pedido AND p.estado = 'Entregado'
      WHERE u.rol = 'Repartidor'
      GROUP BY u.id_usuario, u.nombre, u.correo, u.telefono
      ORDER BY u.nombre
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    // Formatear los resultados
    const data = resultado.map(row => ({
      id_usuario: row.id_usuario,
      nombre: row.nombre,
      correo: row.correo,
      telefono: row.telefono,
      numero_entregas: parseInt(row.numero_entregas) || 0,
      promedio_calificacion: row.promedio_calificacion ? parseFloat(parseFloat(row.promedio_calificacion).toFixed(2)) 
        : null,
      total_calificaciones: parseInt(row.total_calificaciones) || 0
    }));

    return response.status(200).json({
      status: "success",
      data: data
    });
  } catch (error) {
    console.error("Error al obtener los repartidores con entregas y calificaciones", error);
    return response.status(500).json({
      status: "error",
      message: "Error al obtener los repartidores con entregas y calificaciones"
    });
  }
};

// Pedidos según su estado 
const pedidosPorEstado = async (request, response) => {
  try {
    const resultado = await sequelize.query(
      `
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM "Pedido"
      GROUP BY estado
      ORDER BY estado
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    const data = resultado.map(row => ({
      estado: row.estado,
      cantidad: parseInt(row.cantidad) || 0
    }));

    return response.status(200).json({
      status: "success",
      data: data
    });
  } catch (error) {
    console.error("Error al obtener los pedidos por estado", error);
    return response.status(500).json({
      status: "error",
      message: "Error al obtener los pedidos por estado"
    });
  }
};

//Productos y cantidad de ventas por un periodo de tiempo especificado
const productosVentasPorPeriodo = async (request, response) => {
  try {
    let { fecha_inicio, fecha_fin } = request.query;

    // Si no se proporcionan fechas, usar el último mes por defecto
    if (!fecha_inicio || !fecha_fin) {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      fecha_inicio = fecha_inicio || primerDiaMes.toISOString().split('T')[0];
      fecha_fin = fecha_fin || ultimoDiaMes.toISOString().split('T')[0];
    }

  
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha_inicio) || !fechaRegex.test(fecha_fin)) {
      return response.status(400).json({
        status: "error",
        message: "El formato de fecha debe ser YYYY-MM-DD (ejemplo: 2024-01-15)"
      });
    }

    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return response.status(400).json({
        status: "error",
        message: "Las fechas proporcionadas no son válidas"
      });
    }

    if (fechaInicio > fechaFin) {
      return response.status(400).json({
        status: "error",
        message: "La fecha de inicio debe ser anterior o igual a la fecha de fin"
      });
    }

    fechaFin.setHours(23, 59, 59, 999);
    const fechaInicioISO = fechaInicio.toISOString();
    const fechaFinISO = fechaFin.toISOString();

    const resultado = await sequelize.query(
      `
      SELECT 
        a.id_articulo,
        a.codigo,
        a.nombre,
        a.precio as precio_unitario,
        COALESCE(SUM(dp.cantidad), 0) as cantidad_vendida,
        COALESCE(SUM(dp.subtotal), 0) as total_ventas
      FROM "Articulo" a
      INNER JOIN "Detalle_Pedido" dp ON dp.id_articulo = a.id_articulo
      INNER JOIN "Pedido" p ON p.id_pedido = dp.id_pedido
      WHERE p.estado = 'Entregado'
        AND p.fecha_entrega BETWEEN :fechaInicio AND :fechaFin
      GROUP BY a.id_articulo, a.codigo, a.nombre, a.precio
      ORDER BY cantidad_vendida DESC
    `, {
      replacements: { fechaInicio: fechaInicioISO, fechaFin: fechaFinISO },
      type: Sequelize.QueryTypes.SELECT
    });

    const data = resultado.map(row => ({
      id_articulo: row.id_articulo,
      codigo: row.codigo,
      nombre: row.nombre,
      precio_unitario: parseFloat(row.precio_unitario) || 0,
      cantidad_vendida: parseInt(row.cantidad_vendida) || 0,
      total_ventas: parseFloat(row.total_ventas) || 0
    }));

    return response.status(200).json({
      status: "success",
      data: data,
      periodo: {
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin
      }
    });
  } catch (error) {
    console.error("error al obtener los productos y cantidad de ventas por un periodo de tiempo especificado", error);
    return response.status(500).json({
      status: "error",
      message: "Error al obtener los productos y cantidad de ventas por un periodo de tiempo especificado"
    });
  }
};

//Productos próximos a agotarse
const productosProximosAgotarse = async (request, response) => {
  try {
    const resultado = await sequelize.query(
      `
      SELECT 
        id_articulo,
        codigo,
        nombre,
        cantidad_existencia,
        stock_minimo,
        (cantidad_existencia - stock_minimo) as diferencia,
        precio,
        estado
      FROM "Articulo"
      WHERE cantidad_existencia <= stock_minimo
      ORDER BY cantidad_existencia ASC
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    const data = resultado.map(row => ({
      id_articulo: row.id_articulo,
      codigo: row.codigo,
      nombre: row.nombre,
      cantidad_existencia: row.cantidad_existencia,
      stock_minimo: row.stock_minimo,
      diferencia: parseInt(row.diferencia) || 0,
      precio: parseFloat(row.precio) || 0,
      estado: row.estado
    }));

    return response.status(200).json({
      status: "success",
      data: data
    });
  } catch (error) {
    console.error("error al obtener los productos próximos a agotarse", error);
    return response.status(500).json({
      status: "error",
      message: "Error al obtener los productos próximos a agotarse",
    });
  }
};

//Proyección de ganancia de pedidos completados por mes 
const proyeccionGananciaPorMes = async (request, response) => {
  try {
    const resultado = await sequelize.query(
      `
      SELECT 
        DATE_TRUNC('month', fecha_entrega) as fecha_mes,
        COALESCE(SUM(total), 0) as total_ganancia,
        COUNT(*) as cantidad_pedidos
      FROM "Pedido"
      WHERE estado = 'Entregado'
        AND fecha_entrega IS NOT NULL
      GROUP BY DATE_TRUNC('month', fecha_entrega)
      ORDER BY fecha_mes ASC
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    const data = resultado.map(row => {
      const fecha = new Date(row.fecha_mes);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesNombre = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      
      return {
        mes: mes,
        mes_nombre: mesNombre,
        total_ganancia: parseFloat(row.total_ganancia) || 0,
        cantidad_pedidos: parseInt(row.cantidad_pedidos) || 0
      };
    });

    return response.status(200).json({
      status: "success",
      data: data
    });
  } catch (error) {
    console.error("error al obtener la proyección de ganancia de pedidos completados por mes", error);
    return response.status(500).json({
      status: "error",
      message: "Error al obtener la proyección de ganancia de pedidos completados por mes",
    });
  }
};

module.exports = {
  repartidoresConEntregasYCalificaciones,
  pedidosPorEstado,
  productosVentasPorPeriodo,
  productosProximosAgotarse,
  proyeccionGananciaPorMes
};