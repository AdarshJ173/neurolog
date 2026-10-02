import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Search, Filter, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { auth } from '../firebase';

const LogExplorer = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severity, setSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const user = auth?.currentUser;

  // Fetch the live logs from MongoDB
  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      try {
        // Fetch a larger chunk for the explorer (e.g., limit 50 or 100 in your backend if you updated it)
        const res = await axios.get(`/recent-logs`);
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // Refresh every 5 seconds to keep the explorer updated
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Filter logs based on search bar
  const filteredLogs = logs.filter(log =>
    (severity === 'all' || (severity === 'errors' ? log.severity_level <= 3 : log.severity_level >= 4)) && (log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSeverityIcon = (level) => {
    if (level <= 2) return <ShieldAlert color="#ef4444" size={16} />; // CRITICAL
    if (level === 3) return <AlertTriangle color="#f59e0b" size={16} />; // WARNING
    return <Info color="#3b82f6" size={16} />; // INFO/DEBUG
  };

  const getSeverityColor = (level) => {
    if (level <= 2) return '#ef4444';
    if (level === 3) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div className="animate-in" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Log Explorer</h1>
        <p style={{ color: 'var(--text-muted)' }}>Search and filter raw telemetry data across all connected services.</p>
      </header>

      {/* SEARCH AND FILTER BAR */}
      <div className="glass-panel" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px' }} />
          <input
            aria-label="Search logs" type="text"
            placeholder="Search logs by message or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
          />
        </div>
        <select aria-label="Filter severity" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="all">All severities</option><option value="errors">Errors / critical</option><option value="routine">Warnings / routine</option>
        </select>
      </div>

      {/* LOG TABLE */}
      <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="log-row" style={{ display: 'grid', gridTemplateColumns: '150px 150px 1fr', padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <div>TIMESTAMP</div>
          <div>SOURCE</div>
          <div>MESSAGE</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live streams...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No logs match your search.</div>
          ) : (
            filteredLogs.map((log) => (
              <div className="log-row" key={log._id} style={{
                display: 'grid', gridTemplateColumns: '150px 150px 1fr', padding: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', fontSize: '0.85rem',
                borderLeft: `3px solid ${getSeverityColor(log.severity_level)}`
              }}>
                <div style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                  {getSeverityIcon(log.severity_level)} {log.source}
                </div>
                <div style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogExplorer;
