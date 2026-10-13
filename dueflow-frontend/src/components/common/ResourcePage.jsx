import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, Trash2 } from 'lucide-react';
import { RESOURCES } from '../../config/resources';
import {
  useGetListQuery, useCreateOneMutation, useUpdateOneMutation, useDeleteOneMutation, errorMessage,
} from '../../services';
import { selectUser } from '../../features/auth/authSlice';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';
import Pagination from '../ui/Pagination';
import DataTable from './DataTable';
import ResourceForm from './ResourceForm';
import DetailView from './DetailView';

const PAGE_SIZE = 10;

export default function ResourcePage({ resourceKey }) {
  const cfg = RESOURCES[resourceKey];
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit' | 'view', row? }
  const [pageError, setPageError] = useState('');

  const { data, isFetching, error } = useGetListQuery({ resource: cfg.path, page, limit: PAGE_SIZE });
  const [createOne, createState] = useCreateOneMutation();
  const [updateOne, updateState] = useUpdateOneMutation();
  const [deleteOne, deleteState] = useDeleteOneMutation();

  const roleOk = !cfg.writeRoles || cfg.writeRoles.includes(user?.role);
  const canWrite = !cfg.readOnly && roleOk && !!cfg.fields;
  const canCreate = canWrite && cfg.canCreate !== false;
  const canEdit = canWrite && cfg.canEdit !== false;
  const canDelete = !cfg.readOnly && roleOk && cfg.canDelete !== false;

  const close = () => { setModal(null); setPageError(''); };

  const onRowClick = (row) => {
    if (cfg.detailPath) return navigate(cfg.detailPath(row));
    return setModal({ mode: canEdit ? 'edit' : 'view', row });
  };

  const handleCreate = async (body) => {
    const res = await createOne({ resource: cfg.path, body });
    if (!res.error) close();
  };
  const handleUpdate = async (body) => {
    const res = await updateOne({ resource: cfg.path, id: modal.row.id, body });
    if (!res.error) close();
  };
  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${cfg.singular}? This cannot be undone.`)) return;
    const res = await deleteOne({ resource: cfg.path, id: modal.row.id });
    if (res.error) setPageError(errorMessage(res.error)); else close();
  };

  return (
    <>
      <PageHeader
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={canCreate && <Button onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> {cfg.createLabel || `New ${cfg.singular}`}</Button>}
      />
      {error && <div className="mb-4"><Alert>{errorMessage(error)}</Alert></div>}
      <Card padded={false}>
        <DataTable columns={cfg.columns} rows={data?.data} loading={isFetching && !data} onRowClick={onRowClick} empty={`No ${cfg.title.toLowerCase()} yet.`} />
        <Pagination page={page} totalPages={data?.totalPages || 1} totalItems={data?.totalItems} onChange={setPage} />
      </Card>

      <Modal open={modal?.mode === 'create'} title={cfg.createLabel || `New ${cfg.singular}`} onClose={close}>
        {modal?.mode === 'create' && (
          <ResourceForm
            fields={cfg.fields}
            initial={cfg.defaults ? cfg.defaults(user) : {}}
            onSubmit={handleCreate}
            onCancel={close}
            submitting={createState.isLoading}
            error={createState.isError ? errorMessage(createState.error) : ''}
            submitLabel="Create"
          />
        )}
      </Modal>

      <Modal open={modal?.mode === 'edit'} title={`Edit ${cfg.singular}`} onClose={close}>
        {modal?.mode === 'edit' && (
          <>
            <ResourceForm
              fields={cfg.fields}
              initial={modal.row}
              onSubmit={handleUpdate}
              onCancel={close}
              submitting={updateState.isLoading}
              error={updateState.isError ? errorMessage(updateState.error) : ''}
            />
            {canDelete && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <Alert>{pageError}</Alert>
                <Button variant="danger" size="sm" className="mt-2" onClick={handleDelete} disabled={deleteState.isLoading}><Trash2 size={14} /> Delete {cfg.singular}</Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={modal?.mode === 'view'} title={cfg.title} onClose={close} wide>
        {modal?.mode === 'view' && (
          <>
            <DetailView row={modal.row} />
            {canDelete && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <Alert>{pageError}</Alert>
                <Button variant="danger" size="sm" className="mt-2" onClick={handleDelete} disabled={deleteState.isLoading}><Trash2 size={14} /> Delete</Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
