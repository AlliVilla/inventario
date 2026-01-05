'use strict';
module.exports = (sequelize, DataTypes) => {
    const Detalle_Venta = sequelize.define('Detalle_Venta', {
        id_detalle_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_venta: DataTypes.INTEGER,
        id_articulo: DataTypes.INTEGER,
        cantidad: DataTypes.INTEGER,
        precio_unitario: DataTypes.DECIMAL,
        subtotal: DataTypes.DECIMAL
    }, {
        tableName: 'Detalle_Venta',
        timestamps: false
    });

    Detalle_Venta.associate = models => {
        Detalle_Venta.belongsTo(models.Venta, {
            foreignKey: 'id_venta'
        });

        Detalle_Venta.belongsTo(models.Articulo, {
            foreignKey: 'id_articulo'
        });
    };

    return Detalle_Venta;
};
