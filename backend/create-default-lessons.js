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
        title: "Daily Conversation Basics",
        content: {
            original: `Good morning! How are you today? I'm doing well, thank you. What are your plans for today? I have a meeting at 10 AM, then lunch with a friend. That sounds nice! I hope you have a great day. Thank you, you too!

This basic conversation covers common greetings and everyday interactions. Practice these phrases to build confidence in daily conversations.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "daily",
        difficulty: "beginner",
        tags: ["greetings", "daily", "conversation"]
    },
    {
        title: "Restaurant Ordering",
        content: {
            original: `Excuse me, could I see the menu please? Of course! Here you are. What would you like to drink? I'll have a glass of water and a coffee, please. And for your main course? I'd like the grilled chicken with vegetables. How would you like that cooked? Medium, please. Excellent choice! It will be ready in about 15 minutes.

This lesson covers essential phrases for dining out and ordering food in restaurants.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "travel",
        difficulty: "beginner",
        tags: ["restaurant", "food", "ordering"]
    },
    {
        title: "Business Meeting Introduction",
        content: {
            original: `Good afternoon everyone. Let me introduce myself - I'm Sarah Johnson from the marketing department. I've been with the company for three years. Today we'll be discussing our quarterly results and planning for the next quarter. First, let's review our achievements from this quarter. Sales have increased by 15% compared to last quarter. Our customer satisfaction ratings have also improved significantly.

This lesson focuses on professional introductions and business communication.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "business",
        difficulty: "intermediate",
        tags: ["business", "meetings", "professional"]
    },
    {
        title: "Shopping and Prices",
        content: {
            original: `Excuse me, how much does this shirt cost? It's $25. Do you have it in a different color? Yes, we have it in blue, red, and black. Can I try it on? Of course! The fitting rooms are over there. This fits perfectly. I'll take it. Would you like to pay by cash or card? Card, please. Here's your receipt. Thank you for shopping with us!

Learn essential vocabulary and phrases for shopping and making purchases.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "daily",
        difficulty: "beginner",
        tags: ["shopping", "money", "clothes"]
    },
    {
        title: "Travel and Directions",
        content: {
            original: `Excuse me, could you help me find the train station? Sure! Go straight down this street for two blocks, then turn left at the traffic light. You'll see the station on your right. How long does it take to walk there? About 10 minutes. Is there a bus that goes there? Yes, bus number 42 stops right in front of the station. Where can I catch that bus? There's a bus stop just around the corner. Thank you so much for your help!

Master asking for and giving directions while traveling.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "travel",
        difficulty: "beginner",
        tags: ["directions", "transportation", "travel"]
    },
    {
        title: "Academic Discussion",
        content: {
            original: `Today we're going to discuss the impact of technology on modern education. Digital tools have revolutionized how students learn and teachers instruct. Online platforms provide access to vast resources and enable remote learning. However, there are challenges such as the digital divide and screen time concerns. Interactive software can make learning more engaging, but it's important to maintain human connection in education. What are your thoughts on balancing technology with traditional teaching methods?

This lesson explores academic vocabulary and discussion techniques.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "academic",
        difficulty: "advanced",
        tags: ["education", "technology", "discussion"]
    },
    {
        title: "Hobbies and Free Time",
        content: {
            original: `What do you like to do in your free time? I enjoy reading books and playing guitar. That's interesting! How long have you been playing guitar? I started about five years ago. It's very relaxing. Do you play any sports? Yes, I play tennis twice a week. It's great exercise and I've met many friends through the tennis club. I also like cooking on weekends. What's your favorite dish to cook? I love making pasta with fresh ingredients from the local market.

Practice talking about hobbies, interests, and leisure activities.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "hobby",
        difficulty: "intermediate",
        tags: ["hobbies", "sports", "leisure"]
    },
    {
        title: "Healthcare and Appointments",
        content: {
            original: `Hello, I'd like to make an appointment with Dr. Smith. What seems to be the problem? I've been having headaches for the past week. I can schedule you for tomorrow at 2 PM. Is that convenient? Yes, that works perfectly. Please bring your insurance card and arrive 15 minutes early. Should I prepare anything else? Just a list of any medications you're currently taking. Thank you. I'll see you tomorrow at 2 PM.

Learn vocabulary and phrases for healthcare situations and medical appointments.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "other",
        difficulty: "intermediate",
        tags: ["health", "appointments", "medical"]
    },
    {
        title: "Weather and Seasons",
        content: {
            original: `What's the weather like today? It's sunny and warm, about 25 degrees. Perfect weather for a picnic! Yes, I love spring weather. The flowers are blooming and everything looks so green. What's your favorite season? I prefer autumn because I enjoy the cooler temperatures and beautiful colored leaves. Winter can be beautiful too, especially when it snows. Summer is great for swimming and outdoor activities. Each season has its own charm and special activities.

Discuss weather, seasons, and related activities.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "daily",
        difficulty: "beginner",
        tags: ["weather", "seasons", "nature"]
    },
    {
        title: "Technology and Communication",
        content: {
            original: `How do you usually communicate with your friends? I mostly use messaging apps and social media. Sometimes I make video calls with family who live far away. Technology has made it so easy to stay in touch with people. Do you prefer texting or calling? It depends on the situation. For quick questions, I text. For important conversations, I prefer calling. Email is still useful for work and formal communication. What about you? Do you use any particular apps? I like using video chat because you can see facial expressions and body language.

Explore modern communication methods and technology vocabulary.`,
            translated: ""
        },
        languages: {
            source: "en",
            target: "es"
        },
        category: "other",
        difficulty: "intermediate",
        tags: ["technology", "communication", "modern"]
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