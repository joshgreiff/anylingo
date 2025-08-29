module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Route handling
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (pathname === '/api/health') {
    res.json({ 
      status: 'OK', 
      message: 'AnyLingo API is running',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (pathname === '/api/test') {
    res.json({ 
      status: 'OK', 
      message: 'Test endpoint working'
    });
    return;
  }
  
  if (pathname === '/api/subscriptions/plans') {
    res.json({
      plans: [
        {
          id: 'monthly',
          name: 'AnyLingo Monthly',
          price: 2.99,
          period: 'monthly',
          description: 'Monthly subscription to AnyLingo'
        },
        {
          id: 'annual',
          name: 'AnyLingo Annual',
          price: 24.99,
          period: 'annual',
          description: 'Annual subscription to AnyLingo (Save 30%)'
        }
      ]
    });
    return;
  }
  
  // Default response
  res.status(404).json({ error: 'Route not found' });
}; 