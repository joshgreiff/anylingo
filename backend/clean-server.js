const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    preferences: { targetLanguages: [String] }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Lesson Schema
const lessonSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    targetLanguage: {
        type: String,
        required: true
    },
    sourceLanguage: {
        type: String,
        default: 'auto'
    },
    translation: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['draft', 'completed'],
        default: 'draft'
    },
    metadata: {
        wordCount: Number,
        sentenceCount: Number,
        createdAt: Date,
        lastModified: Date
    }
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', lessonSchema);

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
                
                // Hash password before saving
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                
                // Create new user
                const user = new User({
                    firstName,
                    lastName,
                    email: email.toLowerCase(),
                    password: hashedPassword,
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

// User login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        console.log('Login request received for:', email);
        console.log('Database connected:', dbConnected);
        
        if (dbConnected) {
            try {
                // Find user by email
                const user = await User.findOne({ email: email.toLowerCase() });
                if (!user) {
                    console.log('User not found:', email);
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
                
                // Verify password using bcrypt
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    console.log('Invalid password for user:', email);
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
                
                console.log('User authenticated successfully:', user._id);
                
                // Mock JWT token
                const mockToken = 'mock_jwt_token_' + Date.now();
                
                res.json({
                    message: 'Login successful',
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
            console.log('Database not connected, using mock login');
            // For mock login, we'll accept any password when database is down
            // This is just for development/testing purposes
            const mockUser = {
                id: 'mock_user_' + Date.now(),
                firstName: 'Test',
                lastName: 'User',
                email: email.toLowerCase(),
                preferences: { targetLanguages: ['en'] },
                subscription: {
                    status: 'lifetime',
                    startDate: new Date(),
                    endDate: null
                }
            };
            
            const mockToken = 'mock_jwt_token_' + Date.now();
            
            res.json({
                message: 'Login successful (mock)',
                user: mockUser,
                token: mockToken
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login', details: error.message });
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

// Lesson endpoints
app.post('/api/lessons', async (req, res) => {
    try {
        const { title, content, targetLanguage, sourceLanguage, translation, userId } = req.body;
        
        if (!title || !content || !targetLanguage || !userId) {
            return res.status(400).json({ error: 'Title, content, target language, and user ID are required' });
        }
        
        if (dbConnected) {
            try {
                // Verify user exists
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                // Calculate metadata
                const wordCount = content.split(/\s+/).length;
                const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
                
                // Create lesson
                const lesson = new Lesson({
                    userId,
                    title,
                    content,
                    targetLanguage,
                    sourceLanguage: sourceLanguage || 'auto',
                    translation: translation || '',
                    metadata: {
                        wordCount,
                        sentenceCount,
                        createdAt: new Date(),
                        lastModified: new Date()
                    }
                });
                
                await lesson.save();
                console.log('Lesson saved successfully:', lesson._id);
                
                res.json({
                    message: 'Lesson created successfully',
                    lesson: {
                        id: lesson._id,
                        title: lesson.title,
                        content: lesson.content,
                        targetLanguage: lesson.targetLanguage,
                        sourceLanguage: lesson.sourceLanguage,
                        translation: lesson.translation,
                        status: lesson.status,
                        metadata: lesson.metadata,
                        createdAt: lesson.createdAt
                    }
                });
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({ error: 'Database error', details: dbError.message });
            }
        } else {
            console.log('Database not connected, using mock lesson');
            const mockLesson = {
                id: 'mock_lesson_' + Date.now(),
                title,
                content,
                targetLanguage,
                sourceLanguage: sourceLanguage || 'auto',
                translation: translation || '',
                status: 'draft',
                metadata: {
                    wordCount: content.split(/\s+/).length,
                    sentenceCount: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
                    createdAt: new Date(),
                    lastModified: new Date()
                }
            };
            
            res.json({
                message: 'Lesson created successfully (mock)',
                lesson: mockLesson
            });
        }
    } catch (error) {
        console.error('Lesson creation error:', error);
        res.status(500).json({ error: 'Failed to create lesson', details: error.message });
    }
});

// Get user's lessons
app.get('/api/lessons/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (dbConnected) {
            try {
                // Verify user exists
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                // Get user's lessons
                const lessons = await Lesson.find({ userId }).sort({ createdAt: -1 });
                console.log(`Found ${lessons.length} lessons for user: ${userId}`);
                
                res.json({
                    message: 'Lessons retrieved successfully',
                    lessons: lessons.map(lesson => ({
                        id: lesson._id,
                        title: lesson.title,
                        content: lesson.content,
                        targetLanguage: lesson.targetLanguage,
                        sourceLanguage: lesson.sourceLanguage,
                        translation: lesson.translation,
                        status: lesson.status,
                        metadata: lesson.metadata,
                        createdAt: lesson.createdAt
                    }))
                });
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({ error: 'Database error', details: dbError.message });
            }
        } else {
            console.log('Database not connected, returning mock lessons');
            const mockLessons = [
                {
                    id: 'mock_lesson_1',
                    title: 'Sample Lesson',
                    content: 'This is a sample lesson for testing purposes.',
                    targetLanguage: 'es',
                    sourceLanguage: 'auto',
                    translation: 'Esta es una lección de muestra para propósitos de prueba.',
                    status: 'completed',
                    metadata: {
                        wordCount: 9,
                        sentenceCount: 1,
                        createdAt: new Date(),
                        lastModified: new Date()
                    }
                }
            ];
            
            res.json({
                message: 'Lessons retrieved successfully (mock)',
                lessons: mockLessons
            });
        }
    } catch (error) {
        console.error('Lesson retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve lessons', details: error.message });
    }
});

// Update lesson
app.put('/api/lessons/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, content, targetLanguage, sourceLanguage, translation, status } = req.body;
        
        if (dbConnected) {
            try {
                const lesson = await Lesson.findById(lessonId);
                if (!lesson) {
                    return res.status(404).json({ error: 'Lesson not found' });
                }
                
                // Update fields
                if (title) lesson.title = title;
                if (content) lesson.content = content;
                if (targetLanguage) lesson.targetLanguage = targetLanguage;
                if (sourceLanguage) lesson.sourceLanguage = sourceLanguage;
                if (translation !== undefined) lesson.translation = translation;
                if (status) lesson.status = status;
                
                // Update metadata
                if (content) {
                    lesson.metadata.wordCount = content.split(/\s+/).length;
                    lesson.metadata.sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
                }
                lesson.metadata.lastModified = new Date();
                
                await lesson.save();
                console.log('Lesson updated successfully:', lessonId);
                
                res.json({
                    message: 'Lesson updated successfully',
                    lesson: {
                        id: lesson._id,
                        title: lesson.title,
                        content: lesson.content,
                        targetLanguage: lesson.targetLanguage,
                        sourceLanguage: lesson.sourceLanguage,
                        translation: lesson.translation,
                        status: lesson.status,
                        metadata: lesson.metadata,
                        createdAt: lesson.createdAt
                    }
                });
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({ error: 'Database error', details: dbError.message });
            }
        } else {
            console.log('Database not connected, mock update');
            res.json({
                message: 'Lesson updated successfully (mock)',
                lesson: {
                    id: lessonId,
                    title: title || 'Updated Lesson',
                    content: content || 'Updated content',
                    targetLanguage: targetLanguage || 'en',
                    sourceLanguage: sourceLanguage || 'auto',
                    translation: translation || '',
                    status: status || 'draft',
                    metadata: {
                        wordCount: content ? content.split(/\s+/).length : 0,
                        sentenceCount: content ? content.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0,
                        createdAt: new Date(),
                        lastModified: new Date()
                    }
                }
            });
        }
    } catch (error) {
        console.error('Lesson update error:', error);
        res.status(500).json({ error: 'Failed to update lesson', details: error.message });
    }
});

// Delete lesson
app.delete('/api/lessons/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        if (dbConnected) {
            try {
                const lesson = await Lesson.findByIdAndDelete(lessonId);
                if (!lesson) {
                    return res.status(404).json({ error: 'Lesson not found' });
                }
                
                console.log('Lesson deleted successfully:', lessonId);
                res.json({ message: 'Lesson deleted successfully' });
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({ error: 'Database error', details: dbError.message });
            }
        } else {
            console.log('Database not connected, mock delete');
            res.json({ message: 'Lesson deleted successfully (mock)' });
        }
    } catch (error) {
        console.error('Lesson deletion error:', error);
        res.status(500).json({ error: 'Failed to delete lesson', details: error.message });
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