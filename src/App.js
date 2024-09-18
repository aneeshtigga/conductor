import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import html2canvas from 'html2canvas';
import logo from './stars.svg';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [analyticsDesc, setAnalyticsDesc] = useState('');
  const [messages, setMessages] = useState([]); // Chat-style messages state
  const [lastQuery, setLastQuery] = useState('');
  const [tableHeaders, setTableHeaders] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  // Fetch datasets dynamically
  useEffect(() => {
    axios.get('http://localhost:4000/api/datasets')
      .then(response => setDatasets(response.data))
      .catch(error => console.error('Error fetching datasets:', error));
  }, []);

  // Toggle dataset selection
  const toggleDataset = (dataset) => {
    if (selectedDatasets.includes(dataset)) {
      setSelectedDatasets(selectedDatasets.filter(d => d !== dataset));
    } else {
      setSelectedDatasets([...selectedDatasets, dataset]);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    axios.post('http://localhost:4000/api/analyze', {
      datasets: selectedDatasets,
      description: analyticsDesc,
      query: lastQuery
    })
    .then(response => {
      // Add a new message to the chat-style UI
      const newMessage = {
        query: response.data.query,
        tableHeaders: response.data.tableHeaders,
        tableData: response.data.tableData,
        graphLabels: response.data.graphData.labels,
        graphDataset: response.data.graphData.datasets
      };
      setMessages([...messages, newMessage]); // Append the new message to the list
      setTableHeaders(response.data.tableHeaders);
      setTableData(response.data.tableData);
      setAnalyticsDesc(''); // Clear the prompt input after submit
      setLastQuery(response.data.query);
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
    navigator.clipboard.writeText(lastQuery)
      .then(() => alert('Query copied to clipboard!'))
      .catch(err => console.error('Failed to copy query: ', err));
  };

  // Filter datasets based on search query
  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers for resizing
  const startResizing = (e) => {
    window.addEventListener('mousemove', resizing);
    window.addEventListener('mouseup', stopResizing);
  };

  const resizing = (e) => {
    setSidebarWidth(e.clientX);
  };

  const stopResizing = (e) => {
    window.removeEventListener('mousemove', resizing);
    window.removeEventListener('mouseup', stopResizing);
  };

  return (
    <div className="flex bg-gray-50 h-screen text-gray-800">
      <div
        className="h-screen bg-white text-black p-4 shadow-md overflow-y-auto fixed"
        style={{ width: sidebarWidth }}
      >
        <h2 className="text-1xl font-bold mb-4">Datasets</h2>
        <input
          type="text"
          placeholder="Search by Name"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full mb-4"
        />
        <ul>
          {filteredDatasets.map(dataset => (
            <li
              key={dataset.id}
              className={`p-2 mb-2 cursor-pointer rounded-md select-none ${selectedDatasets.includes(dataset.name) ? 'bg-blue-200' : 'bg-white hover:bg-blue-100'}`}
              onClick={() => toggleDataset(dataset.name)}
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {dataset.name}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="resizer bg-gray-300 custom-resize h-screen fixed select-none"
        onMouseDown={startResizing}
        style={{ width: '5px', marginLeft: sidebarWidth }}
      ></div>

      <div className="flex-1 p-6 overflow-auto" style={{marginLeft: `${sidebarWidth + 5}px` }}>
        <div className="flex justify-center items-center mb-6">
          <img src={logo} alt="App Logo" className="h-10 w-10 mr-2" />
          <h1 className="text-3xl font-bold text-blue-600">Data Insights</h1>
        </div>

        <div className="chat-messages space-y-4 mb-8">
          {messages.map((message, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-4 mt-4">
                <h3 className="text-lg font-semibold">Graph</h3>
                <i
                  className="fas fa-download text-gray-500 cursor-pointer hover:text-blue-500"
                  onClick={downloadGraphAsImage}
                  title="Download Graph as PNG"
                />
              </div>
              <div className="chart-container h-96">
                {message.graphLabels.length > 0 && message.graphDataset.length > 0 && (
                  <Line
                    data={{
                      labels: message.graphLabels,
                      datasets: message.graphDataset
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                )}
              </div>

              <div className="flex justify-between items-center mb-4 mt-4">
                <h3 className="text-lg font-semibold">Table Data</h3>
                <i
                  className="fas fa-file-export text-gray-500 cursor-pointer hover:text-blue-500"
                  onClick={downloadTableAsCSV}
                  title="Export Table as CSV"
                />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="min-w-full bg-gray-100 border border-gray-300 rounded-md mb-4">
                  <thead className="bg-gray-200 text-gray-600">
                    <tr>
                      {message.tableHeaders.map((header, i) => (
                        <th key={i} className="py-2 px-4 border-b">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.tableData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="text-center">
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="py-2 px-4 border-b">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`flex-1 overflow-y-auto ${isFullScreen ? 'fixed inset-0 bg-white z-50 p-8' : 'max-h-[calc(100vh-400px)]'}`}>
                <div className="flex justify-between items-center mb-4 mt-4">
                  <h3 className="text-lg font-semibold">Query</h3>
                  <div className="flex items-center space-x-2">
                    <i
                      className="fas fa-copy text-gray-500 cursor-pointer hover:text-blue-500"
                      onClick={copyQueryToClipboard}
                      title="Copy Query to Clipboard"
                    />
                    <button
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      className="text-gray-500 underline hover:text-blue-500"
                    >
                      {isFullScreen ? <i className="fa-solid fa-compress" title="Collapse"/> : <i className="fa-solid fa-expand" title="Fullscreen"/>}
                    </button>
                  </div>
                </div>
                <pre className={`bg-gray-100 p-4 rounded-md border border-gray-300 overflow-x-auto overflow-y-auto ${isFullScreen ? 'max-h-100' : 'max-h-96'}`}>
                  {message.query}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="input-container flex justify-center mb-8">
          <input
            type="text"
            placeholder="Enter query and Shift+Enter to submit"
            value={analyticsDesc}
            onChange={e => setAnalyticsDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                handleSubmit();
              }
            }}
            className="border border-gray-300 rounded-md p-2 flex-grow"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md ml-2"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;