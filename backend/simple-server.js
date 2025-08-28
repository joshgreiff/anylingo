const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AnyLingo API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'AnyLingo Backend API',
        version: '1.0.0',
        status: 'running'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple AnyLingo API server running on port ${PORT}`);
});

module.exports = app; 