const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Simple health check
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Test server working' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Health check passed' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Test server running on port ${PORT}`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

module.exports = app;
