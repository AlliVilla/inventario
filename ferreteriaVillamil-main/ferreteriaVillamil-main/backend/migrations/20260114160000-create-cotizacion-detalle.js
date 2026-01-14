'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create Cotizacion table
        await queryInterface.createTable('Cotizacion', {
            id_cotizacion: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            fecha_cotizacion: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            total: {
                type: Sequelize.DECIMAL(10, 2)
            },
            cliente_nombre: {
                type: Sequelize.STRING
            },
            id_usuario_vendedor: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Usuario',
                    key: 'id_usuario'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // Create Detalle_Cotizacion table
        await queryInterface.createTable('Detalle_Cotizacion', {
            id_detalle_cotizacion: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            id_cotizacion: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Cotizacion',
                    key: 'id_cotizacion'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            id_articulo: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Articulo',
                    key: 'id_articulo'
                },
                onUpdate: 'CASCADE'
            },
            cantidad: {
                type: Sequelize.INTEGER
            },
            precio_unitario: {
                type: Sequelize.DECIMAL(10, 2)
            },
            subtotal: {
                type: Sequelize.DECIMAL(10, 2)
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Detalle_Cotizacion');
        await queryInterface.dropTable('Cotizacion');
    }
};
