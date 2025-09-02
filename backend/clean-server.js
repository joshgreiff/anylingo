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