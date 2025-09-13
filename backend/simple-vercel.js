module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.url === '/api/health') {
    res.json({ 
      status: 'OK', 
      message: 'AnyLingo API is running',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (req.url === '/api/test') {
    res.json({ 
      status: 'OK', 
      message: 'Test endpoint working'
    });
    return;
  }
  
  res.status(404).json({ error: 'Route not found' });
}; 