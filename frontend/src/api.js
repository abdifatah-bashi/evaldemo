import axios from 'axios';

const api = axios.create({
  // Use relative '/api' path when built and served by the Express backend,
  // but use the full localhost URL during local Vite development.
  baseURL: import.meta.env.DEV ? 'http://localhost:8080/api' : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
