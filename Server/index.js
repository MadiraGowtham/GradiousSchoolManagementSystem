import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import { initCollections } from './utils/initCollections.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import examRoutes from './routes/examRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to database and initialize collections
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize collections (create them if they don't exist)
    await initCollections();
    
    // Start Express server after DB connection
    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Serve static files for uploaded images
    app.use('/uploads', express.static(join(__dirname, '../Client/public/uploads')));

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/marks', marksRoutes);
    app.use('/api/announcements', announcementRoutes);
    app.use('/api/timetable', timetableRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/exams', examRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        success: true, 
        message: 'Server is running',
        database: mongoose.connection.db.databaseName,
        timestamp: new Date().toISOString()
      });
    });

    // Database info endpoint
    app.get('/api/db/info', async (req, res) => {
      try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const stats = await db.stats();
        
        res.status(200).json({
          success: true,
          database: db.databaseName,
          collections: collections.map(c => ({
            name: c.name,
            type: c.type
          })),
          stats: {
            collections: stats.collections,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      console.log(`💡 View collections in MongoDB Compass: mongodb://localhost:27017/${mongoose.connection.db.databaseName}\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
