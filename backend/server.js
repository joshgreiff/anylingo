const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const subscriptionRoutes = require('./src/routes/subscriptions');
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || 'https://www.anylingo.net') : true,
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        database: 'Connected',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        database: 'Connected',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/auth', authRoutes);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AnyLingo API server running on port ${PORT}`);
console.log('🔧 Server updated with SQUARE_ENVIORNMENT fix');
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/`);
    console.log(`🌐 Server is ready for Railway health checks`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error('Port is already in use');
    }
});

module.exports = app;
