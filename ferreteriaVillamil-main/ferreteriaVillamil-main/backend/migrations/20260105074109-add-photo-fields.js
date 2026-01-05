'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Articulo', 'foto_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Usuario', 'foto_perfil', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Articulo', 'foto_url');
    await queryInterface.removeColumn('Usuario', 'foto_perfil');
  }
};
