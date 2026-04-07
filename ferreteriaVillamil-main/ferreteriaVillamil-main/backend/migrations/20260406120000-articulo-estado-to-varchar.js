'use strict';

/** Sequelize ENUM + PostgreSQL enum labels caused bound values like "disponible" (invalid). Store estado as plain text. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Articulo"
      ALTER COLUMN estado TYPE VARCHAR(32)
      USING (estado::text);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Articulo"
      ALTER COLUMN estado TYPE estado_articulo
      USING (estado::estado_articulo);
    `);
  }
};
