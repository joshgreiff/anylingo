const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('🔌 Testing MongoDB connection...');
        
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI not found in environment variables');
            console.log('💡 Add your MongoDB connection string to .env file');
            return;
        }

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Successfully connected to MongoDB!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('🔢 Port:', mongoose.connection.port);

        // Test creating a simple document
        const TestModel = mongoose.model('Test', new mongoose.Schema({
            message: String,
            timestamp: { type: Date, default: Date.now }
        }));

        const testDoc = new TestModel({ message: 'AnyLingo connection test' });
        await testDoc.save();
        console.log('✅ Successfully created test document');

        // Clean up
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Successfully cleaned up test document');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        console.log('🎉 Database setup is working perfectly!');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Check your MONGODB_URI in .env file');
        console.log('2. Verify your IP is whitelisted in MongoDB Atlas');
        console.log('3. Check your username/password');
        console.log('4. Ensure your cluster is running');
    }
}

testConnection(); 