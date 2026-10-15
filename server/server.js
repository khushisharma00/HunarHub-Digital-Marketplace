require('dotenv').config();
const app = require('./app');
const initDatabase = require('./config/initDb');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database schema verified and initialized.');

    app.listen(PORT, () => {
      console.log(`🚀 HunarHub API Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
