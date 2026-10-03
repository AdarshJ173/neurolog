import { useState } from 'react';
import { useTheme } from '../context/useTheme';
import api from '../api';

const themes = [
  {name:'Nebula', base:'#170b3b', mesh:'radial-gradient(at 0% 0%, rgba(124,58,237,.35), transparent 50%)'},
  {name:'Aurora', base:'#022c22', mesh:'radial-gradient(at 100% 0%, rgba(16,185,129,.3), transparent 50%)'},
  {name:'Quantum', base:'#082f49', mesh:'radial-gradient(at 0% 100%, rgba(14,165,233,.3), transparent 50%)'},
];
const buttonStyle = {padding:'12px 18px', borderRadius:10, border:'1px solid var(--glass-border)', background:'var(--glass-bg)', color:'var(--text-main)', cursor:'pointer'};

export default function Configuration() {
  const {background,setBackground,themeMode,setThemeMode,visualEffect,setVisualEffect} = useTheme();
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState('');
  const run = async path => {
    setBusy(true);
    try { const response = await api.post(path); setStatus(response.data.status); }
    catch { /* API errors are shown in the app banner. */ }
    finally { setBusy(false); }
  };
  return <section>
    <h1>Settings</h1>
    <p>Manage appearance and analyze received application logs.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,350px),1fr))',gap:24}}>
      <div className="glass-panel" style={{padding:24}}>
        <h2>Appearance</h2>
        <p>Color scheme</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {['dark','light','system'].map(mode => <button key={mode} aria-pressed={themeMode===mode} onClick={()=>setThemeMode(mode)} style={buttonStyle}>{mode[0].toUpperCase()+mode.slice(1)}</button>)}
        </div>
        <p>Background</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {themes.map(theme => <button key={theme.name} aria-pressed={background?.name===theme.name} onClick={()=>setBackground(theme)} style={buttonStyle}>{theme.name}</button>)}
        </div>
        <p>Visual effects</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {[['none','None'],['ambient_orbs','Ambient orbs'],['stardust','Stardust']].map(([value,label])=><button key={value} aria-pressed={visualEffect===value} onClick={()=>setVisualEffect(value)} style={buttonStyle}>{label}</button>)}
        </div>
      </div>
      <div className="glass-panel" style={{padding:24}}>
        <h2>Live analysis</h2>
        <p>Run clustering on received messages and inspect unusual records in Vector Analysis.</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          <button disabled={busy} onClick={()=>run('/run-ml')} style={buttonStyle}>Run clustering</button>
        </div>
        {status && <p role="status">{status}</p>}
        <p>The advisor summarizes received logs. It does not execute remediation commands.</p>
      </div>
    </div>
  </section>;
}
