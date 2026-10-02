import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, demoMode } from './firebase';
import api from './api';
import { onAuthStateChanged } from 'firebase/auth';

import Sidebar from './components/Sidebar';
const LogIntelDashboard = lazy(() => import('./pages/LogIntelDashboard'));
const VectorAnalysis = lazy(() => import("./pages/VectorAnalysis"));
// import VectorAnalysis from './pages/VectorAnalysis';
const LogExplorer = lazy(() => import('./pages/LogExplorer'));
const Configuration = lazy(() => import('./pages/Configuration'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Login = lazy(() => import('./pages/Login'));  // NEW

import { ThemeProvider } from './context/ThemeContext';

const AppLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(demoMode ? auth.currentUser : null);
  const [loading, setLoading] = useState(!demoMode);

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
  // Listen for Firebase Auth changes
  useEffect(() => {
    if (demoMode || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (!demoMode && !auth) return <p role="alert">Configure Firebase in logintel_ui/.env.local or enable demo mode. See docs/USER_GUIDE.md.</p>;
  if (loading) return <p role="status">Checking sign-in…</p>; // Or a glowing brain loading screen!

  // If no user is logged in, show ONLY the Login page
  if (!user) {
    return <Suspense fallback={<p role="status">Loading sign-in…</p>}><Login /></Suspense>;
  }

  // If logged in, show the actual app
  return (
    <Router>
      <div className="animate-in" style={{ minHeight: '100vh', display: 'flex' }}>
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
        <div className="main-content" style={{ marginLeft: isSidebarCollapsed ? '64px' : '250px', padding: '40px 60px', transition: 'margin-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', minHeight: '100vh', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            {demoMode && <div className="demo-toolbar glass-panel">
              <span>Local demo · sample logs · no automatic remediation</span>
              <button disabled={busy} onClick={() => action('/demo/seed')}>Load sample logs</button>
              <button disabled={busy} onClick={() => action('/run-ml')}>Run clustering</button>
            </div>}
            {!demoMode && <button disabled={busy} onClick={() => action('/run-ml')}>Run clustering</button>}
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
