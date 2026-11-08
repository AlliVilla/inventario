'use strict';
module.exports = (sequelize, DataTypes) => {
  const Articulo = sequelize.define('Articulo', {
    id_articulo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: DataTypes.STRING,
    nombre: DataTypes.STRING,
    descripcion: DataTypes.STRING,
    costo_unitario: DataTypes.DECIMAL,
    precio: DataTypes.DECIMAL,
    proveedor: DataTypes.STRING,
    foto_url: { type: DataTypes.STRING, allowNull: true },
    estado: { type: DataTypes.STRING(32), allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_actualizacion: DataTypes.DATE
  }, {
    tableName: 'Articulo',
    timestamps: false
  });

  Articulo.associate = models => {
    Articulo.hasMany(models.Detalle_Pedido, {
      foreignKey: 'id_articulo'
    });
  };

  return Articulo;
};
