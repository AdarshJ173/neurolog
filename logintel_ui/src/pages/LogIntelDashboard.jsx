import React, { useEffect, useState, useRef } from 'react';
import axios from '../api';
import { PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, Legend, XAxis, YAxis } from 'recharts';
import { Activity, ShieldAlert, BrainCircuit, AlertTriangle, CheckCircle } from 'lucide-react';

const NeuroLogDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const notified = useRef(new Set());

  const [systemState, setSystemState] = useState('stable'); // stable, imminent, crashed, recovered


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/recent-logs`);
        const logs = res.data;
        if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('aegis_notifications') === 'true') {
          const critical = logs.find(log => log.severity_level <= 2 && !notified.current.has(log._id));
          if (critical) new Notification('NeuroLog critical log', {body: `${critical.source}: ${critical.message}`});
        }
        logs.forEach(log => notified.current.add(log._id));

        const incident = logs.find(log => /\[ANOMALY PATTERN 8\]|\[SYSTEM HOTFIX\]|MongoTimeoutError/.test(log.message));
        setSystemState(!incident ? 'stable' : incident.message.includes('[SYSTEM HOTFIX]') ? 'recovered' : incident.message.includes('MongoTimeoutError') ? 'crashed' : 'imminent');
        const criticalCount = logs.filter(log => log.severity_level <= 2).length;
        const calculatedHealth = Math.max(0, 100 - (criticalCount * 12));
        const severityCounts = {};
        logs.forEach(log => {
            const label = log.severity_label.toUpperCase();
            severityCounts[label] = (severityCounts[label] || 0) + 1;
        });

        const colorMap = { "CRITICAL": "#ef4444", "WARNING": "#f59e0b", "INFO": "#10b981", "DEBUG": "#8b5cf6" };
        const pieData = Object.keys(severityCounts).map(key => ({ name: key, value: severityCounts[key], fill: colorMap[key] || "#3b82f6" }));
        const areaData = [...logs].reverse().map((log) => ({ time: new Date(log.timestamp).toLocaleTimeString(), severity: log.severity_level, source: log.source }));

        setData({ current_health: calculatedHealth, critical_threats: criticalCount, severity_distribution: pieData, traffic_history: areaData });
        setLoading(false);
      } catch { setLoading(false); }
    };

    fetchData();
    const uiInterval = setInterval(fetchData, 2000);
    return () => clearInterval(uiInterval);
  }, []);

  if (!loading && !data) return <p role="alert">Cannot load logs. Start the backend; this page retries every two seconds.</p>;

  if (loading || !data) return (
    <div className="animate-in" style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)'}}>
      <BrainCircuit size={48} color="#3b82f6" style={{ animation: 'pulseGlow 2s infinite', marginBottom: '1rem' }} />
      <h2>⚡ Establishing Secure Neural Link...</h2>
    </div>
  );

  return (
    <div className="dashboard-container animate-in" style={{ color: 'var(--text-main)', paddingBottom: '2rem' }}>
      <style>
        {`
          @keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
          @keyframes pulseGreen { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
          .card-alert { border: 2px solid #ef4444 !important; background: rgba(239, 68, 68, 0.1) !important; animation: pulseRed 1s infinite; }
          .card-recovered { border: 2px solid #10b981 !important; background: rgba(16, 185, 129, 0.1) !important; animation: pulseGreen 1s infinite; }
          .card-crashed { border: 2px solid #ef4444 !important; background: rgba(0, 0, 0, 0.4) !important; filter: grayscale(1); }
        `}
      </style>

      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>System Intelligence</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time Anomaly Detection & Severity Summary</p>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: data.current_health < 60 ? '#ef4444' : '#10b981', border: `1px solid ${data.current_health < 60 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>
          <span style={{ background: data.current_health < 60 ? '#ef4444' : '#10b981', width: '8px', height: '8px', borderRadius: '50%', animation: 'pulseGlow 2s infinite' }}></span> POLLING LOGS
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${data.current_health < 60 ? "#ef4444" : "#10b981"}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Recent-log Health Score</h3><Activity color={data.current_health < 60 ? "#ef4444" : "#10b981"} /></div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: data.current_health < 60 ? "#ef4444" : "#10b981" }}>{data.current_health}%</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Critical Threats</h3><ShieldAlert color="#ef4444" /></div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{data.critical_threats}</div>
        </div>

        <div className={`glass-panel ${systemState === 'imminent' ? 'card-alert' : systemState === 'recovered' ? 'card-recovered' : systemState === 'crashed' ? 'card-crashed' : ''}`} style={{ padding: '1.5rem', borderLeft: `4px solid ${systemState === 'stable' ? '#8b5cf6' : systemState === 'recovered' ? '#10b981' : '#ef4444'}`, transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: systemState === 'stable' ? 'var(--text-muted)' : systemState === 'recovered' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
              {systemState === 'stable' ? 'Incident Markers' : systemState === 'imminent' ? 'EWS ALERT' : systemState === 'recovered' ? 'RECOVERY REPORTED' : 'FAILURE REPORTED'}
            </h3>
            {systemState === 'stable' && <BrainCircuit color="#8b5cf6" />}
            {systemState === 'imminent' && <AlertTriangle color="#ef4444" />}
            {systemState === 'recovered' && <CheckCircle color="#10b981" />}
            {systemState === 'crashed' && <AlertTriangle color="#ef4444" opacity={0.5} />}
          </div>

          <div style={{ fontSize: systemState === 'imminent' ? '3rem' : '2.5rem', fontWeight: '900', color: systemState === 'stable' ? '#8b5cf6' : systemState === 'recovered' ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {systemState === 'stable' && 'Stable'}
            {systemState === 'imminent' && 'Warning'}
            {systemState === 'recovered' && 'HOTFIXED'}
            {systemState === 'crashed' && 'OFFLINE'}
          </div>

          <p style={{ color: systemState === 'stable' ? 'var(--text-muted)' : systemState === 'recovered' ? '#10b981' : '#ef4444', fontSize: '0.85rem', margin: '0.5rem 0 0 0', fontWeight: systemState === 'stable' ? 'normal' : 'bold' }}>
            {systemState === 'stable' && 'No incident markers observed.'}
            {systemState === 'imminent' && 'Warning marker observed; investigate.'}
            {systemState === 'recovered' && 'Recovery marker observed in logs.'}
            {systemState === 'crashed' && 'Failure marker observed in logs.'}
          </p>
        </div>
      </div>

      {/* 🚨 THE FIX: Both charts are properly restored in the 1fr 2fr grid! 🚨 */}
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>

        {/* LEFT CHART: Severity Distribution (Pie) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Severity Distribution</h3>
          {data.severity_distribution.length === 0 ? (
              <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No recent traffic.</div>
          ) : (
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                <PieChart>
                    <Legend />
                    <Pie data={data.severity_distribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {data.severity_distribution.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                </PieChart>
                </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* RIGHT CHART: Recent Log Severity (Area) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Recent Log Severity</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={data.traffic_history}>
                 <XAxis dataKey="time" hide />
                 <YAxis domain={[0, 7]} allowDecimals={false} stroke="var(--text-muted)" width={25} />
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted)" opacity={0.1} vertical={false} />
                 <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                 <Area type="monotone" dataKey="severity" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" strokeWidth={3} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NeuroLogDashboard;
