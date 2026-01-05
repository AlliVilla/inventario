'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE rol_usuario AS ENUM ('Administrador', 'Repartidor');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE estado_usuario AS ENUM ('Activo', 'Inactivo');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE estado_articulo AS ENUM ('Disponible', 'No Disponible');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE estado_pedido AS ENUM ('Pendiente', 'Asignado', 'En transcurso', 'Entregado', 'Cancelado');
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TYPE estado_pedido;`);
    await queryInterface.sequelize.query(`DROP TYPE estado_articulo;`);
    await queryInterface.sequelize.query(`DROP TYPE estado_usuario;`);
    await queryInterface.sequelize.query(`DROP TYPE rol_usuario;`);
  }
};
