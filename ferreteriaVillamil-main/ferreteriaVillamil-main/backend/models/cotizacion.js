'use strict';
module.exports = (sequelize, DataTypes) => {
    const Cotizacion = sequelize.define('Cotizacion', {
        id_cotizacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        fecha_cotizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        total: DataTypes.DECIMAL,
        cliente_nombre: DataTypes.STRING,
        id_usuario_vendedor: DataTypes.INTEGER
    }, {
        tableName: 'Cotizacion',
        timestamps: false
    });

    Cotizacion.associate = models => {
        Cotizacion.belongsTo(models.Usuario, {
            foreignKey: 'id_usuario_vendedor'
        });

        Cotizacion.hasMany(models.Detalle_Cotizacion, {
            foreignKey: 'id_cotizacion',
            as: 'Detalles'
        });
    };

    return Cotizacion;
};
