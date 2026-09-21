import { Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { User } from '@/types/user';
import type { SortField, SortDir } from '@/hooks/useUsers';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleColors: Record<string, string> = {
  Auditor: 'bg-sky-50 text-sky-700 border-sky-200',
  Jefatura: 'bg-violet-50 text-violet-700 border-violet-200',
  Gerente: 'bg-amber-50 text-amber-700 border-amber-200',
  Director: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function UsersTable({ users, loading, sortField, sortDir, onSort, onEdit, onDelete }: UsersTableProps) {
  const columns: { key: SortField; label: string; sortable: boolean }[] = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'apellido_p', label: 'Apellidos', sortable: true },
    { key: 'correo', label: 'Correo', sortable: true },
    { key: 'rol', label: 'Rol', sortable: true },
    { key: 'fecha_ingreso', label: 'F. Ingreso', sortable: true },
    { key: 'created_at', label: 'Creado', sortable: true },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
      : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
              <div className="h-4 bg-slate-100 rounded w-32" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-16 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <UsersEmptyIcon />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">No hay usuarios</h3>
        <p className="mt-1 text-sm text-slate-500">No se encontraron usuarios con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors select-none' : ''
                  }`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold flex-shrink-0">
                      {user.nombre.charAt(0).toUpperCase()}{user.apellido_p.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.estado ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactivo
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-slate-700">
                    {user.apellido_p}
                    {user.apellido_m ? ` ${user.apellido_m}` : ''}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-slate-600 truncate max-w-[200px]">{user.correo}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${roleColors[user.rol]}`}>
                    {user.rol}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(user.fecha_ingreso)}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-slate-400 whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function UsersEmptyIcon() {
  return (
    <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}
