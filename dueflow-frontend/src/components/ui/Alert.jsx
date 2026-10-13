const TONES = {
  error: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

export default function Alert({ tone = 'error', children }) {
  if (!children) return null;
  return <div role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${TONES[tone]}`}>{children}</div>;
}
