import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, UserPlus, UserCog } from 'lucide-react';
import type { User, UserInput, Rol } from '@/types/user';
import { ROLES } from '@/types/user';

interface UserFormProps {
  open: boolean;
  mode: 'create' | 'edit';
  user?: User | null;
  onSubmit: (input: UserInput | (UserInput & { id: number })) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

const emptyForm: UserInput = {
  nombre: '',
  apellido_p: '',
  apellido_m: '',
  fecha_ingreso: new Date().toISOString().slice(0, 10),
  rol: 'Auditor',
  contrasena: '',
  correo: '',
  estado: true,
  direccion: '',
};

export function UserForm({ open, mode, user, onSubmit, onClose }: UserFormProps) {
  const [form, setForm] = useState<UserInput>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSubmitError(null);
      setFieldErrors({});
      setShowPassword(false);
      if (mode === 'edit' && user) {
        setForm({
          nombre: user.nombre,
          apellido_p: user.apellido_p,
          apellido_m: user.apellido_m ?? '',
          fecha_ingreso: user.fecha_ingreso,
          rol: user.rol,
          contrasena: '',
          correo: user.correo,
          estado: user.estado,
          direccion: user.direccion ?? '',
        });
      } else {
        setForm({ ...emptyForm, fecha_ingreso: new Date().toISOString().slice(0, 10) });
      }
    }
  }, [open, mode, user]);

  if (!open) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio.';
    if (!form.apellido_p.trim()) errs.apellido_p = 'El apellido paterno es obligatorio.';
    if (!form.correo.trim()) errs.correo = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) errs.correo = 'El correo no es válido.';
    if (mode === 'create' && !form.contrasena) errs.contrasena = 'La contraseña es obligatoria.';
    else if (form.contrasena && form.contrasena.length < 6) errs.contrasena = 'Mínimo 6 caracteres.';
    if (!form.fecha_ingreso) errs.fecha_ingreso = 'La fecha es obligatoria.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    const payload = mode === 'edit' && user
      ? { ...form, id: user.id, contrasena: form.contrasena || undefined }
      : form;
    const result = await onSubmit(payload as UserInput & { id?: number });
    setSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      setSubmitError(result.error ?? 'Ocurrió un error.');
    }
  };

  const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
      fieldErrors[field] ? 'border-red-300 bg-red-50/50 focus:border-red-400' : 'border-slate-300 bg-white focus:border-blue-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-[slideUp_0.25s_ease]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${mode === 'create' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              {mode === 'create' ? <UserPlus className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'create' ? 'Registra un nuevo usuario en el sistema' : `Editando: ${user?.nombre} ${user?.apellido_p}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" required error={fieldErrors.nombre}>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                className={inputClass('nombre')}
                placeholder="Ej. Carlos"
              />
            </Field>
            <Field label="Apellido Paterno" required error={fieldErrors.apellido_p}>
              <input
                type="text"
                value={form.apellido_p}
                onChange={(e) => set('apellido_p', e.target.value)}
                className={inputClass('apellido_p')}
                placeholder="Ej. Mendoza"
              />
            </Field>
            <Field label="Apellido Materno">
              <input
                type="text"
                value={form.apellido_m}
                onChange={(e) => set('apellido_m', e.target.value)}
                className={inputClass('apellido_m')}
                placeholder="Ej. López"
              />
            </Field>
            <Field label="Correo Electrónico" required error={fieldErrors.correo}>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => set('correo', e.target.value)}
                className={inputClass('correo')}
                placeholder="usuario@empresa.com"
              />
            </Field>
            <Field label="Fecha de Ingreso" required error={fieldErrors.fecha_ingreso}>
              <input
                type="date"
                value={form.fecha_ingreso}
                onChange={(e) => set('fecha_ingreso', e.target.value)}
                className={inputClass('fecha_ingreso')}
              />
            </Field>
            <Field label="Rol" required>
              <select
                value={form.rol}
                onChange={(e) => set('rol', e.target.value as Rol)}
                className={inputClass('rol')}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field
              label={mode === 'edit' ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña'}
              required={mode === 'create'}
              error={fieldErrors.contrasena}
            >
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.contrasena}
                  onChange={(e) => set('contrasena', e.target.value)}
                  className={inputClass('contrasena') + ' pr-10'}
                  placeholder={mode === 'edit' ? '••••••••' : 'Mínimo 6 caracteres'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Estado">
              <div className="flex items-center gap-3 h-[42px]">
                <button
                  type="button"
                  onClick={() => set('estado', true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.estado
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Activo
                </button>
                <button
                  type="button"
                  onClick={() => set('estado', false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !form.estado
                      ? 'bg-slate-500 text-white shadow-sm shadow-slate-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Inactivo
                </button>
              </div>
            </Field>
          </div>

          <Field label="Dirección">
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
              className={inputClass('direccion')}
              placeholder="Av. Reforma 123, Ciudad de México"
            />
          </Field>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-600/20"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Guardando...' : mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
