const { Sucursal, Usuario, Existencia, sequelize } = require('../models');

const getSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({
      order: [['id_sucursal', 'ASC']]
    });

    // Contar usuarios por sucursal sin filtro de branch context
    const counts = await Usuario.unscoped().findAll({
      attributes: ['id_sucursal', [sequelize.fn('COUNT', sequelize.col('id_usuario')), 'totalUsuarios']],
      group: ['id_sucursal'],
      raw: true
    });

    const countsMap = {};
    counts.forEach(c => {
      countsMap[c.id_sucursal] = parseInt(c.totalUsuarios, 10);
    });

    const data = sucursales.map(s => ({
      id_sucursal: s.id_sucursal,
      nombre: s.nombre,
      totalUsuarios: countsMap[s.id_sucursal] || 0,
      esActual: req.usuario?.id_sucursal === s.id_sucursal
    }));

    return res.status(200).json({ status: 'Success', data });
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    return res.status(500).json({ status: 'Error', message: 'Error interno obteniendo sucursales' });
  }
};

const createSucursal = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ status: 'Error', message: 'El nombre de la sucursal es obligatorio' });
    }

    const trimmed = nombre.trim();
    const existing = await Sucursal.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('nombre')),
        trimmed.toLowerCase()
      )
    });

    if (existing) {
      return res.status(409).json({ status: 'Error', message: 'Ya existe una sucursal con ese nombre' });
    }

    const sucursal = await Sucursal.create({ nombre: trimmed });

    return res.status(201).json({
      status: 'Success',
      message: 'Sucursal creada exitosamente',
      data: sucursal
    });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    return res.status(500).json({ status: 'Error', message: 'Error interno al crear sucursal' });
  }
};

module.exports = {
  getSucursales,
  createSucursal
};
