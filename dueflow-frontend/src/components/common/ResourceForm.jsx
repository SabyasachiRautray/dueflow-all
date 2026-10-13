import { useState } from 'react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { useRefOptions } from './RefValue';
import { humanize } from '../../utils/format';

const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50';

function RefSelect({ resource, ...rest }) {
  const options = useRefOptions(resource);
  return (
    <select className={input} {...rest}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const toInput = (field, v) => {
  if (v == null) return field.type === 'boolean' ? false : '';
  if (field.type === 'json') return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  if (field.type === 'date') return String(v).slice(0, 10);
  return v;
};

const toPayload = (field, v) => {
  if (field.type === 'number' || field.type === 'ref') return v === '' ? null : Number(v);
  if (field.type === 'json') return v === '' ? null : JSON.parse(v);
  if (field.type === 'boolean') return Boolean(v);
  return v === '' ? null : v;
};

export default function ResourceForm({ fields, initial = {}, onSubmit, onCancel, submitting, error, submitLabel = 'Save' }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, toInput(f, initial[f.name])])));
  const [localError, setLocalError] = useState('');
  const set = (name, v) => setValues((s) => ({ ...s, [name]: v }));

  const submit = (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      const payload = {};
      fields.forEach((f) => {
        // Empty password on edit means "leave unchanged".
        if (f.type === 'password' && values[f.name] === '') return;
        payload[f.name] = toPayload(f, values[f.name]);
      });
      onSubmit(payload);
    } catch {
      setLocalError('One of the JSON fields is not valid JSON.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const full = f.type === 'textarea' || f.type === 'json';
          return (
            <label key={f.name} className={`block ${full ? 'sm:col-span-2' : ''}`}>
              <span className="mb-1 block text-xs font-medium text-slate-600">
                {f.label || humanize(f.name)} {f.required && <span className="text-red-500">*</span>}
              </span>
              {f.type === 'select' && (
                <select className={input} required={f.required} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                  {!f.required && <option value="">—</option>}
                  {f.options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
                </select>
              )}
              {f.type === 'ref' && (
                <RefSelect resource={f.ref} required={f.required} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
              )}
              {f.type === 'boolean' && (
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
              )}
              {(f.type === 'textarea' || f.type === 'json') && (
                <textarea
                  rows={f.type === 'json' ? 5 : 3}
                  className={`${input} ${f.type === 'json' ? 'font-mono text-xs' : ''}`}
                  required={f.required}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {['text', 'number', 'date', 'email', 'password'].includes(f.type || 'text') && (
                <input
                  className={input}
                  type={f.type || 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                  required={f.required && !(f.type === 'password' && initial.id)}
                  placeholder={f.type === 'password' && initial.id ? 'Leave blank to keep current' : f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </label>
          );
        })}
      </div>
      <Alert>{localError || error}</Alert>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</Button>
      </div>
    </form>
  );
}
