const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, preferences } = req.body;
        const updates = {};

        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('stats');
        res.json({ stats: user.stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const { nativeLanguage, targetLanguages, notificationSettings } = req.body;
        const updates = {};

        if (nativeLanguage) updates['preferences.nativeLanguage'] = nativeLanguage;
        if (targetLanguages) updates['preferences.targetLanguages'] = targetLanguages;
        if (notificationSettings) updates['preferences.notificationSettings'] = notificationSettings;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ message: 'Preferences updated successfully', user });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router; 