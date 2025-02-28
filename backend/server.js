// Import required packages
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002; // Changed port to 3002

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Create a proxy endpoint for Claude API
app.post('/api/claude', async (req, res) => {
  try {
    // Get the Claude API key from environment variables
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Missing API key. Please add your key to the .env file.' 
      });
    }

    // Forward the request to Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // Return Claude's response
    return res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to Claude API:', error.response?.data || error.message);
    
    // Return error information
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: error.message }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend proxy server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Claude API proxy available at http://localhost:${PORT}/api/claude`);
});