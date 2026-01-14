'use strict';
module.exports = (sequelize, DataTypes) => {
    const Detalle_Cotizacion = sequelize.define('Detalle_Cotizacion', {
        id_detalle_cotizacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_cotizacion: DataTypes.INTEGER,
        id_articulo: DataTypes.INTEGER,
        cantidad: DataTypes.INTEGER,
        precio_unitario: DataTypes.DECIMAL,
        subtotal: DataTypes.DECIMAL
    }, {
        tableName: 'Detalle_Cotizacion',
        timestamps: false
    });

    Detalle_Cotizacion.associate = models => {
        Detalle_Cotizacion.belongsTo(models.Cotizacion, {
            foreignKey: 'id_cotizacion'
        });

        Detalle_Cotizacion.belongsTo(models.Articulo, {
            foreignKey: 'id_articulo'
        });
    };

    return Detalle_Cotizacion;
};
