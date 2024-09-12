import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import logo from './stars.svg';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Register components needed for the chart
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [analyticsDesc, setAnalyticsDesc] = useState('');
  const [tableHeaders, setTableHeaders] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [graphLabels, setGraphLabels] = useState([]);
  const [graphDataset, setGraphDataset] = useState([]);
  const [query, setQuery] = useState('');

  // Fetch datasets dynamically
  useEffect(() => {
    axios.get('http://localhost:4000/api/datasets')
      .then(response => setDatasets(response.data))
      .catch(error => console.error('Error fetching datasets:', error));
  }, []);

  // Handle form submission
  const handleSubmit = () => {
    axios.post('http://localhost:4000/api/analyze', {
      dataset: selectedDataset,
      description: analyticsDesc
    })
    .then(response => {
      setTableHeaders(response.data.tableHeaders);
      setTableData(response.data.tableData);
      setGraphLabels(response.data.graphData.labels);
      setGraphDataset(response.data.graphData.data);
      setQuery(response.data.query);
    })
    .catch(error => console.error('Error analyzing data:', error));
  };

  // Convert table data to CSV format and trigger download
  const downloadTableAsCSV = () => {
    const header = tableHeaders.join(',');
    const rows = tableData.map(row => tableHeaders.map(header => row[header.toLowerCase()]).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'table_data.csv');
    document.body.appendChild(link);
    link.click();
  };

  // Convert graph to image and download
  const downloadGraphAsImage = () => {
    html2canvas(document.querySelector('.chart-container')).then(canvas => {
      canvas.toBlob(blob => {
        saveAs(blob, 'graph.png');
      });
    });
  };

  // Copy query to clipboard
  const copyQueryToClipboard = () => {
    navigator.clipboard.writeText(query)
      .then(() => alert('Query copied to clipboard!'))
      .catch(err => console.error('Failed to copy query: ', err));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-center items-center mb-6">
        <img src={logo} alt="App Logo" className="h-10 w-10" />
        <h1 className="text-3xl font-bold">Conductor</h1>
      </div>

      {/* Dataset Dropdown */}
      <div className="flex justify-center mb-4">
        <select
          value={selectedDataset}
          onChange={e => setSelectedDataset(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-64"
        >
          <option value="">Select a Dataset</option>
          {datasets.map(dataset => (
            <option key={dataset.id} value={dataset.name}>{dataset.name}</option>
          ))}
        </select>
      </div>

      {/* Analytics Description Input */}
      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Enter analytics description"
          value={analyticsDesc}
          onChange={e => setAnalyticsDesc(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-64"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
        >
          Submit
        </button>
      </div>

      {/* Table Data Display */}
      <div className="overflow-x-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Table Data</h2>
          <i
            className="fas fa-download text-gray-600 cursor-pointer"
            onClick={downloadTableAsCSV}
            title="Download Table as CSV"
          />
        </div>
        <table className="min-w-full bg-white border border-gray-300 rounded-md">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              {tableHeaders.map((header, index) => (
                <th key={index} className="py-2 px-4 border-b">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="text-center">
                {Object.values(row).map((value, colIndex) => (
                  <td key={colIndex} className="py-2 px-4 border-b">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Layout for Query Box and Graph Data */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Query Display */}
        {query && (
          <div className="flex-1 max-h-[calc(100vh-400px)] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">SQL Query</h2>
              <i
                className="fas fa-copy text-gray-600 cursor-pointer"
                onClick={copyQueryToClipboard}
                title="Copy Query to Clipboard"
              />
            </div>
            <pre className="bg-gray-100 p-4 rounded-md border border-gray-300 overflow-x-auto">
              {query}
            </pre>
          </div>
        )}

        {/* Graph Data Display */}
        <div className="flex-1 max-h-[calc(100vh-400px)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Graph Data</h2>
            <i
              className="fas fa-download text-gray-600 cursor-pointer"
              onClick={downloadGraphAsImage}
              title="Download Graph as PNG"
            />
          </div>
          <div className="chart-container h-96 max-h-full">
            {graphLabels.length > 0 && graphDataset.length > 0 && (
              <Line
                data={{
                  labels: graphLabels,
                  datasets: [{
                    label: 'Sample Data',
                    data: graphDataset,
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
