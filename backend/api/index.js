const mongoose = require('mongoose');

// Database connection with connection pooling
let dbConnected = false;
let connectionPromise = null;

const connectDB = async () => {
    if (dbConnected) {
        return true;
    }
    
    if (connectionPromise) {
        return connectionPromise;
    }
    
    connectionPromise = (async () => {
        try {
            console.log('Attempting to connect to MongoDB...');
            console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
            
            if (!process.env.MONGODB_URI) {
                console.error('MONGODB_URI environment variable not set');
                return false;
            }
            
            // Check if already connected
            if (mongoose.connection.readyState === 1) {
                console.log('Already connected to MongoDB');
                dbConnected = true;
                return true;
            }
            
            // Close any existing connections
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
            }
            
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
                bufferMaxEntries: 0,
                maxPoolSize: 10,
                minPoolSize: 1
            });
            
            dbConnected = true;
            console.log('✅ Connected to MongoDB');
            return true;
        } catch (error) {
            console.error('⚠️ Database connection failed:', error.message);
            console.error('Full error:', error);
            return false;
        }
    })();
    
    return connectionPromise;
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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Connect to database
    dbConnected = await connectDB();
    
    // Route handling
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    // Health check
    if (pathname === '/api/health') {
        res.json({ 
            status: 'OK', 
            message: 'AnyLingo API is running',
            timestamp: new Date().toISOString(),
            database: dbConnected ? 'Connected' : 'Disconnected'
        });
        return;
    }
    
    // Test endpoint
    if (pathname === '/api/test') {
        res.json({ 
            status: 'OK', 
            message: 'Test endpoint working',
            database: dbConnected ? 'Connected' : 'Disconnected'
        });
        return;
    }
    
    // Database test endpoint
    if (pathname === '/api/test-db') {
        try {
            console.log('Testing database connection...');
            console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
            console.log('MONGODB_URI preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set');
            
            if (!process.env.MONGODB_URI) {
                res.json({ 
                    status: 'ERROR', 
                    message: 'MONGODB_URI not set',
                    database: 'Not configured'
                });
                return;
            }
            
            // Try to connect
            await connectDB();
            
            if (dbConnected) {
                // Try a simple database operation
                const User = mongoose.model('User');
                const count = await User.countDocuments();
                
                res.json({ 
                    status: 'SUCCESS', 
                    message: 'Database connected and working',
                    database: 'Connected',
                    userCount: count
                });
            } else {
                res.json({ 
                    status: 'ERROR', 
                    message: 'Database connection failed',
                    database: 'Failed to connect'
                });
            }
        } catch (error) {
            console.error('Database test error:', error);
            res.json({ 
                status: 'ERROR', 
                message: 'Database test failed',
                error: error.message,
                database: 'Error'
            });
        }
        return;
    }
    
    // Subscription plans
    if (pathname === '/api/subscriptions/plans') {
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
        req.on('data', chunk => {
            body += chunk.toString();
        });
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
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                console.log('Registration request received');
                const { firstName, lastName, email, password, preferences } = JSON.parse(body);
                console.log('Parsed data:', { firstName, lastName, email, preferences: !!preferences });
                
                // Basic validation
                if (!firstName || !lastName || !email || !password) {
                    console.log('Validation failed: missing required fields');
                    res.status(400).json({ error: 'All fields are required' });
                    return;
                }
                
                if (password.length < 8) {
                    console.log('Validation failed: password too short');
                    res.status(400).json({ error: 'Password must be at least 8 characters' });
                    return;
                }
                
                console.log('Database connected:', dbConnected);
                
                let user;
                
                if (dbConnected) {
                    console.log('Attempting to save user to database...');
                    // Check if user already exists
                    const existingUser = await User.findOne({ email: email.toLowerCase() });
                    if (existingUser) {
                        console.log('User already exists:', email);
                        res.status(400).json({ error: 'User with this email already exists' });
                        return;
                    }
                    
                    // Create new user in database
                    user = new User({
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
                    
                    console.log('Saving user to database...');
                    await user.save();
                    console.log('User saved successfully:', user._id);
                } else {
                    // Fallback to mock user if database is not connected
                    console.log('Database not connected, using mock user');
                    user = {
                        _id: 'mock_user_' + Date.now(),
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
                }
                
                // Mock JWT token (in production, use proper JWT)
                const mockToken = 'mock_jwt_token_' + Date.now();
                
                console.log('Registration successful, returning response');
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
            } catch (error) {
                console.error('Registration error:', error);
                console.error('Error stack:', error.stack);
                res.status(500).json({ 
                    error: 'Failed to register user',
                    details: error.message 
                });
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
            // In production, decode JWT and find real user
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
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
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

                // In production, update the actual user's subscription
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
                res.status(400).json({ error: 'Invalid JSON' });
            }
        });
        return;
    }
    
    // Default response
    res.status(404).json({ error: 'Route not found' });
}; 