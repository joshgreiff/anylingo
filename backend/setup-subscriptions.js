const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config();

const client = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox
});

async function setupSubscriptions() {
  try {
    console.log('Testing Square connection...');
    console.log('Access Token:', process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('Location ID:', process.env.SQUARE_LOCATION_ID ? '✅ Set' : '❌ Missing');
    console.log('Environment:', process.env.SQUARE_ENVIRONMENT);
    
    // Test basic connection by listing locations
    const locationsResponse = await client.locations.list();
    console.log('✅ Square connection successful!');
    console.log('Available locations:', locationsResponse.result.locations?.length || 0);
    
    // For now, let's just test the connection
    // We'll create subscription plans through the web interface or API later
    console.log('\n🎉 Square sandbox is connected and ready!');
    console.log('\nTest with these cards:');
    console.log('✅ Success: 4111 1111 1111 1111');
    console.log('❌ Decline: 4000 0000 0000 0002');
    console.log('💰 Insufficient: 4000 0000 0000 9995');
    
  } catch (error) {
    console.error('❌ Error connecting to Square:', error.message);
    if (error.result && error.result.errors) {
      console.error('Square errors:', error.result.errors);
    }
  }
}

setupSubscriptions(); 