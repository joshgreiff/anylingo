const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'Token is not valid' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token is not valid' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        
        res.status(500).json({ error: 'Server error' });
    }
};

// Optional auth middleware (doesn't require token but adds user if present)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without user if token is invalid
        next();
    }
};

// Check subscription middleware
const requireSubscription = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!req.user.hasActiveSubscription()) {
            return res.status(403).json({ 
                error: 'Subscription required',
                message: 'This feature requires an active subscription'
            });
        }

        next();
    } catch (error) {
        console.error('Subscription middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.requireSubscription = requireSubscription; 