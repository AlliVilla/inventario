module.exports = (sequelize, DataTypes) => {
  const Sucursal = sequelize.define('Sucursal', {
    id_sucursal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true }
  }, { tableName: 'Sucursal', timestamps: false });

  Sucursal.associate = models => {
    Sucursal.hasMany(models.Usuario, {
      foreignKey: 'id_sucursal'
    });
  };

  return Sucursal;
};
