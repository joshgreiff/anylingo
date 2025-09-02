const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Database connection
let dbConnected = false;
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not set');
            return false;
        }
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        
        dbConnected = true;
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Simple health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AnyLingo API is running',
        database: dbConnected ? 'Connected' : 'Disconnected'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Health check passed',
        database: dbConnected ? 'Connected' : 'Disconnected'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Test endpoint working'
    });
});

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
            try {
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
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({ error: 'Database error', details: dbError.message });
            }
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

// Apply promo code
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
    try {
        console.log('Starting server...');
        await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app; 