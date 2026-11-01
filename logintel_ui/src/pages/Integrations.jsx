import {useEffect,useState} from 'react';
import {Plug,Copy,Check,Download,X,ArrowRight} from 'lucide-react';
import api from '../api';
import Inspector from '../components/Inspector';
export default function Integrations(){
 const [source,setSource]=useState('my-application'),[keys,setKeys]=useState([]),[secret,setSecret]=useState(''),[language,setLanguage]=useState('Python'),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[copied,setCopied]=useState('');
 const [step,setStep]=useState(1),[showKeys,setShowKeys]=useState(false);
 const endpoint=new URL(`${api.defaults.baseURL}/ingest`,window.location.origin).href;
 async function refresh(){const k=await api.get('/get-keys');setKeys(k.data);}
 useEffect(()=>{let active=true;async function load(){try{const k=await api.get('/get-keys');if(active)setKeys(k.data);}catch{/* shared error */}}load();const t=setInterval(load,5000);return()=>{active=false;clearInterval(t);};},[]);
 async function create(e){e.preventDefault();setBusy(true);setNote('');try{const r=await api.post('/generate-key',{app_name:source});setSecret(r.data.key);setNote('Key created. Copy it now; it will not be shown again after leaving this page.');await refresh();}catch{/* shared error */}finally{setBusy(false);}}
 async function copy(value,id){try{await navigator.clipboard.writeText(value);setCopied(id);}catch{setNote('Clipboard unavailable. Select the text and copy manually.');}}
 async function test(){setBusy(true);try{await api.post('/ingest',{source,message:'[CONNECTION TEST] NeuroLog integration verified',severity_level:6},{headers:{'x-api-key':secret}});await refresh();setNote('Test log received successfully. Select this source from Applications to view its logs.');}catch{/* shared error */}finally{setBusy(false);}}
 const py=`# Download neurolog_handler.py into your application folder.
# Set NEUROLOG_INGEST_KEY in your server environment first.
import logging, os
from neurolog_handler import NeuroLogHandler

handler = NeuroLogHandler(
    ${JSON.stringify(endpoint)}, ${JSON.stringify(source)},
    'neurolog-outbox.db', 'unused.key',
    api_key=os.environ['NEUROLOG_INGEST_KEY'])
handler.start()
logger = logging.getLogger(${JSON.stringify(source)})
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.info('Application connected')
# In your exception handler:
# logger.exception('Database query failed')
# Call handler.close() on application shutdown.
# Unsent records remain in the SQLite outbox for restart.`;
 const node=`// Node.js 18+; keep the key in your server environment.
async function sendLog(message, level = 6, metadata = {}) {
  const response = await fetch(${JSON.stringify(endpoint)}, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      'x-api-key': process.env.NEUROLOG_INGEST_KEY },
    body: JSON.stringify({ ...metadata, source: ${JSON.stringify(source)},
      severity_level: level, message }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Log delivery failed: ' + response.status);
}
await sendLog('Application connected');
// In your catch block: await sendLog('Database query failed', 3);
// This minimal example has no durable queue; handle failed sends.`;
 const curl=String.raw`# macOS/Linux shell; set NEUROLOG_INGEST_KEY first.
curl --fail-with-body -X POST '${endpoint}' \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $NEUROLOG_INGEST_KEY" \
  --data '${JSON.stringify({source,message:'Application connected',severity_level:6})}'`;
 const code=language==='Python'?py:language==='Node.js'?node:curl;
 return <section className="connections-page"><div className="page-heading"><div><span className="eyebrow">WORKSPACE</span><h1>Connect an application</h1><p>Set up a source, add the logger, then verify delivery.</p></div><button onClick={()=>setShowKeys(true)}>Manage keys <span className="plain-count">{keys.length}</span></button></div>
 <div className="setup-layout"><nav className="setup-steps" aria-label="Connection setup">{[[1,'Name your source','Create an ingestion key'],[2,'Add the logger','Choose your language'],[3,'Verify delivery','Send a test record']].map(([n,title,hint])=><button key={n} aria-current={step===n?'step':undefined} onClick={()=>setStep(n)}><span>{n}</span><div><strong>{title}</strong><small>{hint}</small></div></button>)}</nav><article className="setup-content">
 {step===1&&<><h2>1. Name your source</h2><p>Use a recognizable name such as checkout-api or inventory-service.</p><form onSubmit={create}><label htmlFor="connection-source">Application name</label><input id="connection-source" maxLength={120} pattern="[A-Za-z0-9._-]+" title="Use letters, numbers, dots, underscores or hyphens" required value={source} onChange={e=>setSource(e.target.value)}/><button className="primary" disabled={busy||!source.trim()}>Create ingestion key</button></form>{secret&&<div className="integration-key"><label htmlFor="new-key">New key · shown once</label><input id="new-key" readOnly value={secret}/><button onClick={()=>copy(secret,'key')}>{copied==='key'?<Check size={16}/>:<Copy size={16}/>}Copy key</button><p>Save as NEUROLOG_INGEST_KEY in your server environment. Keep it out of browser code and Git.</p></div>}<p role="status">{note}</p><div className="step-actions"><button className="primary" onClick={()=>setStep(2)}>Continue to setup<ArrowRight size={15}/></button></div></>}
 {step===2&&<><h2>2. Copy the setup</h2><details><summary>Set the key in your environment</summary><p>Windows PowerShell: <code>$env:NEUROLOG_INGEST_KEY='YOUR_KEY'</code></p><p>macOS/Linux: <code>export NEUROLOG_INGEST_KEY='YOUR_KEY'</code></p><p>On a hosting platform, add NEUROLOG_INGEST_KEY as a secret environment variable and restart your application.</p></details><label htmlFor="ingestion-endpoint">Ingestion endpoint</label><input id="ingestion-endpoint" readOnly value={endpoint}/><button onClick={()=>copy(endpoint,'endpoint')}>Copy endpoint</button><label className="setup-language">Language<select aria-label="Integration language" value={language} onChange={e=>setLanguage(e.target.value)}>{['Python','Node.js','cURL'].map(l=><option key={l}>{l}</option>)}</select></label>{language==='Python'&&<a className="button secondary" href="/neurolog_handler.py" download><Download size={16}/>Download Python logging handler</a>}<pre className="integration-code">{code}</pre><button onClick={()=>copy(code,'code')}><Copy size={16}/>{copied==='code'?'Copied':'Copy code'}</button><details><summary>Payload fields & severity levels</summary><p>Required: message. Optional: source, severity_level, entity_id, trace_id. Timestamp is assigned on receipt. Maximum message length: 10,000 characters.</p><p>0 Emergency · 1 Alert · 2 Critical · 3 Error · 4 Warning · 5 Notice · 6 Info · 7 Debug. Successful ingestion returns HTTP 201; invalid keys return 401; invalid payloads return 400.</p></details><div className="step-actions"><button onClick={()=>setStep(1)}>Back</button><button className="primary" onClick={()=>setStep(3)}>Verify connection<ArrowRight size={15}/></button></div></>}
 {step===3&&<><h2>3. Verify delivery</h2><p>Send a labeled INFO test record using your new key. This checks ingestion; then run the code in your own application to verify its connection.</p><button className="primary" disabled={busy||!secret} onClick={test}>Send connection test</button><p role="status">{note}</p><div className="step-actions"><button onClick={()=>setStep(2)}>Back to setup</button></div></>}
 </article></div><p className="setup-footnote">Logs are shared with everyone who can access this workspace. Keep credentials out of log messages.</p>
 {showKeys&&<Inspector label="Ingestion keys" onClose={()=>setShowKeys(false)}><div className="drawer-heading"><Plug size={20}/><button className="icon-button" aria-label="Close ingestion keys" onClick={()=>setShowKeys(false)}><X size={18}/></button></div><h2>Ingestion keys</h2><p>Only masked keys are retained for display. Revocation stops future ingestion and preserves existing logs.</p>{keys.map(k=><div className="source-row" key={k.id}><strong>{k.name}</strong><p>•••• {k.suffix}</p><button disabled={busy} onClick={async()=>{setBusy(true);try{await api.delete(`/keys/${k.id}`);setSecret('');setNote('Key revoked. Create another to reconnect.');await refresh();}catch{/* shared error */}finally{setBusy(false);}}}>Revoke {k.name}</button></div>)}{!keys.length&&<p>No ingestion keys yet.</p>}</Inspector>}
 </section>;
}
