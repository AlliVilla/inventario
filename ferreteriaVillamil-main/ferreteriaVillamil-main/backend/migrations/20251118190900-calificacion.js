'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Calificacion', {
      id_calificacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_pedido: { type: Sequelize.INTEGER, unique: true },
      puntuacion: Sequelize.INTEGER,
      comentario: Sequelize.STRING,
      fecha_calificacion: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
    });

    await queryInterface.addConstraint('Calificacion', {
      fields: ['id_pedido'],
      type: 'foreign key',
      name: 'fk_calif_pedido',
      references: { table: 'Pedido', field: 'id_pedido' }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Calificacion');
  }
};
