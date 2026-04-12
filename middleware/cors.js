const cors = require('cors');

const allowedOrigins = process.env.FRONTEND_URL === '*'
  ? '*'
  : (process.env.FRONTEND_URL || '').split(',').map(s => s.trim());

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

module.exports = cors(corsOptions);
