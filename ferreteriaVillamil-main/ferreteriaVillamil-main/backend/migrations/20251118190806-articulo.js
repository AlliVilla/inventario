'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Articulo', {
      id_articulo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      codigo: Sequelize.STRING,
      nombre: Sequelize.STRING,
      descripcion: Sequelize.STRING,
      costo_unitario: Sequelize.DECIMAL,
      precio: Sequelize.DECIMAL,
      cantidad_existencia: Sequelize.INTEGER,
      stock_minimo: Sequelize.INTEGER,
      proveedor: Sequelize.STRING,
      estado: { type: 'estado_articulo' },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      fecha_actualizacion: Sequelize.DATE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Articulo');
  }
};
