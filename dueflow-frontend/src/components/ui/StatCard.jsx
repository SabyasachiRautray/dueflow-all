const ACCENT = {
  slate: 'text-slate-900',
  red: 'text-red-600',
  orange: 'text-orange-600',
  amber: 'text-amber-600',
  green: 'text-emerald-600',
};

export default function StatCard({ label, value, hint, tone = 'slate', icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
        {label} {Icon && <Icon size={16} className="text-slate-400" />}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${ACCENT[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
