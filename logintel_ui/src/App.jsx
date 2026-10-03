import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';

import Sidebar from './components/Sidebar';
const LogIntelDashboard = lazy(() => import('./pages/LogIntelDashboard'));
const VectorAnalysis = lazy(() => import("./pages/VectorAnalysis"));
// import VectorAnalysis from './pages/VectorAnalysis';
const LogExplorer = lazy(() => import('./pages/LogExplorer'));
const Configuration = lazy(() => import('./pages/Configuration'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

import { ThemeProvider } from './context/ThemeContext';

const AppLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const listener = event => setError(event.detail);
    window.addEventListener('neurolog-error', listener);
    return () => window.removeEventListener('neurolog-error', listener);
  }, []);
  const action = async path => {
    setBusy(true);
    setError('');
    try { const result = await api.post(path); setNotice(result.data.status); }
    catch { /* The API client displays the error. */ }
    finally { setBusy(false); }
  };
  return (
    <Router>
      <div className="animate-in" style={{ minHeight: '100vh', display: 'flex' }}>
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
        <div className="main-content" style={{ marginLeft: isSidebarCollapsed ? '64px' : '250px', padding: '40px 60px', transition: 'margin-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', minHeight: '100vh', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <div className="stream-toolbar glass-panel">
              <span>Live Log Monitoring</span>
              <a href="http://127.0.0.1:8000" target="_blank" rel="noopener noreferrer">Open Python application</a>
              <button disabled={busy} onClick={() => action('/run-ml')}>Run clustering</button>
            </div>
            {error && <div role="alert" className="status-message">{error} <button onClick={() => setError('')}>Dismiss</button></div>}
            {notice && <p role="status">{notice}</p>}
            <Suspense fallback={<p role="status">Loading page…</p>}><Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<LogIntelDashboard />} />
              <Route path="/analysis" element={<VectorAnalysis />} />
              <Route path="/explorer" element={<LogExplorer />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/configuration" element={<Configuration />} />
            </Routes></Suspense>
          </div>
        </div>
      </div>
    </Router>
  );
};

const App = () => (
  <ThemeProvider>
    <AppLayout />
  </ThemeProvider>
);

export default App;
