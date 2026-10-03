export default function LogBadge({log}) {return <span className={`badge ${log.severity_level<=3?'danger':log.severity_level===4?'warning':'neutral'}`}>{log.severity_label}</span>;}
