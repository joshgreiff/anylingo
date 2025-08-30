const mongoose = require('mongoose');

// Global connection cache for serverless environment
let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Environment variables check:');
        console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI environment variable not set');
            return false;
        }

        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('Already connected to MongoDB');
            cachedConnection = true;
            return true;
        }

        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            bufferMaxEntries: 0,
            maxPoolSize: 1, // Limit connections for serverless
            minPoolSize: 0,
            maxIdleTimeMS: 30000,
            connectTimeoutMS: 30000
        });

        cachedConnection = true;
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('⚠️ Database connection failed:', error.message);
        console.error('Full error:', error);
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

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://www.anylingo.net');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    // Connect to database
    const dbConnected = await connectDB();

    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
        res.json({
            status: 'OK',
            message: 'AnyLingo API is running',
            database: dbConnected ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Test endpoint
    if (pathname === '/api/test' && req.method === 'GET') {
        res.json({
            status: 'OK',
            message: 'Test endpoint working',
            database: dbConnected ? 'Connected' : 'Disconnected'
        });
        return;
    }

    // Subscription plans
    if (pathname === '/api/subscriptions/plans' && req.method === 'GET') {
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
        return;
    }

    // Promo code validation
    if (pathname === '/api/subscriptions/validate-promo' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { promoCode } = JSON.parse(body);
                
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
                    res.status(400).json({ error: 'Promo code is required' });
                    return;
                }

                const code = PROMO_CODES[promoCode.toUpperCase()];
                
                if (!code || !code.valid) {
                    res.status(400).json({ error: 'Invalid promo code' });
                    return;
                }

                res.json({
                    valid: true,
                    type: code.type,
                    description: code.description
                });
            } catch (error) {
                res.status(400).json({ error: 'Invalid JSON' });
            }
        });
        return;
    }

    // User registration
    if (pathname === '/api/auth/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { firstName, lastName, email, password, preferences } = JSON.parse(body);
                
                // Basic validation
                if (!firstName || !lastName || !email || !password) {
                    res.status(400).json({ error: 'All fields are required' });
                    return;
                }
                
                if (password.length < 8) {
                    res.status(400).json({ error: 'Password must be at least 8 characters' });
                    return;
                }
                
                console.log('Registration request received for:', email);
                console.log('Database connected:', dbConnected);
                
                if (dbConnected) {
                    try {
                        // Check if user already exists
                        const existingUser = await User.findOne({ email: email.toLowerCase() });
                        if (existingUser) {
                            console.log('User already exists:', email);
                            res.status(400).json({ error: 'User with this email already exists' });
                            return;
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
        return;
    }

    // Get current user (auth/me)
    if (pathname === '/api/auth/me' && req.method === 'GET') {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
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
        return;
    }

    // Apply promo code
    if (pathname === '/api/subscriptions/apply-promo' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { promoCode } = JSON.parse(body);
                
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
                    res.status(400).json({ error: 'Promo code is required' });
                    return;
                }

                const code = PROMO_CODES[promoCode.toUpperCase()];
                
                if (!code || !code.valid) {
                    res.status(400).json({ error: 'Invalid promo code' });
                    return;
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
        return;
    }

    // 404 handler
    res.status(404).json({ error: 'Route not found' });
}; 