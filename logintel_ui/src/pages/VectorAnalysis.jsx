import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Zap } from 'lucide-react';

const VectorAnalysis = () => {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5001/api/anomalies');
        setAnomalies(res.data);
      } catch (err) {
        console.error("Failed to fetch anomalies");
      }
    };
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 2000); // Live updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
            <h1>AI Root Cause Analysis</h1>
            <p className="subtitle">Unsupervised Clustering & Predictive Fixes</p>
        </div>
        <div className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>
            <span className="dot" style={{ background: '#10b981' }}></span> AI ENGINE ACTIVE
        </div>
      </header>

      {anomalies.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: '#64748b' }}>
              <h3>Scanning for Patterns...</h3>
              <p>Generate some "Security" or "Inventory" logs to trigger the AI.</p>
          </div>
      )}

      <div className="anomalies-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {anomalies.map((item, index) => (
          <div key={index} style={{ 
              background: '#1e293b', 
              border: '1px solid #334155', 
              borderRadius: '12px', 
              padding: '1.5rem',
              borderLeft: `4px solid ${item.severity === 'critical' ? '#ef4444' : '#f59e0b'}` 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{item.title}</h2>
                <span style={{ 
                    color: item.severity === 'critical' ? '#ef4444' : '#f59e0b', 
                    background: item.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    border: `1px solid ${item.severity === 'critical' ? '#ef4444' : '#f59e0b'}`
                }}>
                    <AlertTriangle size={14} style={{marginRight: 6}}/> Warning
                </span>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Confidence: <span style={{ color: '#10b981' }}>{item.confidence}%</span> • Events: {item.events}
            </p>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Detected Pattern</span>
                <p style={{ color: '#fca5a5', fontFamily: 'monospace', marginTop: '0.5rem' }}>{item.pattern}</p>
            </div>

            <div style={{ borderLeft: '2px solid #6366f1', paddingLeft: '1rem' }}>
                <span style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} /> RECOMMENDED ACTION
                </span>
                <p style={{ color: '#e2e8f0', marginTop: '0.25rem' }}>{item.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VectorAnalysis;