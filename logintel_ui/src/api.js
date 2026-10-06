import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 35000 });
let applicationSource='';
export function selectApplication(source){applicationSource=source;}
export function selectedApplication(){return applicationSource;}
const scopedPaths=['/recent-logs','/patterns','/intelligence','/vector-space','/run-ml','/chat','/alert-rules'];
api.interceptors.request.use(config=>{if(applicationSource&&scopedPaths.some(p=>config.url.split('?')[0]===p||config.url.startsWith(p+'/'))){config.params={...config.params,source:applicationSource};}return config;});
api.interceptors.response.use(response => response, error => {
  window.dispatchEvent(new CustomEvent('neurolog-error', {
    detail: error.response?.data?.error || 'Backend unavailable. Start the Python API on port 5001.',
  }));
  return Promise.reject(error);
});
export default api;
