// netlify/functions/analyze.js

const { json } = require('micro');
const { send } = require('micro');

// Sample data
const sampleTableData = [
  { id: 1, product: 'Widget A', sales: 120 },
  { id: 2, product: 'Widget B', sales: 150 },
  { id: 3, product: 'Widget C', sales: 200 }
];

const sampleTableHeaders = ['ID', 'Product', 'Sales'];

const sampleGraphData = {
  labels: ['January', 'February', 'March'], // Graph labels
  data: [30, 70, 100]                      // Graph data
};

const query = `SELECT * FROM sample WHERE description = 'filter'`;

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://aiconductor.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Respond to preflight requests
    return send(res, 200);
  }

  if (req.method === 'POST') {
    try {
      const { dataset, description } = await json(req);
      // Return dynamic data
      send(res, 200, {
        tableHeaders: sampleTableHeaders,
        tableData: sampleTableData,
        graphData: sampleGraphData,
        query
      });
    } catch (error) {
      send(res, 500, { message: 'Internal Server Error' });
    }
  } else {
    send(res, 405, { message: 'Method Not Allowed' });
  }
};
