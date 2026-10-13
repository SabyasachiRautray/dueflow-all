import { useGetListQuery } from '../../services';

// Resolves a foreign key to a readable label. RTK Query de-dupes the request,
// so rendering this in every table row costs a single network call per resource.
export const REF_LABEL = {
  vendors: (r) => r.name,
  users: (r) => r.name,
  invoices: (r) => r.invoice_no,
};

export function useRefOptions(resource) {
  const { data } = useGetListQuery({ resource, limit: 100 });
  const label = REF_LABEL[resource] || ((r) => `#${r.id}`);
  return (data?.data || []).map((r) => ({ value: r.id, label: label(r) }));
}

export default function RefValue({ resource, id }) {
  const options = useRefOptions(resource);
  if (id == null) return <span className="text-slate-400">—</span>;
  const hit = options.find((o) => String(o.value) === String(id));
  return <span>{hit ? hit.label : `#${id}`}</span>;
}
