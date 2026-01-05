'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create Venta table
        await queryInterface.createTable('Venta', {
            id_venta: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            fecha_venta: {
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

        // Create Detalle_Venta table
        await queryInterface.createTable('Detalle_Venta', {
            id_detalle_venta: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            id_venta: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Venta',
                    key: 'id_venta'
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
        await queryInterface.dropTable('Detalle_Venta');
        await queryInterface.dropTable('Venta');
    }
};
