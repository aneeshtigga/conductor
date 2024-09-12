const cors = require('cors');
const { createCorsMiddleware } = require('netlify-cors');

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

exports.handler = async function(event, context) {
  try {
    const corsHandler = createCorsMiddleware();
    const headers = corsHandler(event.headers);

    if (event.httpMethod === 'POST') {
      const { dataset, description } = JSON.parse(event.body);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          tableHeaders: sampleTableHeaders,
          tableData: sampleTableData,
          graphData: sampleGraphData,
          query
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
