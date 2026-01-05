'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Detalle_Pedido', {
      id_detalle: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_pedido: Sequelize.INTEGER,
      id_articulo: Sequelize.INTEGER,
      cantidad: Sequelize.INTEGER,
      precio_unitario: Sequelize.DECIMAL,
      subtotal: Sequelize.DECIMAL
    });

    await queryInterface.addConstraint('Detalle_Pedido', {
      fields: ['id_pedido'],
      type: 'foreign key',
      name: 'fk_dp_pedido',
      references: { table: 'Pedido', field: 'id_pedido' }
    });

    await queryInterface.addConstraint('Detalle_Pedido', {
      fields: ['id_articulo'],
      type: 'foreign key',
      name: 'fk_dp_articulo',
      references: { table: 'Articulo', field: 'id_articulo' }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Detalle_Pedido');
  }
};
