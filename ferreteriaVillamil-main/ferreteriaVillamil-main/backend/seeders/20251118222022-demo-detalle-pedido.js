'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // await queryInterface.bulkInsert('Detalle_Pedido', [
    //   {
    //     id_pedido: 1, // Debe corresponder a un pedido existente
    //     id_articulo: 1, // Martillo de Acero (único artículo disponible)
    //     cantidad: 2,
    //     precio_unitario: 80,
    //     subtotal: 160
    //   }
    // ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Detalle_Pedido', null, {});
  }
};
