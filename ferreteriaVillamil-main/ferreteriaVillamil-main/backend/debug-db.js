require("dotenv").config();
const { Sequelize } = require("sequelize");

// Crear conexión usando la URI de Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: console.log,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

// Probar conexión
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado a la DB");

        // Prueba real a una tabla
        const [results] = await sequelize.query('SELECT count(*) FROM "Articulo"');
        console.log("📊 Articulos count:", results);

    } catch (error) {
        console.error("❌ Error de conexión:", error);
    }
}

// Ejecutar prueba
testConnection();

// Exportar conexión para el resto del backend
module.exports = sequelize;