import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Ban } from 'lucide-react';
import { useGetOneQuery, useGetListQuery, useUpdateOneMutation, errorMessage } from '../../services';
import { selectUser } from '../../features/auth/authSlice';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import DataTable from '../../components/common/DataTable';
import RefValue from '../../components/common/RefValue';
import { formatDateTime, formatINR } from '../../utils/format';

const Json = ({ label, value }) =>
  value == null ? null : (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">{label}</summary>
      <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-700">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );

export default function AgentRunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const run = useGetOneQuery({ resource: 'agent-runs', id });
  // The API has no run_id filter yet, so fetch the newest page and filter here.
  const steps = useGetListQuery({ resource: 'agent-steps', limit: 100 });
  const plans = useGetListQuery({ resource: 'payment-plans', limit: 100 });
  const [updateOne, cancelState] = useUpdateOneMutation();

  const runSteps = useMemo(
    () => (steps.data?.data || []).filter((s) => String(s.run_id) === String(id)).sort((a, b) => a.step_no - b.step_no),
    [steps.data, id],
  );
  const runPlans = useMemo(() => (plans.data?.data || []).filter((p) => String(p.run_id) === String(id)), [plans.data, id]);

  if (run.isLoading) return <Spinner />;
  if (run.error) return <Alert>{errorMessage(run.error)}</Alert>;
  const r = run.data;
  const canCancel = ['admin', 'approver'].includes(user?.role) && ['running', 'awaiting_approval'].includes(r.status);
  const tokens = runSteps.reduce((s, x) => s + (x.tokens_used || 0), 0);

  const cancel = async () => {
    if (!window.confirm('Cancel this run? The agent will stop and nothing further will be executed.')) return;
    await updateOne({ resource: 'agent-runs', id, body: { status: 'cancelled' } });
  };

  const planCols = [
    { key: 'id', label: 'Plan', render: (p) => `#${p.id}` },
    { key: 'total_amount', label: 'Total', align: 'right', render: (p) => formatINR(p.total_amount) },
    { key: 'budget_left', label: 'Budget left', align: 'right', render: (p) => formatINR(p.budget_left) },
    { key: 'status', label: 'Status', render: (p) => <Badge value={p.status} /> },
  ];

  return (
    <>
      <Link to="/agent-runs" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Agent runs</Link>
      <PageHeader
        title={`Run #${r.id}`}
        subtitle={r.goal || 'No goal set'}
        actions={canCancel && <Button variant="danger" onClick={cancel} disabled={cancelState.isLoading}><Ban size={16} /> Cancel run</Button>}
      />
      {cancelState.isError && <div className="mb-4"><Alert>{errorMessage(cancelState.error)}</Alert></div>}

      <Card className="mb-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Status', <Badge value={r.status} />],
            ['Weekly budget', formatINR(r.weekly_budget)],
            ['Triggered by', <RefValue resource="users" id={r.triggered_by} />],
            ['Started', formatDateTime(r.started_at)],
            ['Finished', formatDateTime(r.finished_at)],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-xs font-medium text-slate-500">{k}</dt><dd className="mt-1 font-medium text-slate-900">{v}</dd></div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card title={`Step trace · ${runSteps.length} steps · ${tokens.toLocaleString('en-IN')} tokens`}>
            {steps.isLoading ? <Spinner /> : !runSteps.length ? (
              <p className="py-6 text-center text-sm text-slate-500">No steps recorded for this run yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-slate-200 pl-6">
                {runSteps.map((s) => (
                  <li key={s.id} className="relative">
                    <span className={`absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full ring-4 ring-white ${s.status === 'failed' ? 'bg-red-500' : s.status === 'retry' ? 'bg-amber-500' : s.status === 'skipped' ? 'bg-slate-300' : 'bg-brand-500'}`} />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium tabular-nums text-slate-900">Step {s.step_no}</span>
                      <Badge value={s.stage} tone="blue" />
                      <Badge value={s.status} />
                      {s.tool_name && <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{s.tool_name}</code>}
                      <span className="ml-auto text-xs text-slate-500">
                        {s.duration_ms != null && `${s.duration_ms} ms`}{s.retry_count ? ` · ${s.retry_count} retries` : ''}
                      </span>
                    </div>
                    {s.reasoning && <p className="mt-1.5 text-sm text-slate-600">{s.reasoning}</p>}
                    {s.error && <p className="mt-1.5 text-sm text-red-600">{s.error}</p>}
                    <Json label="Input" value={s.input_json} />
                    <Json label="Output" value={s.output_json} />
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <Card title="Payment plans from this run" padded={false}>
          <DataTable columns={planCols} rows={runPlans} loading={plans.isLoading} empty="No plan generated yet." onRowClick={(p) => navigate(`/payment-plans/${p.id}`)} />
        </Card>
      </div>
    </>
  );
}
