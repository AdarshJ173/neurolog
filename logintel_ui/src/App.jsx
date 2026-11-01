import {useState,useEffect,useRef,lazy,Suspense} from 'react';
import {Link,BrowserRouter,Routes,Route,Navigate,useLocation,useNavigate} from 'react-router-dom';
import {Search,Menu,Sun,Moon,ChevronRight,AlertCircle,X,ArrowUpRight} from 'lucide-react';
import {selectApplication,selectedApplication} from './api';
import Applications from './pages/Applications';
import Sidebar from './components/Sidebar';
import {ThemeProvider} from './context/ThemeContext';
import {useTheme} from './context/useTheme';
const Incidents=lazy(()=>import('./pages/Incidents'));
const Dashboard=lazy(()=>import('./pages/LogIntelDashboard'));
const Explorer=lazy(()=>import('./pages/LogExplorer'));
const Assistant=lazy(()=>import('./pages/AIAssistant'));
const Integrations=lazy(()=>import('./pages/Integrations'));
const GitHub=lazy(()=>import('./pages/GitHub'));
const Settings=lazy(()=>import('./pages/Configuration'));
const names={'/github':'GitHub Actions','/applications':'Applications','/integrations':'Connections','/investigations':'Investigations','/dashboard':'Overview','/explorer':'Log explorer','/assistant':'Assistant','/configuration':'Settings'};
function LoadingView(){return <div className="workspace-skeleton" role="status" aria-label="Loading workspace"><div className="skeleton-line"/><div className="skeleton-metrics">{[0,1,2].map(i=><div key={i}/>)}</div><div className="skeleton-table">{[0,1,2,3].map(i=><div key={i}/>)}</div><span className="sr-only">Loading your workspace</span></div>;}
function Layout(){
 const [collapsed,setCollapsed]=useState(false),[error,setError]=useState(''),[search,setSearch]=useState('');
 const [application,setApplication]=useState(selectedApplication);
 const location=useLocation(),navigate=useNavigate(),searchRef=useRef(null),menuRef=useRef(null);
 const {themeMode,setThemeMode,systemDark}=useTheme();
 const isDark=themeMode==='dark'||(themeMode==='system'&&systemDark);
 useEffect(()=>{window.scrollTo(0,0);},[location.pathname]);
 useEffect(()=>{const listener=e=>setError(e.detail);window.addEventListener('neurolog-error',listener);return()=>window.removeEventListener('neurolog-error',listener);},[]);
 useEffect(()=>{const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(application)searchRef.current?.focus();else navigate('/applications');}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[application,navigate]);
 function submitSearch(e){e.preventDefault();navigate(`/explorer?q=${encodeURIComponent(search)}`);setSearch('');searchRef.current?.blur();}
 function chooseApplication(source){selectApplication(source);setApplication(source);setError('');setSearch('');navigate('/dashboard');}
 function closeMenu(){menuRef.current?.close();}
 return <div className={`app-shell ${collapsed?'nav-collapsed':''}`}>
  <a className="skip-link" href="#main">Skip to content</a>
  <Sidebar application={application} isCollapsed={collapsed} toggleSidebar={()=>setCollapsed(!collapsed)}/>
  <dialog ref={menuRef} className="navigation-dialog" aria-label="Mobile navigation"><Sidebar application={application} mobile onNavigate={closeMenu}/></dialog>
  <div className="main-content">
   <header className="topbar">
    <div className="topbar-location"><button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={()=>menuRef.current?.showModal()}><Menu size={19}/></button><Link to="/applications" className="workspace-top-label">Workspace</Link><ChevronRight size={13} aria-hidden="true"/><strong>{names[location.pathname]||'Overview'}</strong></div>
    {application&&<form className="global-search" onSubmit={submitSearch}><Search size={15} aria-hidden="true"/><input ref={searchRef} aria-label="Search all logs" placeholder="Search logs…" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>Ctrl K</kbd></form>}
    <div className="topbar-actions"><a className="button secondary source-shortcut" href="/source/" target="_blank" rel="noopener noreferrer">Go to source<ArrowUpRight size={14}/></a><button className="icon-button theme-toggle" aria-label={isDark?'Switch to light theme':'Switch to dark theme'} onClick={()=>setThemeMode(isDark?'light':'dark')}>{isDark?<Sun size={17}/>:<Moon size={17}/>}</button></div>
   </header>
   <main id="main" className="page-content">
    {error&&<div role="alert" className="notice error"><AlertCircle size={17}/><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
    <Suspense fallback={<LoadingView/>}><div className="route-stage" key={location.pathname}><Routes key={application}>
     <Route path="/applications" element={<Applications onSelect={chooseApplication}/>}/>
     <Route path="/investigations" element={application?<Incidents/>:<Navigate to="/applications" replace/>}/>
     <Route path="/incidents" element={<Navigate to="/investigations" replace/>}/>
     <Route path="/dashboard" element={application?<Dashboard/>:<Navigate to="/applications" replace/>}/>
     <Route path="/explorer" element={application?<Explorer key={location.search}/>:<Navigate to="/applications" replace/>}/>
     <Route path="/analysis" element={<Navigate to="/investigations?view=patterns" replace/>}/>
     <Route path="/assistant" element={application?<Assistant/>:<Navigate to="/applications" replace/>}/>
     <Route path="/github" element={<GitHub onSelect={chooseApplication}/>}/>
     <Route path="/integrations" element={<Integrations/>}/>
     <Route path="/configuration" element={<Settings/>}/>
     <Route path="*" element={<Navigate to="/applications" replace/>}/>
    </Routes></div></Suspense>
   </main>

  </div>
 </div>;
}
export default function App(){return <ThemeProvider><BrowserRouter><Layout/></BrowserRouter></ThemeProvider>;}
