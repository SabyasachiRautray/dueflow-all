import { humanize } from '../../utils/format';

// Read-only key/value view for records the UI does not allow editing.
export default function DetailView({ row }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {Object.entries(row)
        .filter(([, v]) => v === null || typeof v !== 'object' || !Array.isArray(v))
        .map(([k, v]) => (
          <div key={k} className={typeof v === 'object' && v !== null ? 'sm:col-span-2' : ''}>
            <dt className="text-xs font-medium text-slate-500">{humanize(k)}</dt>
            <dd className="mt-0.5 break-words text-sm text-slate-900">
              {v !== null && typeof v === 'object'
                ? <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2 font-mono text-xs">{JSON.stringify(v, null, 2)}</pre>
                : String(v ?? '—')}
            </dd>
          </div>
        ))}
    </dl>
  );
}
