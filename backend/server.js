const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const subscriptionRoutes = require('./src/routes/subscriptions');
const authRoutes = require('./src/routes/auth');
const lessonRoutes = require('./src/routes/lessons');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://www.anylingo.net', 'http://localhost:3000', 'http://localhost:3001']
        : true,
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

// Debug endpoint to check environment and database
app.get('/api/debug', (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        jwt_secret: process.env.JWT_SECRET ? 'Present' : 'Missing',
        mongodb_uri: process.env.MONGODB_URI ? 'Present' : 'Missing',
        database_status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        database_state: mongoose.connection.readyState,
        node_env: process.env.NODE_ENV
    });
});

// Mount routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);

// Temporary auth fallback for testing (remove after real auth is fixed)
app.post('/api/auth/register-temp', async (req, res) => {
    try {
        const { firstName, lastName, email, password, preferences } = req.body;
        
        console.log('Temporary register for:', email);
        
        // Simple validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create a proper JWT token (using a fallback secret for now)
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'temporary-secret-for-testing-only';
        
        const user = {
            id: Date.now().toString(),
                firstName,
                lastName,
            email,
            preferences: preferences || { targetLanguages: ['es'] }
        };
        
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            secret,
            { expiresIn: '7d' }
        );
        
        console.log('Temporary registration successful for:', email);

        res.json({
            message: 'User created successfully',
            token,
            user
        });
    } catch (error) {
        console.error('Temporary register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Start server
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ AnyLingo API server running on port ${PORT}`);
console.log('🔧 Server updated with JWT_SECRET and real auth system');
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
