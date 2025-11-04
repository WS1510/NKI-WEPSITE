const express = require('express');
const quoteController = require('../controllers/quoteController');

const router = express.Router();

// Quote submission endpoint
router.post('/quote', quoteController.submitQuote);

// Quote logs endpoints
router.get('/quote-logs', quoteController.getQuoteLogs);
router.patch('/quote-logs/:id', quoteController.updateQuoteLog);
router.delete('/quote-logs/:id', quoteController.deleteQuoteLog);

module.exports = router;