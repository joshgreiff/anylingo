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
        message: 'Test endpoint working'
    });
});

// Mock subscription plans (for now)
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

// Promo code validation
app.post('/api/subscriptions/validate-promo', (req, res) => {
    const { promoCode } = req.body;
    
    const PROMO_CODES = {
        'TESTING2025': {
            type: 'lifetime',
            description: 'Free lifetime access for testing',
            valid: true
        },
        'FOUNDER2025': {
            type: 'lifetime', 
            description: 'Founder access',
            valid: true
        }
    };
    
    if (!promoCode) {
        return res.status(400).json({ error: 'Promo code is required' });
    }

    const code = PROMO_CODES[promoCode.toUpperCase()];
    
    if (!code || !code.valid) {
        return res.status(400).json({ error: 'Invalid promo code' });
    }

    res.json({
        valid: true,
        type: code.type,
        description: code.description
    });
});

// User registration (mock for now)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, preferences } = req.body;
        
        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Mock successful registration
        const mockUser = {
            id: 'user_' + Date.now(),
            firstName,
            lastName,
            email,
            preferences,
            subscription: {
                status: 'free',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        };
        
        // Mock JWT token
        const mockToken = 'mock_jwt_token_' + Date.now();
        
        res.json({
            message: 'User registered successfully',
            user: mockUser,
            token: mockToken
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Apply promo code (mock for now)
app.post('/api/subscriptions/apply-promo', (req, res) => {
    try {
        const { promoCode } = req.body;
        
        const PROMO_CODES = {
            'TESTING2025': {
                type: 'lifetime',
                description: 'Free lifetime access for testing',
                valid: true
            },
            'FOUNDER2025': {
                type: 'lifetime', 
                description: 'Founder access',
                valid: true
            }
        };
        
        if (!promoCode) {
            return res.status(400).json({ error: 'Promo code is required' });
        }

        const code = PROMO_CODES[promoCode.toUpperCase()];
        
        if (!code || !code.valid) {
            return res.status(400).json({ error: 'Invalid promo code' });
        }

        // Mock subscription update
        const mockSubscription = {
            status: 'lifetime',
            startDate: new Date(),
            endDate: null,
            promoCode: promoCode.toUpperCase(),
            autoRenew: false
        };

        res.json({
            message: 'Promo code applied successfully',
            subscription: mockSubscription,
            type: code.type,
            description: code.description
        });
        
    } catch (error) {
        console.error('Apply promo code error:', error);
        res.status(500).json({ error: 'Failed to apply promo code' });
    }
});

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