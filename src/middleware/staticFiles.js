const express = require('express');
const path = require('path');

// Serve static site from public directory
const staticFiles = express.static(path.join(__dirname, '../../public'));

module.exports = staticFiles;