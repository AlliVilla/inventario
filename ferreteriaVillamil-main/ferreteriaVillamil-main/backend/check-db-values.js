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

async function checkEnumValues() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado a la DB");

        // Check columns for Articulo table
        const [columns] = await sequelize.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'Articulo'
            AND column_name = 'estado'
        `);
        console.log("📝 Column 'estado' info:", columns);

        const [results] = await sequelize.query('SELECT DISTINCT "estado" FROM "Articulo"');
        console.log("📊 Distinct estado values:", results);

    } catch (error) {
        console.error("❌ Error de conexión:", error);
    } finally {
        await sequelize.close();
    }
}

checkEnumValues();
