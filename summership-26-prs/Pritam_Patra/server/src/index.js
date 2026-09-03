require('dotenv').config();
const express = require('express');
const cors = require('cors');

const journeyRouter = require('./routes/journey');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/journey', journeyRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Inheritance Discovery server running on http://localhost:${PORT}`);
});
