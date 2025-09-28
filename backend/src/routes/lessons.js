const express = require('express');
const auth = require('../middleware/auth');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const router = express.Router();

// Get all lessons for user
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, category, language } = req.query;
        const query = { user: req.user._id, isArchived: false };

        if (category) query.category = category;
        if (language) query['languages.target'] = language;

        const lessons = await Lesson.find(query)
            .sort({ order: 1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Lesson.countDocuments(query);

        res.json({
            lessons,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ error: 'Failed to get lessons' });
    }
});

// Get single lesson
router.get('/:id', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({ lesson });
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Failed to get lesson' });
    }
});

// Create new lesson
router.post('/', auth, async (req, res) => {
    try {
        const {
            title,
            content,
            languages,
            category,
            difficulty,
            tags
        } = req.body;

        const lesson = new Lesson({
            user: req.user._id,
            title,
            content,
            languages,
            category,
            difficulty,
            tags
        });

        await lesson.save();

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.totalLessons': 1 }
        });

        res.status(201).json({
            message: 'Lesson created successfully',
            lesson
        });
    } catch (error) {
        console.error('Create lesson error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to create lesson',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update lesson
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            title,
            content,
            languages,
            category,
            difficulty,
            tags,
            settings
        } = req.body;

        const lesson = await Lesson.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            {
                title,
                content,
                languages,
                category,
                difficulty,
                tags,
                settings
            },
            { new: true, runValidators: true }
        );

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({
            message: 'Lesson updated successfully',
            lesson
        });
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// Delete lesson
router.delete('/:id', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

// Update lesson progress
router.put('/:id/progress', auth, async (req, res) => {
    try {
        const { studyTime, comprehension, completed } = req.body;

        const lesson = await Lesson.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            {
                $inc: { 
                    'progress.studyTime': studyTime || 0,
                    'progress.timesStudied': 1
                },
                $set: {
                    'progress.lastStudied': new Date(),
                    'progress.comprehension': comprehension,
                    'progress.completed': completed
                }
            },
            { new: true }
        );

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.totalStudyTime': studyTime || 0 }
        });

        res.json({
            message: 'Progress updated successfully',
            lesson
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Archive lesson
router.put('/:id/archive', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            { isArchived: true },
            { new: true }
        );

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({
            message: 'Lesson archived successfully',
            lesson
        });
    } catch (error) {
        console.error('Archive lesson error:', error);
        res.status(500).json({ error: 'Failed to archive lesson' });
    }
});

// Get lesson statistics
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const stats = await Lesson.aggregate([
            { $match: { user: req.user._id, isArchived: false } },
            {
                $group: {
                    _id: null,
                    totalLessons: { $sum: 1 },
                    totalStudyTime: { $sum: '$progress.studyTime' },
                    completedLessons: { $sum: { $cond: ['$progress.completed', 1, 0] } },
                    averageComprehension: { $avg: '$progress.comprehension' }
                }
            }
        ]);

        const categoryStats = await Lesson.aggregate([
            { $match: { user: req.user._id, isArchived: false } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overview: stats[0] || {
                totalLessons: 0,
                totalStudyTime: 0,
                completedLessons: 0,
                averageComprehension: 0
            },
            byCategory: categoryStats
        });
    } catch (error) {
        console.error('Get lesson stats error:', error);
        res.status(500).json({ error: 'Failed to get lesson statistics' });
    }
});

// Reorder lessons
router.put('/reorder', auth, async (req, res) => {
    try {
        const { lessonIds } = req.body;

        if (!lessonIds || !Array.isArray(lessonIds)) {
            return res.status(400).json({ error: 'Invalid lesson IDs array' });
        }

        // Update the order field for each lesson
        const updatePromises = lessonIds.map((lessonId, index) => 
            Lesson.findOneAndUpdate(
                { _id: lessonId, user: req.user._id },
                { order: index },
                { new: true }
            )
        );

        await Promise.all(updatePromises);

        res.json({ message: 'Lesson order updated successfully' });
    } catch (error) {
        console.error('Reorder lessons error:', error);
        res.status(500).json({ error: 'Failed to reorder lessons' });
    }
});

module.exports = router; 