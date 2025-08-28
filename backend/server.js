const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple test endpoint (no database required)
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

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/lessons', require('./src/routes/lessons'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/subscriptions', require('./src/routes/subscriptions'));

// Error handling middleware
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

// Connect to database and start server
const startServer = async () => {
    try {
        // Try to connect to database, but don't fail if it doesn't work
        try {
            await connectDB();
            console.log('✅ Connected to MongoDB');
        } catch (dbError) {
            console.error('⚠️ Database connection failed:', dbError.message);
            console.log('🔄 Starting server without database connection...');
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 AnyLingo API server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 