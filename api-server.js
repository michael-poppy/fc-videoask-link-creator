const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'consultant-scheduler-api' });
});

// Debug endpoint
app.get('/api/debug-linkly', (req, res) => {
  const apiKey = process.env.LINKLY_API_KEY;
  res.json({
    hasKey: !!apiKey,
    keyLength: apiKey?.length,
    firstChars: apiKey?.substring(0, 5),
    lastChars: apiKey?.substring(apiKey.length - 5),
    equals: apiKey === 'G8eEhWiZvnP+6jRKW0PXOw==',
    url: process.env.LINKLY_API_URL
  });
});

// Get customer event ID by email
app.get('/api/customer/:email', async (req, res) => {
  const email = req.params.email;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log(`Looking up customer with email: ${email}`);
    const apiUrl = `${process.env.POPPY_API_URL}/customers/getByEmail?emailAddress=${encodeURIComponent(email)}`;
    console.log(`API URL: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);

    console.log('API Response status:', response.status);
    
    // Handle API response wrapper
    let customerData;
    if (response.data && response.data.data) {
      // API returns {code, message, data}
      customerData = response.data.data;
    } else if (Array.isArray(response.data)) {
      // Response is an array
      customerData = response.data[0];
    } else {
      // Response is the customer object directly
      customerData = response.data;
    }
    
    console.log('Customer data:', JSON.stringify(customerData, null, 2));

    if (customerData && customerData.events && customerData.events.length > 0) {
      // Extract event ID from events array
      const event = customerData.events[0];
      res.json({
        success: true,
        eventId: event.id.toString(),
        customerName: customerData.name || customerData.customerName || null,
        data: customerData
      });
    } else if (customerData && customerData.eventId) {
      res.json({
        success: true,
        eventId: customerData.eventId,
        customerName: customerData.name || customerData.customerName || null,
        data: customerData
      });
    } else if (customerData && customerData.event_id) {
      // Handle different response format
      res.json({
        success: true,
        eventId: customerData.event_id,
        customerName: customerData.customer_name || customerData.name || null,
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
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', error.response.data);
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer data',
      details: error.message,
      apiStatus: error.response?.status
    });
  }
});

// Shorten URL using Linkly
app.post('/api/shorten', async (req, res) => {
  const { url, title } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Shortening URL: ${url}`);
    
    // Linkly API requires specific parameters
    const linklyData = {
      email: 'michael@poppyflowers.com',
      api_key: process.env.LINKLY_API_KEY,
      workspace_id: 279614, // Your Linkly workspace ID
      url: url,
      name: title || 'Poppy Floral Consultation',
      domain: 'poppy.click', // Your custom domain
      // slug is auto-generated if not provided
    };
    
    console.log('Linkly request data:', JSON.stringify(linklyData, null, 2));
    console.log('Environment check:', {
      hasApiKey: !!process.env.LINKLY_API_KEY,
      apiKeyLength: process.env.LINKLY_API_KEY?.length,
      apiUrl: process.env.LINKLY_API_URL
    });
    
    const response = await axios.post(
      process.env.LINKLY_API_URL,
      linklyData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Linkly response:', JSON.stringify(response.data, null, 2));

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
    if (error.response) {
      console.error('Linkly API response status:', error.response.status);
      console.error('Linkly API response:', error.response.data);
    }
    
    // Return original URL as fallback
    res.json({
      success: false,
      shortUrl: url,
      originalUrl: url,
      error: 'URL shortening failed, using original URL',
      errorDetails: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    });
  }
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel
if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Consultant Scheduler API running on http://localhost:${PORT}`);
    console.log('Environment check:');
    console.log('- Poppy API:', process.env.POPPY_API_URL ? '✓' : '✗');
    console.log('- Linkly API:', process.env.LINKLY_API_URL ? '✓' : '✗');
  });
}