const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true, // snake_case column names (created_at, updated_at)
  },
});

/**
 * Ensures the target MySQL database exists before Sequelize connects.
 */
async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
    console.log(`[Database] Database '${env.db.name}' verified/created successfully.`);
  } catch (error) {
    console.error('[Database] Failed to ensure database exists:', error.message);
    throw error;
  }
}

module.exports = {
  sequelize,
  ensureDatabaseExists,
};

