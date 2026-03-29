import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models';
import authRoutes from './routes/auth';
import blindBoxRoutes from './routes/blindBox';
import orderRoutes from './routes/orders';
import shoplineRoutes from './routes/shopline';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, widget.js ScriptTag loads)
    // and the configured frontend URL
    const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!origin || origin === allowed || origin.endsWith('.myshopline.com')) {
      cb(null, true);
    } else {
      cb(null, true); // permissive — tighten in production if needed
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blind-boxes', blindBoxRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shopline', shoplineRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Sync DB and start server
sequelize
  .sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

export default app;
