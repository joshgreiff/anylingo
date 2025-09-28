const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    user: {
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
        original: {
            type: String,
            required: true
        },
        translated: {
            type: String,
            default: ''
        }
    },
    languages: {
        source: {
            type: String,
            required: true,
            default: 'en'
        },
        target: {
            type: String,
            required: true
        }
    },
    category: {
        type: String,
        enum: ['business', 'travel', 'daily', 'academic', 'hobby', 'other'],
        default: 'other'
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    progress: {
        completed: {
            type: Boolean,
            default: false
        },
        studyTime: {
            type: Number,
            default: 0
        },
        lastStudied: Date,
        timesStudied: {
            type: Number,
            default: 0
        },
        comprehension: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    settings: {
        speechRate: {
            type: Number,
            default: 1.0,
            min: 0.5,
            max: 2.0
        },
        voice: {
            type: String,
            default: 'default'
        },
        autoTranslate: {
            type: Boolean,
            default: true
        },
        highlightMode: {
            type: String,
            enum: ['word', 'sentence', 'paragraph'],
            default: 'sentence'
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    metadata: {
        wordCount: {
            type: Number,
            default: 0
        },
        sentenceCount: {
            type: Number,
            default: 0
        },
        estimatedReadingTime: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Calculate metadata before saving
lessonSchema.pre('save', function(next) {
    if (this.isModified('content.original')) {
        const text = this.content.original;
        this.metadata.wordCount = text.split(/\s+/).length;
        this.metadata.sentenceCount = text.split(/[.!?]+/).length - 1;
        this.metadata.estimatedReadingTime = Math.ceil(this.metadata.wordCount / 200); // 200 words per minute
    }
    next();
});

// Index for efficient queries
lessonSchema.index({ user: 1, createdAt: -1 });
lessonSchema.index({ user: 1, category: 1 });
lessonSchema.index({ user: 1, languages: 1 });
lessonSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema); 