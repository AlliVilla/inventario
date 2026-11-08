'use strict';
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: DataTypes.STRING,
    correo: DataTypes.STRING,
    clave: DataTypes.STRING,
    telefono: DataTypes.STRING,
    foto_perfil: DataTypes.STRING,
    rol: DataTypes.ENUM('Administrador', 'Repartidor'),
    estado: DataTypes.ENUM('Activo', 'Inactivo'),
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'Usuario',
    timestamps: false,
    defaultScope: { attributes: { exclude: ['clave'] } }
  });

  Usuario.prototype.toJSON = function () {
    const { clave, ...usuario } = this.get({ plain: true });
    return usuario;
  };

  Usuario.associate = models => {
    Usuario.hasMany(models.Pedido, {
      foreignKey: 'id_admin_creador'
    });

    Usuario.hasMany(models.Pedido, {
      foreignKey: 'id_repartidor_asignado'
    });
  };

  return Usuario;
};
