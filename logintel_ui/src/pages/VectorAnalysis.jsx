import { useEffect, useState } from 'react';
import api from '../api';

export default function VectorAnalysis() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const result = await api.get('/recent-logs'); if (active) setLogs(result.data); }
      catch { /* Global error banner supplies recovery instructions. */ }
    };
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const anomalies = logs.filter(log => log.ml_anomaly);
  const analyzed = logs.filter(log => log.cluster_id !== null);
  return <section>
    <h1>Vector Analysis</h1>
    <p>TF-IDF converts messages into word-weight vectors. DBSCAN groups similar messages; cluster -1 marks isolated messages.</p>
    <p>{analyzed.length} analyzed logs · {anomalies.length} outliers in the current window.</p>
    <p>Use Run clustering after adding logs. An outlier is a review candidate; it does not prove a fault.</p>
    {!anomalies.length && <p role="status">No outliers in the current window. Run clustering with at least five logs.</p>}
    {anomalies.map(log => <article className="glass-panel" key={log._id} style={{padding:24, marginBottom:16}}>
      <h2>{log.source} · {log.severity_label}</h2>
      <p>{log.message}</p><p>Cluster {log.cluster_id} · {new Date(log.timestamp).toLocaleString()}</p>
    </article>)}
  </section>;
}
