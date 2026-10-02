import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 35000 });
api.interceptors.response.use(response => response, error => {
  window.dispatchEvent(new CustomEvent('neurolog-error', {
    detail: error.response?.data?.error || 'Backend unavailable. Start the Python API on port 5001.',
  }));
  return Promise.reject(error);
});
export default api;
