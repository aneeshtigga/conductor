// Central API base URL. Set REACT_APP_API_URL in the environment (Netlify / .env).
// Falls back to localhost for local development.
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
