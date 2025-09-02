const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (same as in clean-server.js)
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

async function hashExistingPasswords() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        console.log('✅ Connected to MongoDB');
        
        // Find users with unhashed passwords (passwords that don't start with $2a$ or $2b$)
        const usersWithPlainPasswords = await User.find({
            password: { $not: /^\$2[ab]\$/ }
        });
        
        console.log(`Found ${usersWithPlainPasswords.length} users with potentially unhashed passwords`);
        
        if (usersWithPlainPasswords.length === 0) {
            console.log('✅ All passwords are already hashed');
            return;
        }
        
        let updatedCount = 0;
        for (const user of usersWithPlainPasswords) {
            try {
                // Hash the password
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                
                // Update the user with hashed password
                await User.findByIdAndUpdate(user._id, { password: hashedPassword });
                
                console.log(`✅ Updated password for user: ${user.email}`);
                updatedCount++;
            } catch (error) {
                console.error(`❌ Failed to update password for user ${user.email}:`, error.message);
            }
        }
        
        console.log(`✅ Successfully updated ${updatedCount} out of ${usersWithPlainPasswords.length} users`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
if (require.main === module) {
    hashExistingPasswords();
}

module.exports = { hashExistingPasswords }; 