'use strict';
module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define('Venta', {
    id_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha_venta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    total: DataTypes.DECIMAL,
    cliente_nombre: DataTypes.STRING,
    id_usuario_vendedor: DataTypes.INTEGER,
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'Completada'
    }
  }, {
    tableName: 'Venta',
    timestamps: false
  });

  Venta.associate = models => {
    Venta.belongsTo(models.Usuario, {
      foreignKey: 'id_usuario_vendedor'
    });

    Venta.hasMany(models.Detalle_Venta, {
      foreignKey: 'id_venta'
    });
  };

  return Venta;
};
