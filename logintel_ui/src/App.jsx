import {useState,useEffect,useRef,lazy,Suspense} from 'react';
import {BrowserRouter,Routes,Route,Navigate,useLocation,useNavigate} from 'react-router-dom';
import {ExternalLink,Sparkles,Search,Menu,Sun,Moon,ChevronRight,CheckCircle2,AlertCircle} from 'lucide-react';
import api from './api';
import Sidebar from './components/Sidebar';
import {ThemeProvider} from './context/ThemeContext';
import {useTheme} from './context/useTheme';
const Incidents=lazy(()=>import('./pages/Incidents'));
const PipelineLab=lazy(()=>import('./pages/PipelineLab'));
const Dashboard=lazy(()=>import('./pages/LogIntelDashboard'));
const Explorer=lazy(()=>import('./pages/LogExplorer'));
const Analysis=lazy(()=>import('./pages/VectorAnalysis'));
const Assistant=lazy(()=>import('./pages/AIAssistant'));
const Settings=lazy(()=>import('./pages/Configuration'));
const names={'/incidents':'Incidents','/pipeline':'Pipeline Lab','/dashboard':'Overview','/explorer':'Log explorer','/analysis':'Patterns & outliers','/assistant':'AI assistant','/configuration':'Settings'};
function Layout(){
 const [collapsed,setCollapsed]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[search,setSearch]=useState('');
 const location=useLocation(),navigate=useNavigate(),searchRef=useRef(null),menuRef=useRef(null);
 const {themeMode,setThemeMode}=useTheme();
 useEffect(()=>{window.scrollTo(0,0);},[location.pathname]);
 useEffect(()=>{const listener=e=>setError(e.detail);window.addEventListener('neurolog-error',listener);return()=>window.removeEventListener('neurolog-error',listener);},[]);
 useEffect(()=>{const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchRef.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[]);
 async function analyze(){setBusy(true);try{const result=await api.post('/run-ml');setNotice(result.data.status);window.dispatchEvent(new Event('neurolog-analysis'));}catch{/* shared error */}finally{setBusy(false);}}
 function submitSearch(e){e.preventDefault();navigate(`/explorer?q=${encodeURIComponent(search)}`);setSearch('');searchRef.current?.blur();}
 function closeMenu(){menuRef.current?.close();}
 return <div className={`app-shell ${collapsed?'nav-collapsed':''}`}><a className="skip-link" href="#main">Skip to content</a><Sidebar isCollapsed={collapsed} toggleSidebar={()=>setCollapsed(!collapsed)}/><dialog ref={menuRef} className="navigation-dialog" aria-label="Mobile navigation"><Sidebar mobile onNavigate={closeMenu}/></dialog><div className="main-content"><header className="topbar"><div className="topbar-location"><button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={()=>menuRef.current?.showModal()}><Menu size={20}/></button><span className="workspace-top-label">Workspace</span><ChevronRight size={14} aria-hidden="true"/><strong>{names[location.pathname]||'Overview'}</strong></div><form className="global-search" onSubmit={submitSearch}><Search size={16} aria-hidden="true"/><input ref={searchRef} aria-label="Search all logs" placeholder="Search your logs…" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>Ctrl K</kbd></form><div className="topbar-actions"><button className="icon-button theme-toggle" aria-label="Switch color theme" onClick={()=>setThemeMode(themeMode==='dark'?'light':'dark')}>{themeMode==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><a className="button secondary source-top-link" href={import.meta.env.VITE_SOURCE_URL||'http://127.0.0.1:8000'} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Log source</a><button className="primary analyze-top-button" aria-label="Run analysis" disabled={busy} onClick={analyze}><Sparkles size={15}/><span>{busy?'Analyzing…':'Run analysis'}</span></button></div></header><main id="main" className="page-content">{error&&<div role="alert" className="notice error"><AlertCircle size={17}/><span>{error}</span><button onClick={()=>setError('')}>Dismiss</button></div>}{notice&&<div role="status" className="notice"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={()=>setNotice('')}>Dismiss</button></div>}<Suspense fallback={<div className="page-loading"><div className="loading-mark"><Sparkles size={24}/></div><h2>Opening your workspace</h2><p>Getting the view ready…</p></div>}><Routes><Route path="/incidents" element={<Incidents/>}/><Route path="/pipeline" element={<PipelineLab/>}/><Route path="/dashboard" element={<Dashboard/>}/><Route path="/explorer" element={<Explorer key={location.search}/>}/><Route path="/analysis" element={<Analysis/>}/><Route path="/assistant" element={<Assistant/>}/><Route path="/configuration" element={<Settings/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></Suspense></main><footer className="workspace-footer"><span>NeuroLog · Make sense of the stream.</span><span>Evidence first. Actions stay with you.</span></footer></div></div>;
}
export default function App(){return <ThemeProvider><BrowserRouter><Layout/></BrowserRouter></ThemeProvider>;}
