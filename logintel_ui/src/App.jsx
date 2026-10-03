import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ExternalLink, Sparkles } from 'lucide-react';
import api from './api';
import Sidebar from './components/Sidebar';
import { ThemeProvider } from './context/ThemeContext';
const Dashboard=lazy(()=>import('./pages/LogIntelDashboard'));
const Explorer=lazy(()=>import('./pages/LogExplorer'));
const Analysis=lazy(()=>import('./pages/VectorAnalysis'));
const Assistant=lazy(()=>import('./pages/AIAssistant'));
const Settings=lazy(()=>import('./pages/Configuration'));
const names={'/dashboard':'Overview','/explorer':'Log workspace','/analysis':'Anomaly analysis','/assistant':'AI investigation','/configuration':'Settings'};
function Layout(){
 const [collapsed,setCollapsed]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const location=useLocation();
 useEffect(()=>{window.scrollTo(0,0);},[location.pathname]);
 useEffect(()=>{const listener=e=>setError(e.detail);window.addEventListener('neurolog-error',listener);return()=>window.removeEventListener('neurolog-error',listener);},[]);
 async function analyze(){setBusy(true);try{const result=await api.post('/run-ml');setNotice(result.data.status);}catch{/* shared error */}finally{setBusy(false);}}
 return <div className={`app-shell ${collapsed?'nav-collapsed':''}`}><a className="skip-link" href="#main">Skip to content</a><Sidebar isCollapsed={collapsed} toggleSidebar={()=>setCollapsed(!collapsed)}/><div className="main-content"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{names[location.pathname]||'Overview'}</strong></div><div className="topbar-actions"><a className="button secondary" href="http://127.0.0.1:8000" target="_blank" rel="noreferrer"><ExternalLink size={16}/> Python app</a><button className="primary" disabled={busy} onClick={analyze}><Sparkles size={16}/>{busy?'Analyzing…':'Run analysis'}</button></div></header><main id="main" className="page-content">{error&&<div role="alert" className="notice error">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}{notice&&<div role="status" className="notice">{notice}<button onClick={()=>setNotice('')}>Dismiss</button></div>}<Suspense fallback={<div className="empty-state">Loading workspace…</div>}><Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/explorer" element={<Explorer/>}/><Route path="/analysis" element={<Analysis/>}/><Route path="/assistant" element={<Assistant/>}/><Route path="/configuration" element={<Settings/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></Suspense></main></div></div>;
}
export default function App(){return <ThemeProvider><BrowserRouter><Layout/></BrowserRouter></ThemeProvider>;}
