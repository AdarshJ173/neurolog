import {createElement} from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Layers3, Search, Bot, Settings, PanelLeftClose, PanelLeftOpen, AudioLines, Workflow, ShieldAlert } from 'lucide-react';
const items=[['/dashboard',Activity,'Overview'],['/explorer',Search,'Log workspace'],['/incidents',ShieldAlert,'Incident workbench'],['/pipeline',Workflow,'Pipeline Lab'],['/analysis',Layers3,'Anomaly analysis'],['/assistant',Bot,'AI investigation'],['/configuration',Settings,'Settings']];
export default function Sidebar({isCollapsed,toggleSidebar}) {
  return <aside className={`sidebar ${isCollapsed?'collapsed':''}`}>
    <a className="brand" href="/dashboard"><span className="brand-mark"><AudioLines size={24}/></span><span>NeuroLog<span className="brand-caption">OBSERVABILITY</span></span></a>
    <div className="workspace-label">Workspace <span>LIVE</span></div>
    <nav aria-label="Main navigation">{items.map(([to,Icon,label])=><NavLink key={to} to={to} title={label} aria-label={label} className={({isActive})=>`nav-item ${isActive?'active':''}`}>{createElement(Icon,{size:19})}<span>{label}</span></NavLink>)}</nav>
    <div className="sidebar-bottom"><div className="workspace-note"><span className="status-dot"/> Connected workspace<p>Python → NeuroLog</p></div><button className="collapse-button" aria-label="Toggle sidebar" onClick={toggleSidebar}>{isCollapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}<span>Collapse navigation</span></button></div>
  </aside>;
}
