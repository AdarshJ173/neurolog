import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Plug,Copy,Check,Download} from 'lucide-react';
import api from '../api';
export default function Integrations(){
 const [source,setSource]=useState('my-application'),[keys,setKeys]=useState([]),[connections,setConnections]=useState([]),[secret,setSecret]=useState(''),[language,setLanguage]=useState('Python'),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[copied,setCopied]=useState('');
 const endpoint=new URL(`${api.defaults.baseURL}/ingest`,window.location.origin).href;
 async function refresh(){const [k,c]=await Promise.all([api.get('/get-keys'),api.get('/connections')]);setKeys(k.data);setConnections(c.data);}
 useEffect(()=>{let active=true;async function load(){try{const [k,c]=await Promise.all([api.get('/get-keys'),api.get('/connections')]);if(active){setKeys(k.data);setConnections(c.data);}}catch{/* shared error */}}load();const t=setInterval(load,5000);return()=>{active=false;clearInterval(t);};},[]);
 async function create(e){e.preventDefault();setBusy(true);setNote('');try{const r=await api.post('/generate-key',{app_name:source});setSecret(r.data.key);setNote('Key created. Copy it now; it will not be shown again after leaving this page.');await refresh();}catch{/* shared error */}finally{setBusy(false);}}
 async function copy(value,id){try{await navigator.clipboard.writeText(value);setCopied(id);}catch{setNote('Clipboard unavailable. Select the text and copy manually.');}}
 async function test(){setBusy(true);try{await api.post('/ingest',{source,message:'[CONNECTION TEST] NeuroLog integration verified',severity_level:6},{headers:{'x-api-key':secret}});await refresh();setNote('Test log received successfully. Follow the source in Log Explorer.');}catch{/* shared error */}finally{setBusy(false);}}
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
 return <section><div className="page-heading"><div><span className="eyebrow">BRING YOUR OWN APPLICATION</span><h1>Connect your applications</h1><p>One endpoint. Any language. Start with one log, then connect your application logger.</p></div><Plug size={28}/></div><div className="notice">This hosted demo is a shared, login-free workspace. Send development logs without passwords, tokens, or personal data. Keys and logs reset on a Render redeployment.</div><div className="integration-layout"><article className="panel settings-card"><h2>1. Name your source</h2><p>Use a recognizable name such as checkout-api or inventory-service.</p><form onSubmit={create}><label htmlFor="connection-source">Application name</label><input id="connection-source" maxLength={120} pattern="[A-Za-z0-9._-]+" title="Use letters, numbers, dots, underscores or hyphens" required value={source} onChange={e=>setSource(e.target.value)}/><button className="primary" disabled={busy||!source.trim()}>Create ingestion key</button></form>{secret&&<div className="integration-key"><label htmlFor="new-key">New key · shown once</label><input id="new-key" readOnly value={secret}/><button onClick={()=>copy(secret,'key')}>{copied==='key'?<Check size={16}/>:<Copy size={16}/>}Copy key</button><p>Save as NEUROLOG_INGEST_KEY in your server environment. Keep it out of browser code and Git.</p></div>}<p role="status">{note}</p><h2>2. Copy the setup</h2><details><summary>Set the key in your environment</summary><p>Windows PowerShell: <code>$env:NEUROLOG_INGEST_KEY='YOUR_KEY'</code></p><p>macOS/Linux: <code>export NEUROLOG_INGEST_KEY='YOUR_KEY'</code></p><p>On a hosting platform, add NEUROLOG_INGEST_KEY as a secret environment variable and restart your application.</p></details><label htmlFor="ingestion-endpoint">Ingestion endpoint</label><input id="ingestion-endpoint" readOnly value={endpoint}/><button onClick={()=>copy(endpoint,'endpoint')}>Copy endpoint</button><div className="workspace-tabs" aria-label="Integration language">{['Python','Node.js','cURL'].map(l=><button key={l} aria-pressed={language===l} onClick={()=>setLanguage(l)}>{l}</button>)}</div>{language==='Python'&&<a className="button secondary" href="/neurolog_handler.py" download><Download size={16}/>Download Python logging handler</a>}<pre className="integration-code">{code}</pre><button onClick={()=>copy(code,'code')}><Copy size={16}/>{copied==='code'?'Copied':'Copy code'}</button><details><summary>Payload fields & severity levels</summary><p>Required: message. Optional: source, severity_level, entity_id, trace_id. Timestamp is assigned on receipt. Maximum message length: 10,000 characters.</p><p>0 Emergency · 1 Alert · 2 Critical · 3 Error · 4 Warning · 5 Notice · 6 Info · 7 Debug. Successful ingestion returns HTTP 201; invalid keys return 401; invalid payloads return 400.</p></details></article><aside><article className="panel settings-card"><h2>3. Verify delivery</h2><p>Send a labeled INFO test record using your new key. This checks ingestion; then run the code in your own application to verify its connection.</p><button className="primary" disabled={busy||!secret} onClick={test}>Send connection test</button><Link className="button secondary" to={`/explorer?q=${encodeURIComponent(source)}`}>View this source’s logs</Link><h3>Reporting applications</h3>{connections.map(c=><div className="source-row" key={c.source}><strong>{c.source}</strong><p>{c.records} received records · last seen {new Date(c.last_seen).toLocaleString()}</p><Link to={`/explorer?q=${encodeURIComponent(c.source)}`}>Explore logs</Link></div>)}{!connections.length&&<p>No applications have reported yet.</p>}</article><article className="panel settings-card"><h2>Ingestion keys</h2><p>Only masked keys are retained for display. Revocation stops future ingestion and preserves existing logs.</p>{keys.map(k=><div className="source-row" key={k.id}><strong>{k.name}</strong><p>•••• {k.suffix}</p><button disabled={busy} onClick={async()=>{setBusy(true);try{await api.delete(`/keys/${k.id}`);setSecret('');setNote('Key revoked. Create another to reconnect.');await refresh();}catch{/* shared error */}finally{setBusy(false);}}}>Revoke {k.name}</button></div>)}</article></aside></div></section>;
}
