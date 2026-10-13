import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, IndianRupee, ClipboardCheck } from 'lucide-react';
import { useGetListQuery, errorMessage } from '../../services';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import DataTable from '../../components/common/DataTable';
import RefValue from '../../components/common/RefValue';
import { formatDate, formatINR, formatDateTime } from '../../utils/format';

// The agent loop from the product brief; shown so users know where approval sits.
const PIPELINE = [
  ['Ingest', 'Read ledger & vendors'],
  ['Classify', 'Verify Udyam / GST'],
  ['Compute', '43B(h) deadline'],
  ['Plan', 'Cash-aware batch'],
  ['Approve', 'Human sign-off'],
  ['Execute', 'Pay, notify & log'],
];

const owed = (i) => Number(i.amount || 0) - Number(i.amount_paid || 0);

export default function DashboardPage() {
  // The API caps page size at 100, so the dashboard summarises the 100 newest invoices.
  const invoices = useGetListQuery({ resource: 'invoices', limit: 100 });
  const plans = useGetListQuery({ resource: 'payment-plans', limit: 100 });
  const runs = useGetListQuery({ resource: 'agent-runs', limit: 5 });

  const stats = useMemo(() => {
    const open = (invoices.data?.data || []).filter((i) => i.status !== 'paid');
    const byRisk = (r) => open.filter((i) => i.risk_level === r);
    const atRisk = [...byRisk('urgent'), ...byRisk('overdue')];
    const attention = open
      .filter((i) => ['watch', 'urgent', 'overdue'].includes(i.risk_level))
      .sort((a, b) => (a.days_remaining ?? 9999) - (b.days_remaining ?? 9999))
      .slice(0, 8);
    return {
      outstanding: open.reduce((s, i) => s + owed(i), 0),
      atRiskAmount: atRisk.reduce((s, i) => s + owed(i), 0),
      overdue: byRisk('overdue').length,
      urgent: byRisk('urgent').length,
      watch: byRisk('watch').length,
      attention,
    };
  }, [invoices.data]);

  const pendingPlans = (plans.data?.data || []).filter((p) => p.status === 'pending_approval');
  const truncated = invoices.data && invoices.data.totalItems > invoices.data.data.length;

  const attentionCols = [
    { key: 'invoice_no', label: 'Invoice' },
    { key: 'vendor_id', label: 'Vendor', render: (r) => <RefValue resource="vendors" id={r.vendor_id} /> },
    { key: 'due_date', label: 'Due', render: (r) => formatDate(r.due_date) },
    {
      key: 'days_remaining', label: 'Days left',
      render: (r) => (r.days_remaining == null ? '—' : r.days_remaining < 0 ? `${-r.days_remaining}d late` : `${r.days_remaining}d`),
    },
    { key: 'amount', label: 'Owed', align: 'right', render: (r) => formatINR(owed(r)) },
    { key: 'risk_level', label: 'Risk', render: (r) => <Badge value={r.risk_level} /> },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Where your MSME payables stand against the 45-day deadline."
        actions={<Link to="/agent-runs" className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">Go to agent runs</Link>}
      />

      {invoices.error && <div className="mb-4"><Alert>{errorMessage(invoices.error)}</Alert></div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" value={formatINR(stats.outstanding)} hint="Open invoices, unpaid balance" icon={IndianRupee} />
        <StatCard label="At risk now" value={formatINR(stats.atRiskAmount)} hint={`${stats.urgent} urgent · ${stats.overdue} overdue`} tone={stats.overdue ? 'red' : stats.urgent ? 'orange' : 'green'} icon={AlertTriangle} />
        <StatCard label="Watch list" value={stats.watch} hint="Approaching the deadline" tone="amber" icon={Clock} />
        <StatCard label="Awaiting your approval" value={pendingPlans.length} hint={pendingPlans.length ? 'Payment plans need sign-off' : 'Nothing pending'} tone={pendingPlans.length ? 'orange' : 'green'} icon={ClipboardCheck} />
      </div>

      {pendingPlans.length > 0 && (
        <div className="mt-6">
          <Card title="Plans awaiting approval" padded={false}>
            <ul className="divide-y divide-slate-100">
              {pendingPlans.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link to={`/payment-plans/${p.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-900">Plan #{p.id} · run #{p.run_id}</span>
                    <span className="text-slate-500">{formatINR(p.total_amount)} · {formatDateTime(p.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card title="Needs attention" padded={false} action={<Link to="/invoices" className="text-xs font-medium text-brand-700 hover:underline">All invoices</Link>}>
            <DataTable columns={attentionCols} rows={stats.attention} loading={invoices.isLoading} empty="No invoices on the watch list. 🎉" />
            {truncated && (
              <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                Summarising the newest {invoices.data.data.length} of {invoices.data.totalItems} invoices.
              </p>
            )}
          </Card>
        </div>

        <Card title="Recent agent runs" padded={false} action={<Link to="/agent-runs" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>}>
          {runs.isLoading ? <Spinner /> : (
            <ul className="divide-y divide-slate-100">
              {(runs.data?.data || []).map((r) => (
                <li key={r.id}>
                  <Link to={`/agent-runs/${r.id}`} className="block px-5 py-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">Run #{r.id}</span>
                      <Badge value={r.status} />
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">{r.goal || 'No goal set'} · {formatINR(r.weekly_budget)}</div>
                  </Link>
                </li>
              ))}
              {!runs.data?.data?.length && <li className="px-5 py-8 text-center text-sm text-slate-500">No runs yet.</li>}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="How Dueflow works">
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PIPELINE.map(([name, desc], i) => (
              <li key={name} className={`rounded-lg border p-3 ${name === 'Approve' ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                <div className="text-xs font-medium text-brand-700">{i + 1} · {name}</div>
                <div className="mt-0.5 text-xs text-slate-600">{desc}</div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-slate-500">No payment or vendor notice goes out without a human approval.</p>
        </Card>
      </div>
    </>
  );
}
