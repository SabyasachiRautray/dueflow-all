import { humanize } from '../../utils/format';

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const MAP = {
  safe: 'green', paid: 'green', success: 'green', approved: 'green', done: 'green', verified: 'green', completed: 'green', sent: 'green', executed: 'green', true: 'green',
  watch: 'amber', pending: 'amber', pending_approval: 'amber', drafted: 'amber', processing: 'amber', planned: 'amber', initiated: 'amber', draft: 'amber', retry: 'amber', deferred: 'amber', manual_review: 'amber',
  running: 'blue', awaiting_approval: 'blue', changes_requested: 'orange', urgent: 'orange',
  overdue: 'red', failed: 'red', rejected: 'red', disputed: 'red', cancelled: 'red', false: 'slate',
};

export default function Badge({ value, tone }) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  const key = String(value);
  const cls = TONES[tone || MAP[key] || 'slate'];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>{humanize(key)}</span>;
}
