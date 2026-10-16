require('dotenv').config();
const app = require('./app');
const initDatabase = require('./config/initDb');
const { connectMongo } = require('./config/mongoose');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // 1. Initialize Relational Schema (SQLite / PostgreSQL)
    await initDatabase();
    console.log('✅ Relational database schema verified and initialized.');

    // 2. Connect to MongoDB if MONGODB_URI is specified
    if (process.env.MONGODB_URI) {
      try {
        await connectMongo();
        console.log('🍃 MongoDB Mongoose connection established.');
      } catch (mongoErr) {
        console.warn(`⚠️ MongoDB connection deferred: ${mongoErr.message}`);
      }
    } else {
      console.log('ℹ️ MONGODB_URI not set. Set MONGODB_URI in .env to connect to MongoDB Atlas or local MongoDB.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 HunarHub API Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   MongoDB info: http://localhost:${PORT}/api/mongodb/status`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
