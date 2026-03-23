import axios from 'axios';

const api = axios.create({
  // Force the absolute URL of the domain to prevent any path resolution bugs on Render
  baseURL: import.meta.env.DEV ? 'http://localhost:8080/api' : `${window.location.origin}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
