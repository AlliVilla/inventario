'use strict';
module.exports = (sequelize, DataTypes) => {
  const Calificacion = sequelize.define('Calificacion', {
    id_calificacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_pedido: { type: DataTypes.INTEGER, unique: true },
    puntuacion: DataTypes.INTEGER,
    comentario: DataTypes.STRING,
    fecha_calificacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'Calificacion',
    timestamps: false
  });

  Calificacion.associate = models => {
    Calificacion.belongsTo(models.Pedido, {
      foreignKey: 'id_pedido'
    });
  };

  return Calificacion;
};
