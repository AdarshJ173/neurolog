import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Sidebar from './components/Sidebar'; 
import LogIntelDashboard from './pages/LogIntelDashboard';
// import VectorAnalysis from './pages/VectorAnalysis';
import LogExplorer from './pages/LogExplorer';
import Configuration from './pages/Configuration';
import AIAssistant from './pages/AIAssistant';
import Login from './pages/Login'; // NEW

import { ThemeProvider } from './context/ThemeContext';

const AppLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null; // Or a glowing brain loading screen!

  // If no user is logged in, show ONLY the Login page
  if (!user) {
    return <Login />;
  }

  // If logged in, show the actual app
  return (
    <Router>
      <div className="animate-in" style={{ minHeight: '100vh', display: 'flex' }}>
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
        <div className="main-content" style={{ marginLeft: isSidebarCollapsed ? '64px' : '250px', padding: '40px 60px', transition: 'margin-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<LogIntelDashboard />} />
              {/* <Route path="/analysis" element={<VectorAnalysis />} /> */}
              <Route path="/explorer" element={<LogExplorer />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/configuration" element={<Configuration />} />
            </Routes>
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