import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import escrowRoutes from './routes/escrow.js';
import milestoneRoutes from './routes/milestone.js';
import feedbackRoutes from './routes/feedback.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'trustpay-backend'
  });
});

// Routes
app.use('/escrow', escrowRoutes);
app.use('/milestone', milestoneRoutes);
app.use('/feedback', feedbackRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 TrustPay Backend running on port ${PORT}`);
  console.log(`📡 Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
  console.log(`🔗 Horizon: ${process.env.STELLAR_HORIZON_URL}`);
});
