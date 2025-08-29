const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('../src/config/database');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://www.anylingo.net',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to database
let dbConnected = false;
const initDB = async () => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('⚠️ Database connection failed:', error.message);
        }
    }
};

// Initialize database on first request
app.use(async (req, res, next) => {
    await initDB();
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'Connected' : 'Disconnected'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Test endpoint working',
        database: dbConnected ? 'Connected' : 'Disconnected'
    });
});

// Import and use routes
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/users', require('../src/routes/users'));
app.use('/api/lessons', require('../src/routes/lessons'));
app.use('/api/payments', require('../src/routes/payments'));
app.use('/api/subscriptions', require('../src/routes/subscriptions'));

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app; 