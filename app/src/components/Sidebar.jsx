import {
  LayoutDashboard, Bot, Workflow, Boxes, FileText, Shield as ShieldIcon, AlertTriangle,
  Timer, UserCheck, ScrollText, Radio, Landmark, Scale, BookOpen, Settings, LogOut
} from 'lucide-react';
import Shield from './Shield.jsx';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'orchestration', label: 'Orchestration', icon: Workflow },
  { id: 'registry', label: 'Model Registry', icon: Boxes },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'guardrails', label: 'Guardrails', icon: ShieldIcon },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'sla', label: 'SLA & Escalation', icon: Timer },
  { id: 'approvals', label: 'Approvals & SoD', icon: UserCheck },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'siem', label: 'SIEM Streaming', icon: Radio },
  { id: 'governance', label: 'Governance', icon: Landmark },
  { id: 'compliance', label: 'Compliance', icon: Scale },
  { id: 'guide', label: 'User Guide', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ page, setPage, user, onLogout, chainIntact }) {
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-ink-950 border-r border-ink-700/50 flex flex-col">
      <div className="px-5 py-5 border-b border-ink-700/40 flex items-center gap-3">
        <Shield className="w-8 h-8 text-ok shrink-0" />
        <div>
          <p className="text-lg font-bold text-slate-50 tracking-tight leading-none">SentinAI</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1">agent security ops</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-5 py-2 text-sm text-left transition-colors
              ${page === id ? 'bg-ink-800 text-slate-50 border-l-2 border-ok' : 'text-slate-400 hover:text-slate-200 border-l-2 border-transparent'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-ink-700/40 text-xs">
        <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">Active role</p>
        <p className="text-slate-200 font-medium">SecOps Analyst</p>
        <div className="flex items-center gap-2 mt-2">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full border border-ink-700/50" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-ink-800 border border-ink-700/50 flex items-center justify-center text-[10px] font-semibold text-slate-200 uppercase">
              {(user?.login || '?').slice(0, 2)}
            </span>
          )}
          <p className="text-slate-400 truncate">{user?.login}</p>
        </div>
        <p className={`mt-2 font-mono text-[10px] ${chainIntact ? 'text-ok' : 'text-crit'}`}>
          audit chain {chainIntact ? 'verified' : 'TAMPERED'}
        </p>
        <button onClick={onLogout} className="btn-ghost mt-3 flex items-center gap-1.5">
          <LogOut className="w-3 h-3" /> Log out
        </button>
      </div>
    </aside>
  );
}
