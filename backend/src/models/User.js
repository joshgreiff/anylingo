const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
            enum: ['free', 'trial', 'monthly', 'annual'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        squareCustomerId: String,
        squareSubscriptionId: String,
        autoRenew: {
            type: Boolean,
            default: true
        }
    },
    preferences: {
        nativeLanguage: {
            type: String,
            default: 'en'
        },
        targetLanguages: [{
            type: String,
            default: []
        }],
        notificationSettings: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    stats: {
        totalLessons: {
            type: Number,
            default: 0
        },
        totalStudyTime: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
    if (!this.subscription || !this.subscription.status) return false;
    if (this.subscription.status === 'free') return false;
    if (this.subscription.status === 'lifetime') return true;
    if (!this.subscription.endDate) return false;
    return new Date() < this.subscription.endDate;
};

// Virtual for subscription status
userSchema.virtual('isSubscribed').get(function() {
    return this.hasActiveSubscription();
});

module.exports = mongoose.model('User', userSchema); 