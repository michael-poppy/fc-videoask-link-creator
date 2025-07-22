# FC VideoAsk Link Creator

A simple web application for Poppy floral consultants to generate personalized poppy.click URLs for their leads.

## Features

- **Simple Interface**: Select consultant name and enter customer email
- **Automatic Event ID Lookup**: Queries Poppy Customer API to find event ID
- **Branded Short URLs**: Creates poppy.click URLs via Linkly API
- **Link History**: Tracks recent links (stored locally)
- **Mobile Friendly**: Works on any device
- **Manual Override**: Option to manually enter event ID if lookup fails

## Setup

1. Install dependencies:
```bash
cd consultant-scheduler
npm install
```

2. The `.env` file is already configured with API keys.

3. Start the server:
```bash
npm start
```

4. Open your browser to: http://localhost:3000

## Usage

1. **Select Your Name**: Choose from the dropdown of floral consultants
2. **Enter Customer Email**: Type the customer's email address
3. **Click Generate Link**: The system will:
   - Look up the event ID from the email
   - Generate a VideoAsk URL with the event ID
   - Shorten it to a poppy.click URL
   - Display the result for copying

## API Endpoints

- `GET /api/customer/:email` - Look up event ID by customer email
- `POST /api/shorten` - Create shortened poppy.click URL
- `GET /api/health` - Health check endpoint

## Consultants

The system includes all 11 Poppy floral consultants:
- Adrienne, Hannah P, Mary, Cortnie, Jennifer
- Sahra, Kelli, Wendi, Alicia, Sophia, Michelle

## Deployment

For production deployment:
1. Update CORS settings in `api-server.js`
2. Set up proper environment variables
3. Deploy to your preferred hosting service
4. Update API URLs in frontend if needed

## Support

For issues or questions, contact the Poppy tech team.