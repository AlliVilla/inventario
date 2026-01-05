'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pedido', {
      id_pedido: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      numero_pedido: Sequelize.STRING,
      cliente_nombre: Sequelize.STRING,
      cliente_telefono: Sequelize.STRING,
      cliente_identidad: Sequelize.STRING,

      id_repartidor_asignado: { type: Sequelize.INTEGER },
      id_admin_creador: { type: Sequelize.INTEGER },

      estado: { type: 'estado_pedido' },
      codigo_confirmacion: Sequelize.STRING,
      costo_envio: Sequelize.DECIMAL,
      total: Sequelize.DECIMAL,
      direccion_entrega: Sequelize.STRING,
      observacion: Sequelize.STRING,

      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      fecha_asignacion: Sequelize.DATE,
      fecha_entrega: Sequelize.DATE,
      fecha_cancelacion: Sequelize.DATE,
      motivo_cancelacion: Sequelize.STRING,
      link_seguimiento: Sequelize.STRING
    });

    // FK Usuario
    await queryInterface.addConstraint('Pedido', {
      fields: ['id_repartidor_asignado'],
      type: 'foreign key',
      name: 'fk_repartidor',
      references: { table: 'Usuario', field: 'id_usuario' }
    });

    await queryInterface.addConstraint('Pedido', {
      fields: ['id_admin_creador'],
      type: 'foreign key',
      name: 'fk_admin_creador',
      references: { table: 'Usuario', field: 'id_usuario' }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Pedido');
  }
};
