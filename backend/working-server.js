const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
    origin: ['https://www.anylingo.net', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Test endpoint working',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Mock subscription plans endpoint
app.get('/api/subscriptions/plans', (req, res) => {
    res.json({
        plans: [
            {
                id: 'monthly',
                name: 'AnyLingo Monthly',
                price: 2.99,
                period: 'monthly',
                description: 'Monthly subscription to AnyLingo'
            },
            {
                id: 'annual',
                name: 'AnyLingo Annual',
                price: 24.99,
                period: 'annual',
                description: 'Annual subscription to AnyLingo (Save 30%)'
            }
        ]
    });
});

// Mock auth endpoint
app.post('/api/auth/register', (req, res) => {
    res.json({
        message: 'Registration successful',
        user: {
            id: 'test-user-id',
            email: req.body.email,
            subscription: {
                status: 'trial',
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AnyLingo API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 