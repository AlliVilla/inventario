module.exports = (sequelize, DataTypes) => sequelize.define('Existencia', {
  id_sucursal: { type: DataTypes.INTEGER, primaryKey: true },
  id_articulo: { type: DataTypes.INTEGER, primaryKey: true },
  cantidad_existencia: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
}, { tableName: 'Existencia', timestamps: false });
