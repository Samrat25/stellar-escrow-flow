import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import escrowRoutes from './routes/escrow.js';
import milestoneRoutes from './routes/milestone.js';
import feedbackRoutes from './routes/feedback.js';
import userRoutes from './routes/user.js';
import agentRoutes from './routes/agent.js';

dotenv.config();
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'stellar-milestone-escrow',
    network: process.env.STELLAR_NETWORK || 'testnet',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Route handlers
 */
app.use('/escrow', escrowRoutes);
app.use('/milestone', milestoneRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/user', userRoutes);
app.use('/agent', agentRoutes);

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
  console.log(`🔗 Horizon: ${process.env.STELLAR_HORIZON_URL}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (dev)'}`);
});
