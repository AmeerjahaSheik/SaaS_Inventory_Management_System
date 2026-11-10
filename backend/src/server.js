const app = require('./app');
const env = require('./config/env');
const { initializeDatabase } = require('./models');

async function startServer() {
  try {
    console.log('[Server] Initializing StockFlow Database...');
    await initializeDatabase();

    const server = app.listen(env.port, () => {
      console.log(`[Server] StockFlow API is running in ${env.nodeEnv} mode on port ${env.port}`);
      console.log(`[Server] Healthcheck available at: http://localhost:${env.port}/api/v1/health`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Fatal Error during server startup:', error.message);
    process.exit(1);
  }
}

startServer();

