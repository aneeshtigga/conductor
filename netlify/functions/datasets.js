// netlify/functions/datasets.js

const { send } = require('micro');

// Sample datasets
const datasets = [
  { id: 1, name: 'Sales Data' },
  { id: 2, name: 'Customer Feedback' },
  { id: 3, name: 'Product Inventory' }
];

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://aiconductor.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Respond to preflight requests
    return send(res, 200);
  }

  if (req.method === 'GET') {
    try {
      // Return datasets
      send(res, 200, datasets);
    } catch (error) {
      send(res, 500, { message: 'Internal Server Error' });
    }
  } else {
    send(res, 405, { message: 'Method Not Allowed' });
  }
};
