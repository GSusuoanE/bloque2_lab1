/*
# Create Users CRUD table with secure password handling

1. New Tables
- `users` — stores application user records.
  - `id` integer, primary key, auto-generated.
  - `nombre` text, not null — first name.
  - `apellido_p` text, not null — paternal surname.
  - `apellido_m` text, nullable — maternal surname.
  - `fecha_ingreso` date, not null — date the user was registered.
  - `rol` text, not null — application role (Auditor, Jefatura, Gerente, Director).
  - `contrasena_hash` text, not null — bcrypt-style password hash (never exposed to frontend).
  - `estado` boolean, not null, default true — active/inactive status.
  - `direccion` text, nullable — user address.
  - `correo` text, not null, unique — email address.
  - `created_at` timestamptz, default now().

2. New View
- `users_public` — exposes all user columns EXCEPT `contrasena_hash`.

3. Security
- RLS enabled on `users` with NO direct policies (deny by default).
- Frontend reads `users_public`, mutates through SECURITY DEFINER functions.
- Passwords hashed with pgcrypto crypt() + gen_salt('bf').

4. Extensions
- `pgcrypto`

5. Notes
- Single-tenant no-auth app. All data shared/public.
- contrasena_hash never selectable by frontend.
- Role validated via CHECK constraint. Email unique at DB level.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  apellido_p text NOT NULL,
  apellido_m text,
  fecha_ingreso date NOT NULL,
  rol text NOT NULL CHECK (rol IN ('Auditor', 'Jefatura', 'Gerente', 'Director')),
  contrasena_hash text NOT NULL,
  estado boolean NOT NULL DEFAULT true,
  direccion text,
  correo text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_nombre ON users (nombre);
CREATE INDEX IF NOT EXISTS idx_users_apellido_p ON users (apellido_p);
CREATE INDEX IF NOT EXISTS idx_users_correo ON users (correo);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users (rol);
CREATE INDEX IF NOT EXISTS idx_users_estado ON users (estado);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW users_public AS
SELECT
  id, nombre, apellido_p, apellido_m, fecha_ingreso, rol,
  estado, direccion, correo, created_at
FROM users;

GRANT SELECT ON users_public TO anon, authenticated;

-- create_user: all non-defaulted params first, then defaulted ones
CREATE OR REPLACE FUNCTION create_user(
  p_nombre text,
  p_apellido_p text,
  p_fecha_ingreso date,
  p_rol text,
  p_contrasena text,
  p_correo text,
  p_apellido_m text DEFAULT NULL,
  p_estado boolean DEFAULT true,
  p_direccion text DEFAULT NULL
) RETURNS users_public
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row users_public;
BEGIN
  IF p_contrasena IS NULL OR btrim(p_contrasena) = '' THEN
    RAISE EXCEPTION 'La contraseña es obligatoria.';
  END IF;
  IF p_rol NOT IN ('Auditor', 'Jefatura', 'Gerente', 'Director') THEN
    RAISE EXCEPTION 'El rol seleccionado no es válido.';
  END IF;

  INSERT INTO users (
    nombre, apellido_p, apellido_m, fecha_ingreso, rol,
    contrasena_hash, estado, direccion, correo
  ) VALUES (
    btrim(p_nombre), btrim(p_apellido_p), btrim(p_apellido_m),
    p_fecha_ingreso, p_rol,
    crypt(p_contrasena, gen_salt('bf')),
    p_estado, btrim(p_direccion), lower(btrim(p_correo))
  )
  RETURNING
    id, nombre, apellido_p, apellido_m, fecha_ingreso, rol,
    estado, direccion, correo, created_at
  INTO new_row;

  RETURN new_row;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user TO anon, authenticated;

CREATE OR REPLACE FUNCTION update_user(
  p_id integer,
  p_nombre text DEFAULT NULL,
  p_apellido_p text DEFAULT NULL,
  p_apellido_m text DEFAULT NULL,
  p_fecha_ingreso date DEFAULT NULL,
  p_rol text DEFAULT NULL,
  p_contrasena text DEFAULT NULL,
  p_correo text DEFAULT NULL,
  p_estado boolean DEFAULT NULL,
  p_direccion text DEFAULT NULL
) RETURNS users_public
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row users_public;
  v_rol text := p_rol;
  v_contrasena text := p_contrasena;
BEGIN
  IF p_rol IS NOT NULL AND p_rol NOT IN ('Auditor', 'Jefatura', 'Gerente', 'Director') THEN
    RAISE EXCEPTION 'El rol seleccionado no es válido.';
  END IF;

  IF p_contrasena IS NOT NULL AND btrim(p_contrasena) = '' THEN
    v_contrasena := NULL;
  END IF;

  UPDATE users SET
    nombre        = COALESCE(CASE WHEN p_nombre IS NOT NULL THEN btrim(p_nombre) ELSE nombre END, nombre),
    apellido_p    = COALESCE(CASE WHEN p_apellido_p IS NOT NULL THEN btrim(p_apellido_p) ELSE apellido_p END, apellido_p),
    apellido_m    = CASE WHEN p_apellido_m IS NOT NULL THEN btrim(p_apellido_m) ELSE apellido_m END,
    fecha_ingreso = COALESCE(p_fecha_ingreso, fecha_ingreso),
    rol           = COALESCE(v_rol, rol),
    contrasena_hash = CASE
      WHEN v_contrasena IS NOT NULL AND btrim(v_contrasena) != '' THEN crypt(v_contrasena, gen_salt('bf'))
      ELSE contrasena_hash
    END,
    estado        = COALESCE(p_estado, estado),
    direccion     = CASE WHEN p_direccion IS NOT NULL THEN btrim(p_direccion) ELSE direccion END,
    correo        = COALESCE(CASE WHEN p_correo IS NOT NULL THEN lower(btrim(p_correo)) ELSE correo END, correo)
  WHERE id = p_id
  RETURNING
    id, nombre, apellido_p, apellido_m, fecha_ingreso, rol,
    estado, direccion, correo, created_at
  INTO updated_row;

  IF updated_row IS NULL THEN
    RAISE EXCEPTION 'El usuario no existe.';
  END IF;

  RETURN updated_row;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user TO anon, authenticated;

CREATE OR REPLACE FUNCTION delete_user(p_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM users WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El usuario no existe.';
  END IF;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user TO anon, authenticated;
