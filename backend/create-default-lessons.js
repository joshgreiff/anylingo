const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anylingo');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Lesson Schema (matching the existing one)
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

const Lesson = mongoose.model('Lesson', lessonSchema);

// Default lessons from the Manus sources (based on the provided links)
// Since I can't access the actual files, I'll create sample lessons based on typical language learning content
const defaultLessons = [
    {
        title: "The Olive Grove of Secrets",
        content: {
            original: `A quiet girl named Lola lived in a small village in southern Spain. Her family owned an ancient olive grove that had been passed down for generations. Lola's father, who loved poetry and the land, had taught her to care for the twisted trees. But when he died suddenly, the grove began to wither, and the family struggled to pay their debts.

While searching her father's old desk one afternoon, Lola found a leather journal hidden beneath a stack of yellowed papers. Inside were sketches of the grove and a mysterious sentence: "Beneath the oldest tree lies the truth we bury." Her hands trembled. Could this be a clue to a secret her father had left behind?

That night, Lola crept into the grove with a shovel. The moon cast long shadows over the gnarled trees as she dug beneath the largest olive tree, its branches clawing at the sky. Her shovel struck something hard—a metal box. Inside was a bundle of letters, a faded photograph of her father as a young man, and a small bag of gold coins.

The letters told a story Lola had never heard. Decades ago, her grandfather had hidden the coins during the Spanish Civil War to protect the family. But her father had chosen to leave the treasure untouched, writing, "Some secrets are better left as roots. The grove is our true wealth."

Lola stared at the coins. They could save her family from poverty. But her father's words echoed in her mind. The following day, she showed the box to her mother, who wept and hugged her tightly. "Your father was a dreamer," her mother said, "but he taught us that dignity grows slowly, like these trees."

In the end, Lola returns the coins to the earth. She poured her energy into reviving the grove, pruning the trees and selling olives at the market. Slowly, the branches grew strong again, heavy with fruit.

Years later, when Lola won a literary prize for a novel inspired by her father's journal, reporters asked about the "secret" to her success. She smiled and said, "The best stories are not those we dig up, but those we plant with patience."`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "daily",
        difficulty: "intermediate",
        tags: ["story", "family", "secrets", "spain"]
    },
    {
        title: "The Day of Failure",
        content: {
            original: `In Finland, people have a special day, not for success, but for failure. It is called the Day of Failure, or "Epäonnistumisen Päivä" in Finnish, and it is observed annually on October 13th. This day is a time to share stories of mistakes and things that went wrong.

The idea for this day started in 2010 with a group of students in Finland. They observed that many people were hesitant to try new things, such as starting a business, because they were afraid of failure. The students wanted to change this. They believed that making mistakes is a regular part of life and an important step to learn and succeeding.

On the Day of Failure, people are encouraged to discuss their mistakes openly and honestly. Famous people often share stories about the times they failed before achieving success. This helps everyone understand that failure is not something to be ashamed of. Instead, it is a chance to learn.

Imagine a boy named Leo who wants to bake a cake. He tries his best, but he burns it. On the Day of Failure, he can share a picture of his burnt cake. His friends will not laugh at him. They will cheer for him because he made an effort. They may share their own stories of burnt cakes or other mistakes.

This special day teaches an important lesson: it is okay not to be perfect. Every mistake is a learning experience. By sharing our failures, we can become braver and more willing to try again. The Day of Failure reminds us that minor setbacks often mark the path to success, and that is perfectly fine.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "fi"
        },
        category: "daily",
        difficulty: "intermediate",
        tags: ["culture", "finland", "learning", "failure"]
    }
];

// Function to create default lessons for a user
async function createDefaultLessonsForUser(userId, targetLanguage = 'es') {
    try {
        const lessons = defaultLessons.map(lessonData => ({
            ...lessonData,
            user: userId,
            languages: {
                ...lessonData.languages,
                target: targetLanguage
            }
        }));

        const createdLessons = await Lesson.insertMany(lessons);
        console.log(`Created ${createdLessons.length} default lessons for user ${userId}`);
        return createdLessons;
    } catch (error) {
        console.error('Error creating default lessons:', error);
        throw error;
    }
}

// Function to add default lessons to all existing users who don't have any lessons
async function addDefaultLessonsToExistingUsers() {
    try {
        // Import User model
        const User = require('./src/models/User');
        const users = await User.find({});
        
        for (const user of users) {
            const existingLessons = await Lesson.find({ user: user._id });
            if (existingLessons.length === 0) {
                const targetLanguage = user.preferences?.targetLanguages?.[0] || 'es';
                await createDefaultLessonsForUser(user._id, targetLanguage);
                console.log(`Added default lessons to user: ${user.email}`);
            } else {
                console.log(`User ${user.email} already has ${existingLessons.length} lessons`);
            }
        }
    } catch (error) {
        console.error('Error adding default lessons to existing users:', error);
        throw error;
    }
}

// Export functions for use in other files
module.exports = {
    createDefaultLessonsForUser,
    addDefaultLessonsToExistingUsers,
    defaultLessons
};

// Run if called directly
if (require.main === module) {
    connectDB().then(async () => {
        console.log('Adding default lessons to existing users...');
        await addDefaultLessonsToExistingUsers();
        console.log('Done!');
        process.exit(0);
    }).catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
} 