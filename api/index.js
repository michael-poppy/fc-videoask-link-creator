const axios = require('axios');

// Health check endpoint
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Route handling
  if (pathname === '/api/health') {
    res.json({ status: 'healthy', service: 'consultant-scheduler-api' });
  } else if (pathname === '/api/test-env') {
    res.json({
      hasLinklyKey: !!process.env.LINKLY_API_KEY,
      linklyKeyLength: process.env.LINKLY_API_KEY ? process.env.LINKLY_API_KEY.length : 0,
      linklyKeyStart: process.env.LINKLY_API_KEY ? process.env.LINKLY_API_KEY.substring(0, 5) + '...' : 'NOT SET',
      hasLinklyUrl: !!process.env.LINKLY_API_URL,
      linklyUrl: process.env.LINKLY_API_URL || 'NOT SET'
    });
  } else if (pathname.startsWith('/api/customer/')) {
    await handleCustomerLookup(req, res);
  } else if (pathname === '/api/shorten') {
    await handleUrlShorten(req, res);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};

async function handleCustomerLookup(req, res) {
  const email = req.url.split('/api/customer/')[1];
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const apiUrl = `${process.env.POPPY_API_URL}/customers/getByEmail?emailAddress=${encodeURIComponent(email)}`;
    
    const response = await axios.get(apiUrl);

    // Handle API response wrapper
    let customerData;
    if (response.data && response.data.data) {
      customerData = response.data.data;
    } else if (Array.isArray(response.data)) {
      customerData = response.data[0];
    } else {
      customerData = response.data;
    }

    if (customerData && customerData.events && customerData.events.length > 0) {
      const event = customerData.events[0];
      res.json({
        success: true,
        eventId: event.id.toString(),
        customerName: customerData.name || customerData.customerName || null,
        data: customerData
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'No event found for this email' 
      });
    }
  } catch (error) {
    console.error('Error fetching customer data:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer data',
      details: error.message
    });
  }
}

async function handleUrlShorten(req, res) {
  // Parse body for Vercel serverless
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  }
  
  const { url, title } = body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const linklyData = {
      email: 'michael@poppyflowers.com',
      api_key: process.env.LINKLY_API_KEY,
      workspace_id: 279614,
      url: url,
      name: title || 'Poppy Floral Consultation',
      domain: 'poppy.click'
    };
    
    
    const response = await axios.post(
      process.env.LINKLY_API_URL,
      linklyData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.full_url) {
      res.json({
        success: true,
        shortUrl: response.data.full_url,
        originalUrl: url,
        linklyId: response.data.id
      });
    } else {
      throw new Error('Invalid response from Linkly API');
    }
  } catch (error) {
    console.error('Error shortening URL:', error.message);
    
    res.json({
      success: false,
      shortUrl: url,
      originalUrl: url,
      error: 'URL shortening failed, using original URL'
    });
  }
}