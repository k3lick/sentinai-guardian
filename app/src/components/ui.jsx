import React from 'react';

export function Card({ className = '', children }) {
  return <section className={`card p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ title, sub }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const SEV_STYLES = {
  high: 'border-crit/50 text-crit',
  critical: 'border-crit/50 text-crit',
  medium: 'border-med/50 text-med',
  low: 'border-low/50 text-low',
  ok: 'border-ok/50 text-ok'
};

export function SeverityBadge({ level }) {
  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${SEV_STYLES[level] || SEV_STYLES.medium}`}>
      {level}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    healthy: 'border-ok/50 text-ok', DEGRADED: 'border-med/50 text-med',
    NOMINAL: 'border-ok/50 text-ok', offline: 'border-crit/50 text-crit',
    quarantined: 'border-high/50 text-high', clean: 'border-ok/50 text-ok'
  };
  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${map[status] || 'border-ink-600 text-slate-400'}`}>
      {status}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, hint, accent = 'text-ok' }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      {Icon && <Icon className={`w-5 h-5 mt-0.5 ${accent}`} />}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-50 font-mono">{value}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

export function Empty({ children = 'No data yet.' }) {
  return (
    <div className="text-center py-8 text-slate-600 text-sm">∅<p>{children}</p></div>
  );
}

export function useDb() {
  // Tiny subscription hook so pages re-render when the store changes.
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const h = () => force();
    window.addEventListener('sentinai:db-changed', h);
    return () => window.removeEventListener('sentinai:db-changed', h);
  }, []);
  return force;
}

export function notifyDbChanged() {
  window.dispatchEvent(new Event('sentinai:db-changed'));
}
