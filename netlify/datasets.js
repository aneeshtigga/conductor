const cors = require('cors');
const { createCorsMiddleware } = require('netlify-cors');

const datasets = [
  { id: 1, name: 'Sales Data' },
  { id: 2, name: 'Customer Feedback' },
  { id: 3, name: 'Product Inventory' }
];

exports.handler = async function(event, context) {
  try {
    const corsHandler = createCorsMiddleware();
    const headers = corsHandler(event.headers);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(datasets)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
