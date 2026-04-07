'use strict';
module.exports = (sequelize, DataTypes) => {
  const Articulo = sequelize.define('Articulo', {
    id_articulo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: DataTypes.STRING,
    nombre: DataTypes.STRING,
    descripcion: DataTypes.STRING,
    costo_unitario: DataTypes.DECIMAL,
    precio: DataTypes.DECIMAL,
    cantidad_existencia: DataTypes.DECIMAL(10, 2),
    stock_minimo: DataTypes.DECIMAL(10, 2),
    proveedor: DataTypes.STRING,
    foto_url: { type: DataTypes.STRING, allowNull: true },
    estado: DataTypes.ENUM('Disponible', 'No Disponible'),
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
