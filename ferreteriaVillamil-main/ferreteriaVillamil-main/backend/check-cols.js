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

async function describeTable() {
  try {
    const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Usuario'");
    console.log("COLUMNS:", results.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await sequelize.close();
  }
}

describeTable();
