import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Sun, Monitor, BellRing, Key, Database, Sparkles, Slack, Mail, Laptop, Plus, LogOut, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth'; 

const UI_THEMES = {
  AUTO: { name: 'Auto', base: '#0f172a', mesh: 'none', color: '#334155' }, 
  AURORA: { name: 'Aurora', base: '#022c22', mesh: 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(20, 184, 166, 0.25) 0px, transparent 50%)', color: '#065f46' },
  CYBERPUNK: { name: 'Cyberpunk', base: '#2a0845', mesh: 'radial-gradient(at 0% 0%, rgba(236, 72, 153, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.3) 0px, transparent 50%)', color: '#9d174d' },
  NEBULA: { name: 'Nebula', base: '#170b3b', mesh: 'radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.35) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.3) 0px, transparent 50%)', color: '#4c1d95' },
  SOLAR: { name: 'Solar', base: '#450a0a', mesh: 'radial-gradient(at 0% 0%, rgba(249, 115, 22, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(225, 29, 72, 0.3) 0px, transparent 50%)', color: '#7f1d1d' },
  QUANTUM: { name: 'Quantum', base: '#082f49', mesh: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.2) 0px, transparent 50%)', color: '#0369a1' },
  OBSIDIAN: { name: 'Obsidian', base: '#1a1a1a', mesh: 'radial-gradient(at 0% 0%, rgba(212, 175, 55, 0.15) 0px, transparent 50%)', color: '#4a3f1a' },
};

const Configuration = () => {
  const { background, setBackground, themeMode, setThemeMode, visualEffect, setVisualEffect } = useTheme();
  
  // 🚨 THE FIX: Initialize state from localStorage so it remembers your choice!
  const [desktopNotifs, setDesktopNotifs] = useState(localStorage.getItem('aegis_notifications') === 'true');
  
  const [retention, setRetention] = useState('14');
  
  // State for Multiple API Keys
  const [apiKeys, setApiKeys] = useState([]);
  const [newAppName, setNewAppName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  
  const user = auth.currentUser;

  // 1. Fetch Real Keys on Load
  useEffect(() => {
    const fetchKeys = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`http://127.0.0.1:5001/api/get-keys?uid=${user.uid}`);
        setApiKeys(res.data);
      } catch (err) { console.error("Error fetching keys", err); }
    };
    fetchKeys();
  }, [user]);

  // 2. Generate a New Key for a New App
  const handleGenerateNewKey = async () => {
    if (!newAppName.trim() || !user) return;
    try {
      const res = await axios.post('http://127.0.0.1:5001/api/generate-key', { 
        uid: user.uid, email: user.email, app_name: newAppName 
      });
      setApiKeys(prev => [...prev, res.data]);
      setNewAppName('');
    } catch (err) { console.error("Failed to generate key"); }
  };

  const handleCopy = (keyStr) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(keyStr);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) { console.error("Logout failed", err); }
  };

  // 🚨 THE FIX: Save the user's notification preference to localStorage!
  const handleDesktopNotifToggle = async () => {
    if (!desktopNotifs) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification("NeuroLog AI", { body: "OS Desktop alerts successfully enabled." });
        setDesktopNotifs(true);
        localStorage.setItem('aegis_notifications', 'true');
      } else alert("Please allow notifications in your browser settings.");
    } else {
      setDesktopNotifs(false);
      localStorage.setItem('aegis_notifications', 'false');
    }
  };

  return (
    <div className="animate-in" style={{ paddingBottom: '2rem' }}>
      
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Platform Configuration</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage NeuroLog AI, integrations, and workspace preferences.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* SECTION 1: APPEARANCE */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <Sparkles color="#8b5cf6" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>OS Appearance</h2>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Color Scheme</p>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                {['System', 'Dark', 'Light'].map(mode => (
                  <button key={mode} onClick={() => setThemeMode(mode.toLowerCase())} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s', background: themeMode === mode.toLowerCase() ? '#3b82f6' : 'transparent', color: themeMode === mode.toLowerCase() ? 'white' : 'var(--text-muted)' }}>
                    {mode === 'System' && <Monitor size={14} />} {mode === 'Dark' && <Moon size={14} />} {mode === 'Light' && <Sun size={14} />}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Ambient Mesh Theme</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.values(UI_THEMES).map(theme => (
                  <div key={theme.name} onClick={() => setBackground(theme)} title={theme.name} style={{ width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s', background: `radial-gradient(circle at center, ${theme.color} 0%, #0f172a 100%)`, border: background.name === theme.name ? '2px solid white' : '2px solid rgba(255,255,255,0.05)', boxShadow: background.name === theme.name ? `0 0 15px ${theme.color}` : 'none' }}>
                    {theme.name === 'Auto' && 'Auto'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Visual Effects (Luxurious)</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ id: 'none', label: 'Minimal (None)' }, { id: 'ambient_orbs', label: 'Ambient Orbs' }, { id: 'stardust', label: 'Stardust' }].map(effect => (
                <button key={effect.id} onClick={() => setVisualEffect(effect.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold', background: visualEffect === effect.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)', border: visualEffect === effect.id ? '1px solid #3b82f6' : '1px solid var(--glass-border)', color: visualEffect === effect.id ? '#3b82f6' : 'var(--text-muted)' }}>
                  {effect.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: API & INTEGRATIONS */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <Key color="#10b981" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>API & Integrations</h2>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Your active Ingestion Keys. Use these to isolate logs from different applications.</p>
          
          {/* List all active keys */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
            {apiKeys.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading keys...</div>
            ) : (
              apiKeys.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '100px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{item.name}</div>
                  <input type="text" readOnly value={item.key} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 14px', color: '#10b981', fontFamily: 'monospace', outline: 'none' }} />
                  <button onClick={() => handleCopy(item.key)} style={{ background: copiedKey === item.key ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px', color: copiedKey === item.key ? '#10b981' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', width: '80px' }}>
                    {copiedKey === item.key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add a new Key */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
            <input type="text" placeholder="New App Name (e.g. Mobile App)" value={newAppName} onChange={(e) => setNewAppName(e.target.value)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-main)', outline: 'none' }} />
            <button onClick={handleGenerateNewKey} disabled={!newAppName} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: newAppName ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: newAppName ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: newAppName ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
              <Plus size={16} /> Create Key
            </button>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>NeuroLog AI Personality Override</p>
          <select style={{ appearance: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer' }}>
            <option>Default (Concise & Technical)</option>
            <option>Verbose (Detailed Explanations)</option>
            <option>Executive (High-Level Summaries)</option>
          </select>
        </div>

        {/* SECTION 3: ALERT CHANNELS */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <BellRing color="#ef4444" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Alert Channels</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* 🚨 THE FIX: Put the OS Desktop Alerts toggle back in! */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <Laptop size={18} color="#3b82f6" /> OS Desktop Alerts
              </div>
              <div onClick={handleDesktopNotifToggle} style={{ width: '40px', height: '22px', background: desktopNotifs ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                <div style={{ position: 'absolute', top: '2px', left: desktopNotifs ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left 0.3s' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <Slack size={18} color="#e01e5a" style={{ marginRight: '12px' }} />
              <input type="text" placeholder="Slack Webhook URL..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <Mail size={18} color="#f59e0b" style={{ marginRight: '12px' }} />
              <input type="email" placeholder="Incident Team Email..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* SECTION 4: DATA MANAGEMENT & SYSTEM ACTIONS */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <Database color="#3b82f6" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Data Management</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Log Retention Policy</p>
          <select value={retention} onChange={(e) => setRetention(e.target.value)} style={{ appearance: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', marginBottom: '2rem' }}>
            <option value="3">3 Days (Developer Tier)</option>
            <option value="14">14 Days (Pro Tier)</option>
            <option value="90">90 Days (Enterprise Compliance)</option>
          </select>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
            <button style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
              Purge Workspace
            </button>
            <button onClick={handleLogout} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Configuration;