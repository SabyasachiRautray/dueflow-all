import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, selectToken } from '../../features/auth/authSlice';
import { useLoginMutation, errorMessage } from '../../services';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const STEPS = ['Ingest', 'Classify', 'Compute', 'Plan', 'Approve', 'Execute'];
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export default function LoginPage() {
  const token = useSelector(selectToken);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });

  if (token) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const res = await login(form);
    if (res.data) {
      dispatch(setCredentials({ token: res.data.token, user: res.data.user }));
      navigate(location.state?.from?.pathname || '/', { replace: true });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-slate-900 p-12 text-slate-300 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">D</div>
          <span className="text-lg font-semibold text-white">Dueflow</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">Pay MSME suppliers on time.<br />Keep the tax deduction.</h1>
          <p className="mt-4 max-w-md text-slate-400">
            Dueflow reads your ledger, verifies each vendor's MSME status, ranks payments under your cash limit and asks a human to approve — with every decision logged.
          </p>
          <ol className="mt-10 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                <span className="mr-1.5 text-brand-500">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-slate-500">45-day statutory deadline · Sec. 43B(h) · MSMED Act 2006</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use your organization account.</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
            <input className={input} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Password</span>
            <input className={input} type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <Alert>{error && errorMessage(error)}</Alert>
          <Button type="submit" className="w-full py-2.5" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  );
}
