module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({
    hasLinklyKey: !!process.env.LINKLY_API_KEY,
    linklyKeyLength: process.env.LINKLY_API_KEY ? process.env.LINKLY_API_KEY.length : 0,
    linklyKeyStart: process.env.LINKLY_API_KEY ? process.env.LINKLY_API_KEY.substring(0, 5) + '...' : 'NOT SET',
    hasLinklyUrl: !!process.env.LINKLY_API_URL,
    linklyUrl: process.env.LINKLY_API_URL || 'NOT SET'
  });
};