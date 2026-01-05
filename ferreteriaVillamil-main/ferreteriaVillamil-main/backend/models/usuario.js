'use strict';
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
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
    timestamps: false
  });

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
