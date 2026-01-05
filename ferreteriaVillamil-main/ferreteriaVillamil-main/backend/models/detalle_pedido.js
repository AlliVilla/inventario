'use strict';
module.exports = (sequelize, DataTypes) => {
  const Detalle_Pedido = sequelize.define('Detalle_Pedido', {
    id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_pedido: DataTypes.INTEGER,
    id_articulo: DataTypes.INTEGER,
    cantidad: DataTypes.INTEGER,
    precio_unitario: DataTypes.DECIMAL,
    subtotal: DataTypes.DECIMAL
  }, {
    tableName: 'Detalle_Pedido',
    timestamps: false
  });

  Detalle_Pedido.associate = models => {
    Detalle_Pedido.belongsTo(models.Pedido, {
      foreignKey: 'id_pedido'
    });

    Detalle_Pedido.belongsTo(models.Articulo, {
      foreignKey: 'id_articulo'
    });
  };

  return Detalle_Pedido;
};

