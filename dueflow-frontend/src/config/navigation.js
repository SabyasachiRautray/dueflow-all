import {
  LayoutDashboard, FileText, Building2, Upload, Bot, ClipboardList, ListChecks, CheckCircle2,
  Wallet, Footprints, Mail, Scale, ScrollText, Brain, Users, Landmark, Bell,
} from 'lucide-react';

export const NAV = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    group: 'Payables',
    items: [
      { to: '/invoices', label: 'Invoices', icon: FileText },
      { to: '/vendors', label: 'Vendors', icon: Building2 },
      { to: '/ledger-imports', label: 'Ledger imports', icon: Upload },
    ],
  },
  {
    group: 'Agent',
    items: [
      { to: '/agent-runs', label: 'Agent runs', icon: Bot },
      { to: '/payment-plans', label: 'Payment plans', icon: ClipboardList },
      { to: '/plan-items', label: 'Plan items', icon: ListChecks },
      { to: '/approvals', label: 'Approvals', icon: CheckCircle2 },
      { to: '/payments', label: 'Payments', icon: Wallet },
      { to: '/agent-steps', label: 'Agent steps', icon: Footprints },
    ],
  },
  {
    group: 'Compliance',
    items: [
      { to: '/vendor-notices', label: 'Vendor notices', icon: Mail },
      { to: '/compliance-rules', label: 'Compliance rules', icon: Scale },
      { to: '/audit-logs', label: 'Audit logs', icon: ScrollText },
      { to: '/agent-memory', label: 'Agent memory', icon: Brain },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/organization', label: 'Organization', icon: Landmark },
    ],
  },
];
