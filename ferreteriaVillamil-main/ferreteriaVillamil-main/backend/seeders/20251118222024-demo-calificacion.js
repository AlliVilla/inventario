'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
   
    // await queryInterface.bulkInsert('Calificacion', [
    //   {
    //     id_pedido: 1, // Debe corresponder a un pedido existente
    //     puntuacion: 5,
    //     comentario: 'Excelente servicio, muy puntual y amable',
    //     fecha_calificacion: new Date()
    //   }
    // ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Calificacion', null, {});
  }
};
