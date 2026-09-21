import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserInput, UserInputPartial, Rol } from '@/types/user';

export type SortField = 'nombre' | 'apellido_p' | 'correo' | 'rol' | 'fecha_ingreso' | 'created_at';
export type SortDir = 'asc' | 'desc';

export interface UseUsersParams {
  search: string;
  rolFilter: Rol | 'all';
  estadoFilter: boolean | 'all';
  page: number;
  pageSize: number;
  sortField: SortField;
  sortDir: SortDir;
}

export interface UseUsersResult {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createUser: (input: UserInput) => Promise<{ success: boolean; error?: string }>;
  updateUser: (input: UserInputPartial) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export function useUsers(params: UseUsersParams): UseUsersResult {
  const { search, rolFilter, estadoFilter, page, pageSize, sortField, sortDir } = params;
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        let countQuery = supabase
          .from('users_public')
          .select('*', { count: 'exact', head: true });

        let dataQuery = supabase.from('users_public').select('*');

        const searchTerm = search.trim();
        if (searchTerm) {
          const filter = `or(nombre.ilike.%${searchTerm}%,apellido_p.ilike.%${searchTerm}%,apellido_m.ilike.%${searchTerm}%,correo.ilike.%${searchTerm}%`;
          countQuery = countQuery.filter('or', 'or', filter + ')');
          dataQuery = dataQuery.filter('or', 'or', filter + ')');
        }
        if (rolFilter !== 'all') {
          countQuery = countQuery.eq('rol', rolFilter);
          dataQuery = dataQuery.eq('rol', rolFilter);
        }
        if (estadoFilter !== 'all') {
          countQuery = countQuery.eq('estado', estadoFilter);
          dataQuery = dataQuery.eq('estado', estadoFilter);
        }

        dataQuery = dataQuery.order(sortField, { ascending: sortDir === 'asc' });
        dataQuery = dataQuery.range(page * pageSize, (page + 1) * pageSize - 1);

        const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

        if (cancelled) return;

        if (countRes.error) throw countRes.error;
        if (dataRes.error) throw dataRes.error;

        setTotal(countRes.count ?? 0);
        setUsers((dataRes.data ?? []) as User[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, rolFilter, estadoFilter, page, pageSize, sortField, sortDir, reloadKey]);

  const createUser = useCallback(
    async (input: UserInput): Promise<{ success: boolean; error?: string }> => {
      const { data, error: rpcError } = await supabase.rpc('create_user', {
        p_nombre: input.nombre,
        p_apellido_p: input.apellido_p,
        p_apellido_m: input.apellido_m || null,
        p_fecha_ingreso: input.fecha_ingreso,
        p_rol: input.rol,
        p_contrasena: input.contrasena,
        p_correo: input.correo,
        p_estado: input.estado,
        p_direccion: input.direccion || null,
      });

      if (rpcError) return { success: false, error: rpcError.message };
      if (!data) return { success: false, error: 'No se pudo crear el usuario.' };

      refresh();
      return { success: true };
    },
    [refresh]
  );

  const updateUser = useCallback(
    async (input: UserInputPartial): Promise<{ success: boolean; error?: string }> => {
      const { data, error: rpcError } = await supabase.rpc('update_user', {
        p_id: input.id,
        p_nombre: input.nombre ?? null,
        p_apellido_p: input.apellido_p ?? null,
        p_apellido_m: input.apellido_m ?? null,
        p_fecha_ingreso: input.fecha_ingreso ?? null,
        p_rol: input.rol ?? null,
        p_contrasena: input.contrasena ?? null,
        p_correo: input.correo ?? null,
        p_estado: input.estado ?? null,
        p_direccion: input.direccion ?? null,
      });

      if (rpcError) return { success: false, error: rpcError.message };
      if (!data) return { success: false, error: 'No se pudo actualizar el usuario.' };

      refresh();
      return { success: true };
    },
    [refresh]
  );

  const deleteUser = useCallback(
    async (id: number): Promise<{ success: boolean; error?: string }> => {
      const { error: rpcError } = await supabase.rpc('delete_user', { p_id: id });
      if (rpcError) return { success: false, error: rpcError.message };
      refresh();
      return { success: true };
    },
    [refresh]
  );

  return useMemo(
    () => ({ users, total, loading, error, refresh, createUser, updateUser, deleteUser }),
    [users, total, loading, error, refresh, createUser, updateUser, deleteUser]
  );
}
