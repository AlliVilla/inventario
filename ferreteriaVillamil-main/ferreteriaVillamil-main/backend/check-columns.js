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

async function checkColumns() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado a la DB");

        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Articulo'
            ORDER BY ordinal_position
        `);
        
        console.log("📊 Articulo Columns:");
        results.forEach(c => console.log(`- ${c.column_name}`));

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await sequelize.close();
    }
}

checkColumns();
