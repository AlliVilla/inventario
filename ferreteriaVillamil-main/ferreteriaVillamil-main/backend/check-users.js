require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado a la DB");

        const [results] = await sequelize.query('SELECT id_usuario, nombre, correo, rol FROM "Usuario" LIMIT 5');
        console.log("📊 Usuarios:");
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
