require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function listTables() {
  try {
    const results = await sequelize.getQueryInterface().showAllTables();
    console.log("TABLES:", results);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await sequelize.close();
  }
}

listTables();
