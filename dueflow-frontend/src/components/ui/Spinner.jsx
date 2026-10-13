import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Loader2 className="animate-spin" size={18} /> {label}
    </div>
  );
}
