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
] 
const Lesson = require('./src/models/Lesson');

async function createDefaultLessonsForUser(userId, targetLanguage = 'es') {
    try {
        console.log(`Creating default lessons for user ${userId} with target language ${targetLanguage}`);
        
        // Filter lessons by target language or create all if language matches
        const lessonsToCreate = defaultLessons.filter(lesson => 
            lesson.languages.target === targetLanguage
        );

        // If no lessons match the target language, create the first one anyway
        const lessons = lessonsToCreate.length > 0 ? lessonsToCreate : [defaultLessons[0]];

        // Create lessons with user ID
        const createdLessons = await Promise.all(
            lessons.map((lessonTemplate, index) => {
                const lesson = new Lesson({
                    user: userId,
                    title: lessonTemplate.title,
                    content: lessonTemplate.content,
                    languages: lessonTemplate.languages,
                    category: lessonTemplate.category,
                    difficulty: lessonTemplate.difficulty,
                    tags: lessonTemplate.tags,
                    order: index
                });
                return lesson.save();
            })
        );

        console.log(`Successfully created ${createdLessons.length} default lessons for user ${userId}`);
        return createdLessons;
    } catch (error) {
        console.error('Error creating default lessons:', error);
        throw error;
    }
}

module.exports = {
    defaultLessons,
    createDefaultLessonsForUser
};
