const express = require('express');
const path = require('path');
const cors = require('./middleware/cors');
const bodyParser = require('./middleware/bodyParser');
const staticFiles = require('./middleware/staticFiles');
const quoteRoutes = require('./routes/quote');

const app = express();

// Middleware
app.use(bodyParser);
app.use(cors);
app.use(staticFiles);

// Routes
app.use('/api', quoteRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

module.exports = app;