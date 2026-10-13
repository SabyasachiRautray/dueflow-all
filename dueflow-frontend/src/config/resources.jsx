// One entry per backend resource. The generic <ResourcePage> renders the
// table, create/edit form and delete flow from this config alone.
import Badge from '../components/ui/Badge';
import RefValue from '../components/common/RefValue';
import { formatINR, formatDate, formatDateTime, shortJson } from '../utils/format';

const ref = (resource) => (row, key) => <RefValue resource={resource} id={row[key]} />;
const daysChip = (row) => {
  const d = row.days_remaining;
  if (d == null) return '—';
  const cls = d < 0 ? 'text-red-600' : d <= 7 ? 'text-orange-600' : d <= 15 ? 'text-amber-600' : 'text-slate-700';
  return <span className={`font-medium tabular-nums ${cls}`}>{d < 0 ? `${-d}d late` : `${d}d`}</span>;
};

const RISK = ['safe', 'watch', 'urgent', 'overdue', 'not_applicable'];

export const RESOURCES = {
  invoices: {
    title: 'Invoices', singular: 'invoice', path: 'invoices',
    subtitle: 'Purchase invoices tracked against the 45-day MSME payment deadline.',
    writeRoles: ['admin', 'approver'],
    columns: [
      { key: 'invoice_no', label: 'Invoice' },
      { key: 'vendor_id', label: 'Vendor', render: (r) => ref('vendors')(r, 'vendor_id') },
      { key: 'due_date', label: 'Due', render: (r) => formatDate(r.due_date) },
      { key: 'days_remaining', label: 'Days left', render: daysChip },
      { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatINR(r.amount) },
      { key: 'amount_paid', label: 'Paid', align: 'right', render: (r) => formatINR(r.amount_paid) },
      { key: 'risk_level', label: 'Risk', render: (r) => <Badge value={r.risk_level} /> },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    fields: [
      { name: 'vendor_id', type: 'ref', ref: 'vendors', required: true, label: 'Vendor' },
      { name: 'invoice_no', required: true, label: 'Invoice no.' },
      { name: 'invoice_date', type: 'date', required: true },
      { name: 'acceptance_date', type: 'date', required: true, label: 'Acceptance date' },
      { name: 'amount', type: 'number', required: true },
      { name: 'amount_paid', type: 'number', label: 'Amount paid' },
      { name: 'due_date', type: 'date' },
      { name: 'risk_level', type: 'select', options: RISK, label: 'Risk level' },
      { name: 'status', type: 'select', options: ['open', 'planned', 'approved', 'paid', 'disputed'] },
      { name: 'dispute_note', type: 'textarea', label: 'Dispute note' },
    ],
  },

  vendors: {
    title: 'Vendors', singular: 'vendor', path: 'vendors',
    subtitle: 'Suppliers with their Udyam / GST verification and MSME classification.',
    writeRoles: ['admin', 'approver'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'msme_type', label: 'MSME type', render: (r) => <Badge value={r.msme_type} tone={r.msme_type === 'unknown' ? 'slate' : 'blue'} /> },
      { key: 'activity_type', label: 'Activity' },
      { key: 'verification_status', label: 'Verification', render: (r) => <Badge value={r.verification_status} /> },
      { key: 'agreed_credit_days', label: 'Credit days', align: 'right' },
      { key: 'email', label: 'Email' },
    ],
    fields: [
      { name: 'name', required: true },
      { name: 'gstin', label: 'GSTIN' },
      { name: 'udyam_no', label: 'Udyam no.' },
      { name: 'msme_type', type: 'select', options: ['micro', 'small', 'medium', 'non_msme', 'unknown'], label: 'MSME type' },
      { name: 'activity_type', type: 'select', options: ['manufacturer', 'trader', 'service', 'unknown'], label: 'Activity type' },
      { name: 'verification_status', type: 'select', options: ['verified', 'pending', 'failed', 'manual_review'], label: 'Verification' },
      { name: 'agreed_credit_days', type: 'number', label: 'Agreed credit days' },
      { name: 'email', type: 'email' },
      { name: 'bank_account_ref', label: 'Bank account ref' },
    ],
  },

  'ledger-imports': {
    title: 'Ledger imports', singular: 'ledger import', path: 'ledger-imports',
    subtitle: 'Purchase-ledger files the agent has ingested.',
    writeRoles: ['admin', 'approver'],
    defaults: (user) => ({ uploaded_by: user?.id }),
    columns: [
      { key: 'file_name', label: 'File' },
      { key: 'row_count', label: 'Rows', align: 'right' },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      { key: 'uploaded_by', label: 'Uploaded by', render: (r) => ref('users')(r, 'uploaded_by') },
      { key: 'created_at', label: 'Created', render: (r) => formatDateTime(r.created_at) },
    ],
    fields: [
      { name: 'file_name', required: true, label: 'File name' },
      { name: 'file_hash', required: true, label: 'File hash (SHA-256)', placeholder: '64 hex characters' },
      { name: 'row_count', type: 'number', label: 'Row count' },
      { name: 'uploaded_by', type: 'ref', ref: 'users', required: true, label: 'Uploaded by' },
      { name: 'status', type: 'select', options: ['processing', 'done', 'failed'] },
    ],
  },

  'agent-runs': {
    title: 'Agent runs', singular: 'agent run', path: 'agent-runs',
    subtitle: 'Each run reads the ledger, ranks at-risk invoices under the weekly budget and asks for approval.',
    writeRoles: ['admin', 'approver'],
    detailPath: (row) => `/agent-runs/${row.id}`,
    canEdit: false,
    defaults: (user) => ({ triggered_by: user?.id }),
    createLabel: 'Start run',
    columns: [
      { key: 'id', label: 'Run' , render: (r) => `#${r.id}` },
      { key: 'goal', label: 'Goal' },
      { key: 'weekly_budget', label: 'Weekly budget', align: 'right', render: (r) => formatINR(r.weekly_budget) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      { key: 'triggered_by', label: 'Triggered by', render: (r) => ref('users')(r, 'triggered_by') },
      { key: 'started_at', label: 'Started', render: (r) => formatDateTime(r.started_at) },
    ],
    fields: [
      { name: 'goal', type: 'textarea', placeholder: 'e.g. Clear all MSME invoices due in the next 10 days' },
      { name: 'weekly_budget', type: 'number', required: true, label: 'Weekly cash budget (₹)' },
      { name: 'triggered_by', type: 'ref', ref: 'users', label: 'Triggered by' },
    ],
  },

  'agent-steps': {
    title: 'Agent steps', singular: 'agent step', path: 'agent-steps', readOnly: true,
    subtitle: 'Step-by-step trace of everything the agent did, including reasoning and retries.',
    columns: [
      { key: 'run_id', label: 'Run', render: (r) => `#${r.run_id}` },
      { key: 'step_no', label: 'Step', align: 'right' },
      { key: 'stage', label: 'Stage', render: (r) => <Badge value={r.stage} tone="blue" /> },
      { key: 'tool_name', label: 'Tool' },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      { key: 'retry_count', label: 'Retries', align: 'right' },
      { key: 'duration_ms', label: 'Duration', align: 'right', render: (r) => (r.duration_ms != null ? `${r.duration_ms} ms` : '—') },
      { key: 'tokens_used', label: 'Tokens', align: 'right' },
    ],
  },

  'payment-plans': {
    title: 'Payment plans', singular: 'payment plan', path: 'payment-plans', readOnly: true,
    subtitle: 'Cash-aware payment batches proposed by the agent. Open one to review and approve.',
    detailPath: (row) => `/payment-plans/${row.id}`,
    columns: [
      { key: 'id', label: 'Plan', render: (r) => `#${r.id}` },
      { key: 'run_id', label: 'Run', render: (r) => `#${r.run_id}` },
      { key: 'total_amount', label: 'Total', align: 'right', render: (r) => formatINR(r.total_amount) },
      { key: 'budget_left', label: 'Budget left', align: 'right', render: (r) => formatINR(r.budget_left) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      { key: 'created_at', label: 'Created', render: (r) => formatDateTime(r.created_at) },
    ],
  },

  'plan-items': {
    title: 'Plan items', singular: 'plan item', path: 'plan-items', readOnly: true,
    subtitle: 'Individual invoices selected for payment inside each plan.',
    columns: [
      { key: 'plan_id', label: 'Plan', render: (r) => `#${r.plan_id}` },
      { key: 'invoice_id', label: 'Invoice', render: (r) => r.Invoice?.invoice_no || `#${r.invoice_id}` },
      { key: 'priority', label: 'Priority', align: 'right' },
      { key: 'pay_amount', label: 'Pay amount', align: 'right', render: (r) => formatINR(r.pay_amount) },
      { key: 'decision', label: 'Decision', render: (r) => <Badge value={r.decision} /> },
      { key: 'reason', label: 'Reason' },
    ],
  },

  approvals: {
    title: 'Approvals', singular: 'approval', path: 'approvals', readOnly: true,
    subtitle: 'Human sign-offs. No payment or notice goes out without one.',
    columns: [
      { key: 'plan_id', label: 'Plan', render: (r) => `#${r.plan_id}` },
      { key: 'approver_id', label: 'Approver', render: (r) => ref('users')(r, 'approver_id') },
      { key: 'decision', label: 'Decision', render: (r) => <Badge value={r.decision} /> },
      { key: 'comment', label: 'Comment' },
      { key: 'decided_at', label: 'Decided', render: (r) => formatDateTime(r.decided_at) },
    ],
  },

  payments: {
    title: 'Payments', singular: 'payment', path: 'payments', readOnly: true,
    subtitle: 'Executed payments with idempotency keys and gateway references.',
    columns: [
      { key: 'invoice_id', label: 'Invoice', render: (r) => r.Invoice?.invoice_no || `#${r.invoice_id}` },
      { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatINR(r.amount) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      { key: 'gateway_ref', label: 'Gateway ref' },
      { key: 'idempotency_key', label: 'Idempotency key' },
      { key: 'paid_at', label: 'Paid', render: (r) => formatDateTime(r.paid_at) },
    ],
  },

  'vendor-notices': {
    title: 'Vendor notices', singular: 'vendor notice', path: 'vendor-notices',
    subtitle: 'Drafted payment schedules, certificate requests and delay notices.',
    writeRoles: ['admin', 'approver'],
    columns: [
      { key: 'vendor_id', label: 'Vendor', render: (r) => ref('vendors')(r, 'vendor_id') },
      { key: 'type', label: 'Type', render: (r) => <Badge value={r.type} tone="blue" /> },
      { key: 'subject', label: 'Subject' },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      { key: 'sent_at', label: 'Sent', render: (r) => formatDateTime(r.sent_at) },
    ],
    fields: [
      { name: 'vendor_id', type: 'ref', ref: 'vendors', required: true, label: 'Vendor' },
      { name: 'invoice_id', type: 'ref', ref: 'invoices', label: 'Invoice' },
      { name: 'type', type: 'select', options: ['payment_scheduled', 'certificate_request', 'delay_notice'], required: true },
      { name: 'status', type: 'select', options: ['drafted', 'approved', 'sent', 'failed'] },
      { name: 'subject' },
      { name: 'body', type: 'textarea' },
    ],
  },

  'compliance-rules': {
    title: 'Compliance rules', singular: 'compliance rule', path: 'compliance-rules',
    subtitle: 'CA-reviewed, versioned rule set (Sec. 43B(h), MSMED Act). Shared across organizations.',
    writeRoles: ['admin'],
    columns: [
      { key: 'rule_code', label: 'Rule' },
      { key: 'version', label: 'Version', align: 'right' },
      { key: 'description', label: 'Description' },
      { key: 'reviewed_by', label: 'Reviewed by' },
      { key: 'effective_from', label: 'Effective', render: (r) => formatDate(r.effective_from) },
      { key: 'is_active', label: 'Active', render: (r) => <Badge value={String(!!r.is_active)} /> },
    ],
    fields: [
      { name: 'rule_code', required: true, label: 'Rule code' },
      { name: 'version', type: 'number', required: true },
      { name: 'description', type: 'textarea' },
      { name: 'params', type: 'json', label: 'Params (JSON)' },
      { name: 'reviewed_by', label: 'Reviewed by' },
      { name: 'effective_from', type: 'date', label: 'Effective from' },
      { name: 'is_active', type: 'boolean', label: 'Active' },
    ],
  },

  'audit-logs': {
    title: 'Audit logs', singular: 'audit entry', path: 'audit-logs', readOnly: true,
    subtitle: 'Append-only record of every decision made by users, the agent and the system.',
    columns: [
      { key: 'created_at', label: 'When', render: (r) => formatDateTime(r.created_at) },
      { key: 'actor_type', label: 'Actor', render: (r) => <Badge value={r.actor_type} tone="blue" /> },
      { key: 'actor_id', label: 'Actor id' },
      { key: 'action', label: 'Action' },
      { key: 'entity_type', label: 'Entity' },
      { key: 'entity_id', label: 'Entity id' },
      { key: 'details', label: 'Details', render: (r) => <span className="font-mono text-xs">{shortJson(r.details)}</span> },
    ],
  },

  'agent-memory': {
    title: 'Agent memory', singular: 'memory entry', path: 'agent-memory',
    subtitle: 'What the agent has learned about your vendors and organization.',
    writeRoles: ['admin'],
    columns: [
      { key: 'memory_key', label: 'Key' },
      { key: 'vendor_id', label: 'Vendor', render: (r) => (r.vendor_id ? ref('vendors')(r, 'vendor_id') : 'Organization-wide') },
      { key: 'memory_value', label: 'Value', render: (r) => <span className="font-mono text-xs">{shortJson(r.memory_value)}</span> },
      { key: 'updated_at', label: 'Updated', render: (r) => formatDateTime(r.updated_at) },
    ],
    fields: [
      { name: 'memory_key', required: true, label: 'Key' },
      { name: 'vendor_id', type: 'ref', ref: 'vendors', label: 'Vendor (optional)' },
      { name: 'memory_value', type: 'json', label: 'Value (JSON)' },
    ],
  },

  notifications: {
    title: 'Notifications', singular: 'notification', path: 'notifications', canCreate: false, canEdit: false,
    subtitle: 'Alerts raised for approvers and admins.',
    writeRoles: ['admin', 'approver', 'viewer'],
    columns: [
      { key: 'type', label: 'Type', render: (r) => <Badge value={r.type} tone="blue" /> },
      { key: 'payload', label: 'Payload', render: (r) => <span className="font-mono text-xs">{shortJson(r.payload)}</span> },
      { key: 'read_at', label: 'Read', render: (r) => (r.read_at ? formatDateTime(r.read_at) : <Badge value="unread" tone="amber" />) },
      { key: 'created_at', label: 'Created', render: (r) => formatDateTime(r.created_at) },
    ],
  },

  users: {
    title: 'Users', singular: 'user', path: 'users',
    subtitle: 'People in your organization. Only admins can assign elevated roles.',
    writeRoles: ['admin'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', render: (r) => <Badge value={r.role} tone={r.role === 'admin' ? 'red' : r.role === 'approver' ? 'blue' : 'slate'} /> },
      { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
    ],
    fields: [
      { name: 'name', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'password', type: 'password', required: true },
      { name: 'role', type: 'select', options: ['viewer', 'approver', 'admin'], required: true },
    ],
  },

  organizations: {
    title: 'Organization', singular: 'organization', path: 'organizations', canCreate: false, canDelete: false,
    subtitle: 'Your company profile.',
    writeRoles: ['admin'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'gstin', label: 'GSTIN' },
    ],
    fields: [
      { name: 'name', required: true },
      { name: 'gstin', label: 'GSTIN' },
    ],
  },
};
