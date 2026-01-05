'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 
    // Ejemplo de pedido comentado:
    // await queryInterface.bulkInsert('Pedido', [
    //   {
    //     numero_pedido: 'PED001',
    //     cliente_nombre: 'Juan García',
    //     cliente_telefono: '88880001',
    //     cliente_identidad: '0801-1990-12345',
    //     id_repartidor_asignado: 2, // Carlos Méndez (ID 2)
    //     id_admin_creador: 1, // Admin Uno (ID 1)
    //     estado: 'Pendiente',
    //     codigo_confirmacion: '123456',
    //     costo_envio: 50,
    //     total: 280,
    //     direccion_entrega: 'Col. Centro, Tegucigalpa',
    //     observacion: null,
    //     fecha_creacion: new Date(),
    //     fecha_asignacion: null,
    //     fecha_entrega: null,
    //     fecha_cancelacion: null,
    //     motivo_cancelacion: null,
    //     link_seguimiento: null
    //   }
    // ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Pedido', null, {});
  }
};
