import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, MessageSquareWarning, Send, X } from 'lucide-react';
import {
  useGetOneQuery, useGetListQuery, useUpdateOneMutation, useDecidePlanMutation, errorMessage,
} from '../../services';
import { selectUser } from '../../features/auth/authSlice';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import DataTable from '../../components/common/DataTable';
import RefValue from '../../components/common/RefValue';
import { formatDate, formatDateTime, formatINR } from '../../utils/format';

export default function PaymentPlanDetailPage() {
  const { id } = useParams();
  const user = useSelector(selectUser);
  const [comment, setComment] = useState('');

  const plan = useGetOneQuery({ resource: 'payment-plans', id });
  // No plan_id filter on the API yet: fetch the newest page and filter on the client.
  const items = useGetListQuery({ resource: 'plan-items', limit: 100 });
  const approvals = useGetListQuery({ resource: 'approvals', limit: 100 });
  const [decide, decideState] = useDecidePlanMutation();
  const [updateOne, submitState] = useUpdateOneMutation();

  const planItems = useMemo(
    () => (items.data?.data || []).filter((i) => String(i.plan_id) === String(id)).sort((a, b) => a.priority - b.priority),
    [items.data, id],
  );
  const history = useMemo(
    () => (approvals.data?.data || []).filter((a) => String(a.plan_id) === String(id)),
    [approvals.data, id],
  );

  if (plan.isLoading) return <Spinner />;
  if (plan.error) return <Alert>{errorMessage(plan.error)}</Alert>;
  const p = plan.data;

  const canDecide = ['admin', 'approver'].includes(user?.role);
  const isPending = p.status === 'pending_approval';
  const isDraft = p.status === 'draft';
  const itemsTotal = planItems.reduce((s, i) => s + Number(i.pay_amount || 0), 0);
  const budgetTotal = Number(p.total_amount || 0) + Number(p.budget_left || 0);
  const used = budgetTotal ? Math.min(100, Math.round((Number(p.total_amount) / budgetTotal) * 100)) : 0;

  const act = (decision) => async () => {
    if (decision === 'changes_requested' && !comment.trim()) return;
    const res = await decide({ planId: p.id, approverId: user.id, decision, comment: comment.trim() || undefined });
    if (!res.error) setComment('');
  };
  const submitForApproval = () => updateOne({ resource: 'payment-plans', id: p.id, body: { status: 'pending_approval' } });

  const itemCols = [
    { key: 'priority', label: '#', align: 'right' },
    { key: 'invoice_id', label: 'Invoice', render: (r) => r.Invoice?.invoice_no || `#${r.invoice_id}` },
    { key: 'vendor', label: 'Vendor', render: (r) => <RefValue resource="vendors" id={r.Invoice?.vendor_id} /> },
    { key: 'due', label: 'Due', render: (r) => formatDate(r.Invoice?.due_date) },
    { key: 'pay_amount', label: 'Pay', align: 'right', render: (r) => formatINR(r.pay_amount) },
    { key: 'reason', label: 'Why the agent chose it', render: (r) => <span className="whitespace-normal text-slate-600">{r.reason || '—'}</span> },
    { key: 'decision', label: 'Decision', render: (r) => <Badge value={r.decision} /> },
  ];

  return (
    <>
      <Link to="/payment-plans" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Payment plans</Link>
      <PageHeader
        title={`Payment plan #${p.id}`}
        subtitle={<>Proposed by <Link className="font-medium text-brand-700 hover:underline" to={`/agent-runs/${p.run_id}`}>agent run #{p.run_id}</Link> · {formatDateTime(p.created_at)}</>}
        actions={<Badge value={p.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan total</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatINR(p.total_amount)}</div></Card>
        <Card><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget left</div><div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">{formatINR(p.budget_left)}</div></Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget used</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{used}%</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${used}%` }} /></div>
        </Card>
      </div>

      {p.summary && <Card title="Agent summary" className="mt-6"><p className="whitespace-pre-line text-sm text-slate-700">{p.summary}</p></Card>}

      <Card title={`Invoices in this plan (${planItems.length})`} padded={false} className="mt-6">
        <DataTable columns={itemCols} rows={planItems} loading={items.isLoading} empty="No items found for this plan." />
        {planItems.length > 0 && Math.abs(itemsTotal - Number(p.total_amount)) > 0.5 && (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-amber-700">
            Listed items add up to {formatINR(itemsTotal)}, which differs from the plan total. Some items may be on another page of results.
          </p>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Approval">
          {isPending && canDecide && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Nothing is paid or sent to vendors until you approve this plan.</p>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                rows={3}
                maxLength={500}
                placeholder="Comment (required when requesting changes)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Alert>{decideState.isError && errorMessage(decideState.error)}</Alert>
              <div className="flex flex-wrap gap-2">
                <Button variant="success" onClick={act('approved')} disabled={decideState.isLoading}><Check size={16} /> Approve</Button>
                <Button variant="secondary" onClick={act('changes_requested')} disabled={decideState.isLoading || !comment.trim()}><MessageSquareWarning size={16} /> Request changes</Button>
                <Button variant="danger" onClick={act('rejected')} disabled={decideState.isLoading}><X size={16} /> Reject</Button>
              </div>
            </div>
          )}
          {isPending && !canDecide && <p className="text-sm text-slate-600">Waiting for an approver or admin to review this plan.</p>}
          {isDraft && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">This plan is still a draft. Submit it to put it in front of approvers.</p>
              <Alert>{submitState.isError && errorMessage(submitState.error)}</Alert>
              {canDecide && <Button onClick={submitForApproval} disabled={submitState.isLoading}><Send size={16} /> Submit for approval</Button>}
            </div>
          )}
          {!isPending && !isDraft && <p className="text-sm text-slate-600">This plan is <strong>{p.status.replace(/_/g, ' ')}</strong>; no further decision is needed.</p>}
        </Card>

        <Card title="Decision history" padded={false}>
          {approvals.isLoading ? <Spinner /> : !history.length ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No decisions recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((a) => (
                <li key={a.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900"><RefValue resource="users" id={a.approver_id} /></span>
                    <Badge value={a.decision} />
                  </div>
                  {a.comment && <p className="mt-1 text-slate-600">{a.comment}</p>}
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(a.decided_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
