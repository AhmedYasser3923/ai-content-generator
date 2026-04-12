require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const corsMiddleware = require('./middleware/cors');

const generateRoute = require('./routes/generate');
const publishRoute  = require('./routes/publish');
const imageRoute    = require('./routes/image');
const historyRoute  = require('./routes/history');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status : 'ok',
    db     : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime : process.uptime().toFixed(1) + 's',
  });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/generate',         generateRoute);
app.use('/api/publish',          publishRoute);
app.use('/api/regenerate-image', imageRoute);
app.use('/api/history',          historyRoute);

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── MongoDB connection ──────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS : 8000,
    connectTimeoutMS         : 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
