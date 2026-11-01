import {useEffect, useState} from 'react';
import {Github, GitBranch, Download, ExternalLink, RefreshCw, CheckCircle2, Plus, X, ChevronRight} from 'lucide-react';
import api from '../api';
import Inspector from '../components/Inspector';

function ResolutionTag({resolution, compact = false}) {
  const status = resolution || {state: 'unverified', label: 'Not verified', reason: 'Check later commits to see whether this workflow recovered.'};
  const badge = <span className={`github-resolution-tag ${status.state}`}>{status.label}{compact && status.state !== 'unverified' ? ' · workflow' : ''}</span>;
  return <details className="github-resolution"><summary>{badge}</summary><p>{status.reason}</p>
    {status.later_run && <div className="github-links"><a href={status.later_run.url} target="_blank" rel="noreferrer">Later workflow <ExternalLink size={13}/></a><a href={status.later_run.commit_url} target="_blank" rel="noreferrer">Commit {status.later_run.sha.slice(0, 7)}</a></div>}
    {status.checked_at && <p className="muted"><small>Checked {new Date(status.checked_at).toLocaleString()} · latest 100 repository runs</small></p>}
  </details>;
}

export default function GitHub({onSelect}) {
  const [repository, setRepository] = useState('shahrukh-210906/neurolog');
  const [token, setToken] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [selected, setSelected] = useState('');
  const [runs, setRuns] = useState(null);
  const [imports, setImports] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [view, setView] = useState('runs');
  const [runPage, setRunPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/github/repositories'), api.get('/github/imports')]).then(([repos, history]) => {
      if (active) {
        setRepositories(repos.data);
        setSelected(repos.data[0]?.repo || '');
        setImports(history.data);
      }
    }).catch(() => { if (active) setError('Could not load GitHub connections. Reload the page to try again.'); });
    return () => { active = false; };
  }, []);

  async function perform(label, action) {
    setBusy(label); setError(''); setNote('');
    try { await action(); }
    catch (err) { setError(err.response?.data?.error || 'The request could not finish. Please try again.'); }
    finally { setBusy(''); }
  }

  function connect(event) {
    event.preventDefault();
    perform('connect', async () => {
      const {data} = await api.post('/github/connect', {repository, token});
      const list = await api.get('/github/repositories');
      setRepositories(list.data); setSelected(data.repo); setRuns(null); setConnecting(false);
      setNote(`${data.repo} connected. Choose “Find failed runs” to get started.`);
    });
  }

  function loadRuns() {
    perform('runs', async () => {
      const {data} = await api.post('/github/runs', {repository: selected, token}, {timeout: 90000});
      setRuns(data.runs); setRunPage(0); setNote('');
      const history = await api.get('/github/imports');
      setImports(history.data);
    });
  }

  function checkLaterCommits(item) {
    perform(`resolution-${item.run.id}`, async () => {
      const {data} = await api.post('/github/resolution', {repository: item.repository, token, run_id: item.run.id, attempt: item.run.attempt}, {timeout: 60000});
      setImports(previous => previous.map(saved => saved.repository === item.repository && saved.run.id === item.run.id && saved.run.attempt === item.run.attempt ? {...saved, resolution: data} : saved));
      setRuns(previous => previous?.map(run => run.id === item.run.id && run.attempt === item.run.attempt ? {...run, resolution: data} : run) ?? null);
      setNote(`Status checked: ${data.label}.`);
    });
  }

  function importRun(run) {
    perform(`import-${run.id}`, async () => {
      const {data} = await api.post('/github/import', {repository: selected, token, run_id: run.id, attempt: run.attempt}, {timeout: 60000});
      const history = await api.get('/github/imports');
      setImports(history.data);
      setView('imports');
      setNote(data.already_imported ? 'This attempt is already saved in Imports.' : `Imported ${data.records} lines. Select a run to review its findings.`);
    });
  }

  const history = imports.filter(item => item.repository === selected);
  const selectedSummary = detail?.kind === 'summary' ? history.find(item => `${item.run.id}-${item.run.attempt}` === detail.key) : null;
  const badge = resolution => <span className={`github-resolution-tag ${resolution?.state || 'unverified'}`}>{resolution?.label || 'Not verified'}</span>;
  return <section className="github-page structured-page">
    <div className="page-heading"><div><span className="eyebrow">DEVELOPMENT</span><h1>GitHub Actions</h1><p>From failed workflow to the next useful clue.</p></div><button onClick={() => setConnecting(true)}><Plus size={16}/>Connect repository</button></div>
    <div className="repository-bar"><Github size={22}/><div className="repository-picker"><label htmlFor="github-selected">Repository</label><select id="github-selected" value={selected} disabled={!!busy || !repositories.length} onChange={e => {setSelected(e.target.value);setRuns(null);setRunPage(0);setDetail(null);setError('');setNote('');}}><option value="" disabled>Select a repository</option>{repositories.map(r => <option key={r.repo} value={r.repo}>{r.repo}</option>)}</select></div><button className="access-button" onClick={() => setConnecting(true)}>{token ? 'Token supplied' : 'Access settings'}</button><button className="primary" disabled={!!busy || !selected} onClick={loadRuns}><RefreshCw size={15}/>{busy === 'runs' ? 'Checking…' : 'Find failed runs'}</button></div>
    <div className="section-navigation" aria-label="GitHub views"><button aria-pressed={view === 'runs'} onClick={() => setView('runs')}>Failed runs{runs && <span>{runs.length}</span>}</button><button aria-pressed={view === 'imports'} onClick={() => setView('imports')}>Imports<span>{history.length}</span></button></div>
    {error && <p className="notice error" role="alert">{error}</p>}{(note || busy.startsWith('import-')) && <p className="quiet-feedback" role="status">{busy.startsWith('import-') ? 'Downloading and analyzing logs…' : note}</p>}
    {view === 'runs' && <><div className="section-caption"><div><p>Select an outcome to inspect the later-commit evidence.</p></div><details className="tag-legend"><summary>About these tags</summary><p>Likely resolved means a later descendant commit passed. Still failing means a later comparable workflow failed. Not verified means insufficient evidence. Individual error fixes are not confirmed.</p></details></div>
      {runs === null && <div className="workspace-empty"><Github size={30}/><h2>{selected ? 'Ready when you are' : 'Connect your repository'}</h2><p>{selected ? 'Fetch workflow failures to begin reviewing.' : 'Add a repository to explore its workflow history.'}</p><button onClick={selected ? loadRuns : () => setConnecting(true)} disabled={!!busy}>{selected ? 'Load workflow history' : 'Add repository'}</button></div>}
      {runs?.length === 0 && <div className="workspace-empty"><CheckCircle2 size={30}/><h2>No failed runs found</h2><p>GitHub returned no available failures.</p></div>}
      {!!runs?.length && <div className="run-list" role="region" aria-label="Available failed workflows"><div className="run-list-labels"><span>Workflow</span><span>Commit</span><span>Later outcome</span><span>Logs</span></div>{runs.slice(runPage*6,runPage*6+6).map(run => {
        const saved = history.some(item => item.run.id === run.id && item.run.attempt === run.attempt);
        return <article className="workflow-row" key={`${run.id}-${run.attempt}`}><div className="workflow-identity"><a href={run.url} target="_blank" rel="noreferrer">{run.name}<ExternalLink size={12}/></a><small>{run.created_at ? new Date(run.created_at).toLocaleString() : 'Date unavailable'} · attempt {run.attempt}</small></div><div className="workflow-commit"><span><GitBranch size={13}/>{run.branch}</span><a href={run.commit_url || run.url} target="_blank" rel="noreferrer">{run.sha.slice(0,7) || 'Unavailable'}</a></div><button className="outcome-button" onClick={() => setDetail({kind:'status',run})} aria-label={`Later outcome for ${run.name} run ${run.id}`}>{badge(run.resolution)}<ChevronRight size={13}/></button><button className="run-import" disabled={!!busy || saved} onClick={() => importRun(run)}>{saved ? <CheckCircle2 size={14}/> : <Download size={14}/>}{saved ? 'Imported' : busy === `import-${run.id}` ? 'Importing…' : 'Import logs'}</button></article>;
      })}<div className="list-pagination"><span>{runPage*6+1}–{Math.min(runPage*6+6,runs.length)} of {runs.length} runs</span><button disabled={runPage===0} onClick={()=>setRunPage(p=>p-1)}>Previous</button><button disabled={(runPage+1)*6>=runs.length} onClick={()=>setRunPage(p=>p+1)}>Next</button></div></div>}</>}
    {view === 'imports' && <><div className="section-caption"><div><h2>Saved investigations</h2><p>Select a run to review its findings and supporting records.</p></div></div>{!history.length && <div className="workspace-empty"><Download size={30}/><h2>No imports yet</h2><p>Import a failed run to create an evidence summary.</p><button onClick={() => setView('runs')}>Browse failed runs</button></div>}<div className="import-list">{history.map(item => <button className="import-row" key={`${item.run.id}-${item.run.attempt}`} onClick={() => setDetail({kind:'summary',key:`${item.run.id}-${item.run.attempt}`})}><div><strong>{item.run.name}</strong><small>{item.run.branch} · {item.records} records · {item.summary.findings.length} {item.summary.findings.length===1?'finding':'findings'}</small></div>{badge(item.resolution)}<ChevronRight size={17}/></button>)}</div></>}
    {connecting && <Inspector label="Repository connection" onClose={() => setConnecting(false)}>
        <div className="drawer-heading"><h2>Repository connection</h2><button className="icon-button" aria-label="Close repository connection" onClick={() => setConnecting(false)}><X size={18}/></button></div><p>Use a repository name or its GitHub URL.</p>
        <form className="connection-form" onSubmit={connect}>
          <label htmlFor="github-repo">Repository</label>
          <input id="github-repo" required value={repository} onChange={e => setRepository(e.target.value)} placeholder="owner/repository" disabled={!!busy}/>
          <label htmlFor="github-token">GitHub token <span className="muted">(when required)</span></label>
          <input id="github-token" type="password" autoComplete="off" spellCheck={false} value={token} onChange={e => setToken(e.target.value.trim())} aria-describedby="github-token-help" disabled={!!busy}/>
          <p id="github-token-help">Public repositories can be browsed without a token. For private repositories or restricted log downloads, use a fine-grained token with <strong>Actions: Read</strong>. Add <strong>Contents: Read</strong> to verify later commits. It is kept only while this page is open.</p>
          <button className="primary" disabled={!!busy}>{busy === 'connect' ? 'Connecting…' : 'Connect repository'}</button>
          <button type="button" onClick={() => setConnecting(false)}>Done</button>{token && <button type="button" disabled={!!busy} onClick={() => setToken('')}>Clear token</button>}
        </form>
        <details><summary>How imports work</summary><p>Imports happen when you choose a run. Up to 1,500 nonempty lines are saved per attempt, prioritizing errors in larger runs. Archives are limited to 8 MB compressed and 12 MB expanded.</p><p>Tokens are not saved by NeuroLog. Imported logs and summaries are stored in this workspace. Only import logs you are comfortable sharing with everyone who can access it.</p><p>Summaries use local rules and quoted evidence. They do not prove a root cause or change your repository.</p></details>

      {error && <p className="notice error" role="alert">{error}</p>}
    </Inspector>}
    {detail?.kind === 'status' && <Inspector label="Later commit evidence" onClose={() => setDetail(null)}><div className="drawer-heading"><div><span className="eyebrow">LATER COMMIT EVIDENCE</span><h2>{detail.run.name}</h2></div><button className="icon-button" aria-label="Close commit evidence" onClick={() => setDetail(null)}><X size={18}/></button></div>{badge(detail.run.resolution)}<p className="resolution-explanation">{detail.run.resolution?.reason || 'No later-commit evidence has been checked.'}</p><dl><dt>Original commit</dt><dd>{detail.run.sha.slice(0,7)} · {detail.run.branch}</dd><dt>Checked</dt><dd>{detail.run.resolution?.checked_at ? new Date(detail.run.resolution.checked_at).toLocaleString() : 'Not checked'}</dd><dt>Scope</dt><dd>Latest 100 repository runs · workflow-level evidence</dd></dl>{detail.run.resolution?.later_run && <div className="drawer-actions"><a className="button primary" href={detail.run.resolution.later_run.url} target="_blank" rel="noreferrer">Later workflow<ExternalLink size={14}/></a><a className="button" href={detail.run.resolution.later_run.commit_url} target="_blank" rel="noreferrer">Commit {detail.run.resolution.later_run.sha.slice(0,7)}</a></div>}</Inspector>}
    {selectedSummary && <Inspector label="Imported workflow findings" onClose={() => setDetail(null)}><div className="drawer-heading"><h2>{selectedSummary.run.name}</h2><button className="icon-button" aria-label="Close imported findings" onClick={() => setDetail(null)}><X size={18}/></button></div>
          <p>{selectedSummary.run.branch} · attempt {selectedSummary.run.attempt} · {selectedSummary.records} lines imported</p>
          <ResolutionTag resolution={selectedSummary.resolution}/><button disabled={!!busy} onClick={() => checkLaterCommits(selectedSummary)}><RefreshCw size={16}/>{busy === `resolution-${selectedSummary.run.id}` ? 'Checking later commits…' : 'Check later commits'}</button>
          <div className="github-links"><a href={selectedSummary.run.url} target="_blank" rel="noreferrer">View workflow <ExternalLink size={13}/></a>{selectedSummary.run.commit_url && <a href={selectedSummary.run.commit_url} target="_blank" rel="noreferrer">Commit {selectedSummary.run.sha.slice(0, 7)}</a>}{selectedSummary.run.pull_requests.map(pr => <a key={pr.number} href={pr.url} target="_blank" rel="noreferrer">PR #{pr.number}</a>)}</div>
          {selectedSummary.truncated && <p className="notice">Showing {selectedSummary.records} of {selectedSummary.available_lines} nonempty log lines, with errors prioritized. Review the full run on GitHub for complete context.</p>}
          {selectedSummary.summary.findings.map(finding => <div className="github-finding" key={finding.title}><h3>{finding.title}</h3><ResolutionTag resolution={selectedSummary.resolution} compact/><p>{finding.next_step}</p>{finding.evidence.map(evidence => <details key={evidence.record_id}><summary>Record #{evidence.record_id} · {evidence.file}:{evidence.line}</summary><pre>{evidence.message}</pre></details>)}</div>)}
          <p className="muted">{selectedSummary.summary.note}</p><button onClick={() => onSelect(selectedSummary.source)}>Open imported application</button><p className="muted"><small>Imported {new Date(selectedSummary.imported_at).toLocaleString()}. Log retention applies; saved summaries remain available.</small></p>

    </Inspector>}
  </section>;
}
