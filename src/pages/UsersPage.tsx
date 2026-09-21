import { useState, useCallback } from 'react';
import { useUsers, type SortField, type SortDir } from '@/hooks/useUsers';
import type { User, UserInput, Rol } from '@/types/user';
import { Toolbar, Pagination } from '@/components/Toolbar';
import { UsersTable } from '@/components/UsersTable';
import { UserForm } from '@/components/UserForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ToastContainer, useToasts } from '@/components/Toast';

const PAGE_SIZE = 10;

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState<Rol | 'all'>('all');
  const [estadoFilter, setEstadoFilter] = useState<boolean | 'all'>('all');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toasts, addToast, dismissToast } = useToasts();

  const { users, total, loading, error, createUser, updateUser, deleteUser } = useUsers({
    search,
    rolFilter,
    estadoFilter,
    page,
    pageSize: PAGE_SIZE,
    sortField,
    sortDir,
  });

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const openCreate = () => {
    setFormMode('create');
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setFormMode('edit');
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleSubmit = async (input: UserInput & { id?: number }) => {
    if (input.id) {
      const { id, ...rest } = input;
      const result = await updateUser({ id, ...rest });
      if (result.success) addToast('success', 'Usuario actualizado correctamente.');
      else addToast('error', result.error ?? 'Error al actualizar.');
      return result;
    } else {
      const result = await createUser(input);
      if (result.success) addToast('success', 'Usuario creado correctamente.');
      else addToast('error', result.error ?? 'Error al crear.');
      return result;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteUser(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      addToast('success', 'Usuario eliminado correctamente.');
      setDeleteTarget(null);
    } else {
      addToast('error', result.error ?? 'Error al eliminar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Toolbar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          rolFilter={rolFilter}
          onRolFilterChange={(v) => { setRolFilter(v); setPage(0); }}
          estadoFilter={estadoFilter}
          onEstadoFilterChange={(v) => { setEstadoFilter(v); setPage(0); }}
          onAddClick={openCreate}
          total={total}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <UsersTable
          users={users}
          loading={loading}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />

        {!loading && total > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        )}
      </div>

      <UserForm
        open={formOpen}
        mode={formMode}
        user={editingUser}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${deleteTarget?.nombre} ${deleteTarget?.apellido_p}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
