'use strict';
const { trackingPath } = require('../utils/tokens');
module.exports = (sequelize, DataTypes) => {
  const Pedido = sequelize.define('Pedido', {
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    id_pedido: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    numero_pedido: DataTypes.STRING,
    cliente_nombre: DataTypes.STRING,
    cliente_telefono: DataTypes.STRING,
    cliente_identidad: DataTypes.STRING,
    id_repartidor_asignado: DataTypes.INTEGER,
    id_admin_creador: DataTypes.INTEGER,
    estado: DataTypes.ENUM('Pendiente', 'Asignado', 'En transcurso', 'Entregado', 'Cancelado'),
    codigo_confirmacion: DataTypes.STRING,
    costo_envio: DataTypes.DECIMAL,
    total: DataTypes.DECIMAL,
    direccion_entrega: DataTypes.STRING,
    observacion: DataTypes.STRING,
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_asignacion: DataTypes.DATE,
    fecha_entrega: DataTypes.DATE,
    fecha_cancelacion: DataTypes.DATE,
    motivo_cancelacion: DataTypes.STRING,
    link_seguimiento: {
      type: DataTypes.STRING,
      get() {
        const id = this.getDataValue('id_pedido');
        return id ? trackingPath(id) : null;
      }
    }
  }, {
    tableName: 'Pedido',
    timestamps: false
  });

  Pedido.associate = models => {
    Pedido.belongsTo(models.Usuario, {
      foreignKey: 'id_admin_creador'
    });

    Pedido.belongsTo(models.Usuario, {
      foreignKey: 'id_repartidor_asignado'
    });

    Pedido.hasMany(models.Detalle_Pedido, {
      foreignKey: 'id_pedido'
    });

    Pedido.hasOne(models.Calificacion, {
      foreignKey: 'id_pedido'
    });
  };

  return Pedido;
};
