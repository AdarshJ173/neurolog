import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bot, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { auth } from '../firebase'; 
import ReactMarkdown from 'react-markdown'; 
import { useTheme } from '../context/ThemeContext'; 

const AIAssistant = () => {
  // 🚨 NEW: Load initial state from localStorage!
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('aegis_chat_history');
    return saved ? JSON.parse(saved) : [{ sender: 'bot', text: 'NeuroLog AI initialized. Monitoring server streams for malicious activity and critical anomalies.' }];
  });
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [criticalLogs, setCriticalLogs] = useState([]);
  
  // 🚨 FIX: Use a ref Set to permanently track IDs we've already alerted about (No double posting!)
  const notifiedIdsRef = useRef(new Set());
  
  const chatBoxRef = useRef(null);
  const user = auth.currentUser; 
  const { setBackground } = useTheme();

  // 🚨 NEW: Save chat history to localStorage every time it changes
  useEffect(() => {
    localStorage.setItem('aegis_chat_history', JSON.stringify(messages));
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages, isTyping]); 

  const clearHistory = () => {
    setMessages([{ sender: 'bot', text: 'Chat history cleared. NeuroLog AI monitoring active.' }]);
    notifiedIdsRef.current.clear();
  };

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return; 
      try {
        const res = await axios.get(`http://127.0.0.1:5001/api/recent-logs?uid=${user.uid}`);
        const threats = res.data.filter(log => log.severity_level <= 3).slice(0, 10);
        setCriticalLogs(threats);

        if (threats.length > 0) {
            const latestThreat = threats[0];
            
            // If we have NOT alerted about this specific database object yet
            if (!notifiedIdsRef.current.has(latestThreat._id)) {
                
                if (latestThreat.message.includes("MongoTimeoutError")) {
                    setMessages(prev => [...prev, { sender: 'bot', text: `🚨 **CRITICAL SYSTEM OUTAGE** 🚨\n\nI have intercepted a fatal crash in the \`${latestThreat.source}\`. The cluster is unreachable and OOM protocols were invoked. The system is completely offline.` }]);
                    notifiedIdsRef.current.add(latestThreat._id);
                }
                else if (latestThreat.message.includes("[ANOMALY PATTERN 8]")) {
                    setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ **PREDICTIVE WARNING** ⚠️\n\nMy machine learning engine has detected an abnormal 400% heap spike in the \`${latestThreat.source}\`. A cascading failure is imminent. Initiating automated failover protocols...` }]);
                    notifiedIdsRef.current.add(latestThreat._id);
                }
                else if (latestThreat.message.includes("[SYSTEM HOTFIX]")) {
                    setMessages(prev => [...prev, { sender: 'bot', text: `✅ **CRISIS AVERTED** ✅\n\nHotfix deployment detected. Memory leak patched successfully. Operations returning to stable parameters.` }]);
                    notifiedIdsRef.current.add(latestThreat._id);
                }
            }
        }
      } catch (err) { console.error(err); }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [user]); 

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || !user) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    if (!customText) setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://127.0.0.1:5001/api/chat', { message: textToSend, uid: user.uid });
      let botReply = res.data.reply;
      botReply = botReply.replace(/\[THEME_[A-Z]+\]/g, '').trim();
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "⚠️ Backend offline. Is api.py running?" }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="animate-in" style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: 0 }}>
      <style>
        {`
          .glass-scroll::-webkit-scrollbar { width: 8px; }
          .glass-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
          .glass-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
          .markdown-body p { margin: 0 0 10px 0; }
          .markdown-body strong { color: #60a5fa; }
        `}
      </style>

      {/* LEFT SIDE: THREAT FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <header style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <h1 style={{ margin: 0 }}>Neural Assistant</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time threat interception and resolution.</p>
        </header>

        <div className="glass-panel glass-scroll" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', flexShrink: 0 }}><ShieldAlert size={20} /> Active Threat Feed</h3>
          {criticalLogs.length === 0 ? (<p style={{ color: 'var(--text-muted)' }}>No critical threats detected recently.</p>) : (
            criticalLogs.map((log, idx) => (
              <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>[{log.severity_label}] {log.source}</span>
                <p style={{ margin: '8px 0 12px 0', fontSize: '0.9rem', fontFamily: 'monospace' }}>{log.message}</p>
                <button onClick={() => handleSend(`Analyze this log and provide a dynamic solution: "${log.message}"`)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bot size={14} /> Analyze & Solve
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: CHAT TERMINAL */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Bot color="#3b82f6"/> AI Terminal</h3>
          <button onClick={clearHistory} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }} title="Clear Chat History"><Trash2 size={14} /> Clear</button>
        </div>

        <div ref={chatBoxRef} className="glass-scroll" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', scrollBehavior: 'smooth' }}>
          {messages.map((msg, i) => (
            <div key={i} className="markdown-body" style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)', border: msg.sender === 'user' ? 'none' : '1px solid var(--glass-border)', padding: '12px 16px', borderRadius: '16px', maxWidth: '85%', lineHeight: '1.5', wordBreak: 'break-word' }}>
              {msg.sender === 'bot' ? (<ReactMarkdown>{msg.text}</ReactMarkdown>) : (msg.text)}
            </div>
          ))}
          {isTyping && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>AI is computing...</div>}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '1rem', flexShrink: 0 }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Query system status..." style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', color: 'var(--text-main)', outline: 'none' }} />
          <button onClick={() => handleSend()} style={{ background: '#3b82f6', border: 'none', borderRadius: '12px', padding: '0 1.5rem', cursor: 'pointer', color: 'white' }}><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;