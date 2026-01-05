'use strict';
const crypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords
    const hashedPassword = await crypt.hash('123456', 10);
    const hashedRepartidorPassword = await crypt.hash('abcdef', 10);

    await queryInterface.bulkInsert('Usuario', [
      // Administrador
      {
        nombre: 'Admin Uno',
        correo: 'admin1@mail.com',
        clave: hashedPassword,
        telefono: '99990001',
        rol: 'Administrador',
        estado: 'Activo',
        fecha_creacion: new Date()
      },
      // Repartidor
      {
        nombre: 'Carlos Méndez',
        correo: 'carlos.mendez@mail.com',
        clave: hashedRepartidorPassword,
        telefono: '99990010',
        rol: 'Repartidor',
        estado: 'Activo',
        fecha_creacion: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuario', null, {});
  }
};
