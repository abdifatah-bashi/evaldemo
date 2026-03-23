import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from './routes/authRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Required for some React static assets to load locally in dev
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Evaluation Platform API running' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Catch-all route to hand over routing to React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Database connection
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.warn('MONGODB_URI not set. Spinning up mongodb-memory-server...');
      const mongoServer = await MongoMemoryServer.create();
      mongoURI = mongoServer.getUri();
    }
    
    await mongoose.connect(mongoURI);
    console.log(`MongoDB connected successfully to ${process.env.MONGODB_URI ? 'Atlas' : 'In-Memory Server'}`);
    
    // Seed default data if running in-memory
    if (!process.env.MONGODB_URI) {
      const demoUsers = [
        { _id: '65e9b8f2c23a5d1b7c8d9999', name: 'Global Admin', email: 'admin@university.edu', role: 'admin' },
        { _id: '65e9b8f2c23a5d1b7c8d8f00', name: 'Demo Student', email: 'student@university.edu', role: 'student', studentId: 'STU12345' },
        { _id: '65e9b8f2c23a5d1b7c8d8f99', name: 'Dr. Alan Turing', email: 'aturing@university.edu', role: 'teacher', department: 'CS' },
        { _id: '65e9b8f2c23a5d1b7c8d8fa0', name: 'Dr. Katherine Johnson', email: 'kjohnson@university.edu', role: 'teacher', department: 'Math' },
        { _id: '65e9b8f2c23a5d1b7c8d8fa1', name: 'Dr. Timnit Gebru', email: 'tgebru@university.edu', role: 'teacher', department: 'AI' }
      ];
      for (const user of demoUsers) {
        if (!(await User.findById(user._id))) await User.create(user);
      }
      console.log('Mock teachers and student seeded to In-Memory Database.');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Start Server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});

export default app;
