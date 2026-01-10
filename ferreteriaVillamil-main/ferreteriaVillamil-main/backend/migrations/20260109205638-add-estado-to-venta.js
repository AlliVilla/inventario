'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Venta', 'estado', {
      type: Sequelize.STRING,
      defaultValue: 'Completada'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Venta', 'estado');
  }
};
