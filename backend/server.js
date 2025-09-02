const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://www.anylingo.net',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
let dbConnected = false;
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
        
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI environment variable not set');
            return false;
        }
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1
        });
        
        dbConnected = true;
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('⚠️ Database connection failed:', error.message);
        return false;
    }
};

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    subscription: {
        status: {
            type: String,
            enum: ['free', 'monthly', 'annual', 'lifetime'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        promoCode: String,
        autoRenew: {
            type: Boolean,
            default: true
        }
    },
    preferences: {
        targetLanguages: [String]
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Simple health check that responds immediately
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        database: dbConnected ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint for Railway health checks
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        database: dbConnected ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
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

// Subscription plans
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

// User registration
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
        
        console.log('Registration request received for:', email);
        console.log('Database connected:', dbConnected);
        
        if (dbConnected) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                console.log('User already exists:', email);
                return res.status(400).json({ error: 'User with this email already exists' });
            }
            
            // Create new user
            const user = new User({
                firstName,
                lastName,
                email: email.toLowerCase(),
                password, // In production, this should be hashed
                preferences,
                subscription: {
                    status: 'free',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            });
            
            await user.save();
            console.log('User saved successfully:', user._id);
            
            // Mock JWT token
            const mockToken = 'mock_jwt_token_' + Date.now();
            
            res.json({
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    preferences: user.preferences,
                    subscription: user.subscription
                },
                token: mockToken
            });
        } else {
            console.log('Database not connected, using mock user');
            // Fallback to mock user if database is not connected
            const mockUser = {
                id: 'mock_user_' + Date.now(),
                firstName,
                lastName,
                email: email.toLowerCase(),
                preferences,
                subscription: {
                    status: 'free',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            };
            
            const mockToken = 'mock_jwt_token_' + Date.now();
            
            res.json({
                message: 'User registered successfully (mock)',
                user: mockUser,
                token: mockToken
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user', details: error.message });
    }
});

// Get current user (auth/me)
app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // For now, accept any mock token and return a mock user
    if (token.startsWith('mock_jwt_token_')) {
        const mockUser = {
            id: 'user_123',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            subscription: {
                status: 'lifetime',
                startDate: new Date(),
                endDate: null
            }
        };
        
        res.json({
            user: mockUser,
            message: 'User authenticated successfully'
        });
    } else {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Apply promo code
app.post('/api/subscriptions/apply-promo', async (req, res) => {
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
app.use('/*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
    try {
        console.log('🚀 Starting AnyLingo API server...');
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Port: ${PORT}`);
        
        // Try to connect to database, but don't fail if it doesn't work
        try {
            await connectDB();
        } catch (dbError) {
            console.error('⚠️ Database connection failed:', dbError.message);
            console.log('🔄 Starting server without database connection...');
        }
        
        // Start the server
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ AnyLingo API server running on port ${PORT}`);
            console.log(`🔗 Health check: http://0.0.0.0:${PORT}/`);
            console.log(`🌐 Server is ready for Railway health checks`);
        });
        
        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error('Port is already in use');
            }
        });
        
        // Handle process signals
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Only start server if this file is run directly
if (require.main === module) {
    startServer();
}

// For Vercel compatibility, export the app
module.exports = app; 