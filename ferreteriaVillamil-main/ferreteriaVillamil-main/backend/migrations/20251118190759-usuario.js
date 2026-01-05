'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Usuario', {
      id_usuario: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: Sequelize.STRING,
      correo: {
      type: Sequelize.STRING, 
      unique: true},
      
      clave: Sequelize.STRING,
      telefono: Sequelize.STRING,
      rol: {
        type: 'rol_usuario',
      },
      estado: {
        type: 'estado_usuario',
        defaultValue: 'Activo'
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Usuario');
  }
};
