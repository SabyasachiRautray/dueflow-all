import { Link, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ResourcePage from './components/common/ResourcePage';
import { RESOURCES } from './config/resources';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AgentRunDetailPage from './pages/agent/AgentRunDetailPage';
import PaymentPlanDetailPage from './pages/plans/PaymentPlanDetailPage';

const NotFound = () => (
  <div className="py-24 text-center">
    <p className="text-sm text-slate-500">That page doesn't exist.</p>
    <Link to="/" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">Back to dashboard</Link>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="agent-runs/:id" element={<AgentRunDetailPage />} />
        <Route path="payment-plans/:id" element={<PaymentPlanDetailPage />} />
        {/* One generic page per backend resource, driven by config/resources.jsx.
            `key` forces a remount so page/modal state never leaks between resources. */}
        {Object.keys(RESOURCES)
          .filter((k) => k !== 'organizations')
          .map((k) => (
            <Route key={k} path={k} element={<ResourcePage key={k} resourceKey={k} />} />
          ))}
        <Route path="organization" element={<ResourcePage key="organizations" resourceKey="organizations" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
