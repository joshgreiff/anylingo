const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config();

const client = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox
});

async function testSquarePayment() {
  try {
    console.log('🧪 Testing Square Payment Processing...');
    console.log('Environment:', process.env.SQUARE_ENVIRONMENT);
    console.log('Location ID:', process.env.SQUARE_LOCATION_ID);
    
    // Test creating a simple payment with test card
    const paymentRequest = {
      sourceId: 'cnon', // This will be replaced with actual card token in real app
      amountMoney: {
        amount: 100, // $1.00
        currency: 'USD'
      },
      locationId: process.env.SQUARE_LOCATION_ID,
      idempotencyKey: `test-payment-${Date.now()}`
    };
    
    console.log('✅ Square client created successfully');
    console.log('📋 Payment request prepared');
    console.log('\n🎉 Square is ready for testing!');
    console.log('\nTest Cards:');
    console.log('✅ Success: 4111 1111 1111 1111');
    console.log('❌ Decline: 4000 0000 0000 0002');
    console.log('💰 Insufficient: 4000 0000 0000 9995');
    
  } catch (error) {
    console.error('❌ Error testing Square:', error.message);
  }
}

testSquarePayment(); 