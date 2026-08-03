import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  BarController, // Import BarController
  ScatterController,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import html2canvas from 'html2canvas';
import logo from './stars.svg';
import { saveAs } from 'file-saver';
import { API_URL } from './config';
import './index.css';
import './responsive.css';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  BarController, // Register BarController
  ScatterController,
  Title, 
  Tooltip, 
  Legend
);

function App() {
  const [datasets, setDatasets] = useState({ database: [], s3: [], kafka: [] });
  const [activeDatasetType, setActiveDatasetType] = useState('database'); // State to toggle dataset type
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [analyticsDesc, setAnalyticsDesc] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastQuery, setLastQuery] = useState('');
  const [tableHeaders, setTableHeaders] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isLoading, setIsLoading] = useState(false); // Add this line
  const [error, setError] = useState(null); // user-facing error message
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropicKey') || ''); // BYOK

  const lastMessageRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/datasets`)
      .then(response => setDatasets(response.data))
      .catch(err => {
        console.error('Error fetching datasets:', err);
        setError("Couldn't load datasets. The service may be starting up — please refresh in a moment.");
      });
  }, []);

  const toggleDataset = (dataset) => {
    const datasetString = `${dataset.type}: ${dataset.name}`;
    if (selectedDatasets.includes(datasetString)) {
      setSelectedDatasets(selectedDatasets.filter(d => d !== datasetString));
    } else {
      setSelectedDatasets([...selectedDatasets, datasetString]);
    }
  };

  const handleSubmit = () => {
    if (!analyticsDesc) {
      setError('Please type a question before submitting.');
      return;
    }

    setError(null);
    setIsLoading(true); // Set loading state to true before API call
  
    axios.post(`${API_URL}/api/analyze`, {
      dataset: selectedDatasets,
      question: analyticsDesc,
      original_query: lastQuery
    }, {
      headers: apiKey ? { 'x-anthropic-api-key': apiKey } : {}
    })
    .then(response => {
      const newMessage = {
        description: analyticsDesc,
        datasets: selectedDatasets,
        query: response.data.query,
        nlresponse: response.data.answer_text,
        tableHeaders: response.data.tableHeaders,
        tableData: JSON.parse(response.data.tableData.replace(/[\n\r]/g, '')),
        graphLabels: JSON.parse(response.data.graphData.replace(/[\n\\]/g, '')).labels,
        graphDataset: JSON.parse(response.data.graphData.replace(/[\n\\]/g, '')).datasets
      };
      setMessages([...messages, newMessage]);
      setTableHeaders(response.data.tableHeaders);
      setTableData(newMessage.tableData);
      setAnalyticsDesc('');
      setLastQuery(response.data.query);
  
      setTimeout(() => {
        if (lastMessageRef.current) {
          lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    })
    .catch(err => {
      console.error('Error analyzing data:', err);
      const apiMsg = err?.response?.data?.error;
      setError(
        apiMsg
          ? `That question couldn't be answered: ${apiMsg}. Try rephrasing it or picking different datasets.`
          : "Something went wrong while analysing. Please try again in a moment."
      );
    })
    .finally(() => setIsLoading(false)); // Reset loading state after API call
  };


  const downloadTableAsCSV = () => {
    const header = tableHeaders.join(',');
    const rows = tableData.map(row => tableHeaders.map(header => row[header]).join(',')).join('\n'); // Add \n to join rows
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'table_data.csv');
    document.body.appendChild(link);
    link.click();
  };

  const downloadGraphAsImage = () => {
    html2canvas(document.querySelector('.chart-container')).then(canvas => {
      canvas.toBlob(blob => {
        saveAs(blob, 'graph.png');
      });
    });
  };

  const copyQueryToClipboard = () => {
    navigator.clipboard.writeText(lastQuery)
      .then(() => alert('Query copied to clipboard!'))
      .catch(err => console.error('Failed to copy query: ', err));
  };

  const filteredDatasets = datasets[activeDatasetType].filter(dataset =>
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className={`app-sidebar h-screen bg-white text-black p-4 shadow-md overflow-y-auto fixed ${sidebarOpen ? 'open' : ''}`}
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center mb-4">
          <h2 className="text-1xl font-bold">Datasets</h2>
          <div className="tabs flex ml-auto text-sm">
            <button
              className={`mr-2 py-1 px-3 rounded ${activeDatasetType === 'database' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveDatasetType('database')}
            >
              Database
            </button>
            <button
              className={`mr-2 py-1 px-3 rounded ${activeDatasetType === 's3' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveDatasetType('s3')}
            >
              S3
            </button>
            <button
              className={`py-1 px-3 rounded ${activeDatasetType === 'kafka' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveDatasetType('kafka')}
            >
              Kafka
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by Name"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full mb-4"
        />
        <div className="mb-4 border border-gray-200 rounded-md p-3 bg-gray-50">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Anthropic API key
          </label>
          <input
            type="password"
            placeholder="sk-ant-... (stored in your browser only)"
            value={apiKey}
            onChange={e => {
              setApiKey(e.target.value);
              localStorage.setItem('anthropicKey', e.target.value);
            }}
            className="border border-gray-300 rounded-md p-2 w-full text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Sent only with your requests; never stored on the server. Leave blank if the server has a key.
          </p>
        </div>

        <ul>
          {filteredDatasets.map(dataset => (
            <li
              key={dataset.id}
              className={`p-2 mb-2 cursor-pointer rounded-md select-none ${selectedDatasets.includes(`${dataset.type}: ${dataset.name}`) ? 'bg-blue-800 text-white' : 'bg-white hover:bg-blue-200'}`}
              onClick={() => toggleDataset(dataset)}
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {`${dataset.name}`}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="app-resizer resizer bg-gray-300 custom-resize h-screen fixed select-none"
        onMouseDown={startResizing}
        style={{ width: '5px', marginLeft: sidebarWidth }}
      ></div>

      <div className="app-main flex-1 overflow-auto" style={{ marginLeft: `${sidebarWidth + 5}px` }}>
        <button
          className="mobile-toggle fixed top-3 left-3 z-50 bg-blue-800 text-white rounded-md p-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle datasets panel"
        >
          <i className={`fas ${sidebarOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>

        <div className="flex justify-center items-center mb-6 mt-6">
          <img src={logo} alt="App Logo" className="h-8 w-8 mr-4" />
          <h1 className="text-3xl font-bold text-blue-800">Data Insights</h1>
        </div>

        {error && (
          <div className="chat-pad mb-6 flex items-start justify-between bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700" aria-label="Dismiss">
              <i className="fas fa-xmark" />
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading && !error && (
          <div className="chat-pad text-center text-gray-500 mt-20">
            <i className="fas fa-chart-line text-4xl mb-4 text-blue-200" />
            <p className="text-lg">Select datasets, then ask a question in plain English.</p>
            <p className="text-sm mt-2">e.g. "What were the top 5 products by revenue?"</p>
          </div>
        )}

        <div className="chat-messages chat-pad space-y-10 pb-32">
          {messages.map((message, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-6" ref={index === messages.length - 1 ? lastMessageRef : null}>
              <div className="mb-2">
                <h3 className="text-lg font-semibold">Prompt</h3>
                <p>{message.description || 'N/A'}</p>
              </div>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {message.datasets.length ? message.datasets.map((dataset, i) => (
                    <span key={i} className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {dataset}
                    </span>
                  )) : 'Datasets not selected'}
                </div>
              </div>
              <div className="mb-2">
                <p>{message.nlresponse}</p>              
              </div>

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
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
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
                      {isFullScreen ? <i className="fa-solid fa-compress" title="Collapse" /> : <i className="fa-solid fa-expand" title="Fullscreen" />}
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

        <div className="app-input-container input-container flex justify-center fixed bottom-0 left-0px bg-white p-4 border-t border-gray-300" style={{ width: `calc(100vw - ${sidebarWidth + 5}px)` }}>
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
            disabled={isLoading} // Disable input while loading
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-800 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md ml-2"
            disabled={isLoading} // Disable button while loading
          >
            {isLoading && <span className="loader"></span>}
            Submit
          </button>
          {isLoading && <div className="loading-overlay">Loading...</div>}
        </div>
      </div>
    </div>
  );
}

export default App;