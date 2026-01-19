const { Sequelize } = require('sequelize');
const config = require('./config/config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log(`Trying to connect to ${dbConfig.dialect}://${dbConfig.username}:***@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    logging: console.log
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Try to query users table
        const [results, metadata] = await sequelize.query("SELECT count(*) FROM \"Usuarios\"");
        console.log('Users count:', results);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
