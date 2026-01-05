'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // No insertar artículos por ahora - todos están comentados
    // Si necesitas artículos, descomenta los que quieras usar
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Articulo', null, {});
  }
};
