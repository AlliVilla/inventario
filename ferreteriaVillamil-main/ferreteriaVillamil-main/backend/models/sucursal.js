module.exports = (sequelize, DataTypes) => sequelize.define('Sucursal', {
  id_sucursal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true }
}, { tableName: 'Sucursal', timestamps: false });
