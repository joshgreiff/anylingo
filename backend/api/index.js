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
  
  // Health check
  if (pathname === '/api/health') {
    res.json({ 
      status: 'OK', 
      message: 'AnyLingo API is running',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Test endpoint
  if (pathname === '/api/test') {
    res.json({ 
      status: 'OK', 
      message: 'Test endpoint working'
    });
    return;
  }
  
  // Subscription plans
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
  
  // Promo code validation
  if (pathname === '/api/subscriptions/validate-promo' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { promoCode } = JSON.parse(body);
        
        const PROMO_CODES = {
          'TESTING2025': {
            type: 'lifetime',
            description: 'Free lifetime access for testing',
            valid: true
          },
          'FOUNDER2025': {
            type: 'lifetime', 
            description: 'Founder access',
            valid: true
          }
        };
        
        if (!promoCode) {
          res.status(400).json({ error: 'Promo code is required' });
          return;
        }

        const code = PROMO_CODES[promoCode.toUpperCase()];
        
        if (!code || !code.valid) {
          res.status(400).json({ error: 'Invalid promo code' });
          return;
        }

        res.json({
          valid: true,
          type: code.type,
          description: code.description
        });
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }
  
  // User registration
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { firstName, lastName, email, password, preferences } = JSON.parse(body);
        
        // Basic validation
        if (!firstName || !lastName || !email || !password) {
          res.status(400).json({ error: 'All fields are required' });
          return;
        }
        
        if (password.length < 8) {
          res.status(400).json({ error: 'Password must be at least 8 characters' });
          return;
        }
        
        // Mock successful registration
        const mockUser = {
          id: 'user_' + Date.now(),
          firstName,
          lastName,
          email,
          preferences,
          subscription: {
            status: 'free',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        };
        
        // Mock JWT token
        const mockToken = 'mock_jwt_token_' + Date.now();
        
        res.json({
          message: 'User registered successfully',
          user: mockUser,
          token: mockToken
        });
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }
  
  // Get current user (auth/me)
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const token = authHeader.substring(7);
    
    // For now, accept any mock token
    if (token.startsWith('mock_jwt_token_')) {
      // Mock user data
      const mockUser = {
        id: 'user_123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subscription: {
          status: 'lifetime',
          startDate: new Date(),
          endDate: null
        }
      };
      
      res.json({
        user: mockUser,
        message: 'User authenticated successfully'
      });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
    return;
  }
  
  // Apply promo code
  if (pathname === '/api/subscriptions/apply-promo' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { promoCode } = JSON.parse(body);
        
        const PROMO_CODES = {
          'TESTING2025': {
            type: 'lifetime',
            description: 'Free lifetime access for testing',
            valid: true
          },
          'FOUNDER2025': {
            type: 'lifetime', 
            description: 'Founder access',
            valid: true
          }
        };
        
        if (!promoCode) {
          res.status(400).json({ error: 'Promo code is required' });
          return;
        }

        const code = PROMO_CODES[promoCode.toUpperCase()];
        
        if (!code || !code.valid) {
          res.status(400).json({ error: 'Invalid promo code' });
          return;
        }

        // Mock subscription update
        const mockSubscription = {
          status: 'lifetime',
          startDate: new Date(),
          endDate: null,
          promoCode: promoCode.toUpperCase(),
          autoRenew: false
        };

        res.json({
          message: 'Promo code applied successfully',
          subscription: mockSubscription,
          type: code.type,
          description: code.description
        });
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }
  
  // Default response
  res.status(404).json({ error: 'Route not found' });
}; 