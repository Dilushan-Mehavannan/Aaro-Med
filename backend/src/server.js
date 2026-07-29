import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import connectDB from './db.js';
import { initSocket } from './socket/queue.socket.js';
import { logRequest } from './middlewares/log.middleware.js';

import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug logger
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// Serve uploaded PDFs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// System log middleware (after auth middleware is applied per route)
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'SmartDoctor API running', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.send('SmartDoctor Backend is running. Please access the frontend app at http://localhost:5173');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

import Doctor from './models/Doctor.js';

// Connect DB and start
const startServer = async () => {
  try {
    await connectDB();
    await Doctor.updateMany({}, { is_online: false });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SmartDoctor API running on http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
};

startServer();

export default app;
