-- ========================================================
-- ESQUEMA DE BASE DE DATOS: CENTRO DE PSICOLOGÍA
-- ========================================================

-- 1. EXTENSIÓN PARA UUIDS
create extension if not exists "uuid-ossp";

-- 2. TABLA DE PERFILES (Vinculada a auth.users de Supabase)
create table if not exists public.perfiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nombre_completo text,
  avatar_url text,
  telefono text,
  contacto_emergencia text,
  rol text check (rol in ('paciente', 'psicologo')) default 'paciente',
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null,
  actualizado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE CITAS / SESIONES TERAPÉUTICAS
create table if not exists public.citas (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references public.perfiles(id) on delete cascade not null,
  fecha_hora timestamp with time zone not null,
  modalidad text check (modalidad in ('virtual', 'presencial')) default 'virtual',
  enlace_reunion text,
  estado text check (estado in ('pendiente', 'confirmada', 'completada', 'cancelada')) default 'confirmada',
  notas_paciente text,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA DE TAREAS TERAPÉUTICAS (Autogestión del consultante)
create table if not exists public.tareas_terapia (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references public.perfiles(id) on delete cascade not null,
  titulo text not null,
  descripcion text,
  fecha_limite date,
  completada boolean default false,
  reflexion_paciente text,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABLA DE REGISTRO EMOCIONAL / SEGUIMIENTO DIARIO
create table if not exists public.registro_emocional (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references public.perfiles(id) on delete cascade not null,
  nivel_animo integer check (nivel_animo between 1 and 5) not null,
  emocion_principal text,
  notas text,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Cada paciente solo puede ver y editar sus propios datos
-- ========================================================

alter table public.perfiles enable row level security;
alter table public.citas enable row level security;
alter table public.tareas_terapia enable row level security;
alter table public.registro_emocional enable row level security;

-- Políticas para PERFILES
drop policy if exists "Los usuarios pueden ver su propio perfil" on public.perfiles;
create policy "Los usuarios pueden ver su propio perfil"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "Los usuarios pueden actualizar su propio perfil" on public.perfiles;
create policy "Los usuarios pueden actualizar su propio perfil"
  on public.perfiles for update
  using (auth.uid() = id);

-- Políticas para CITAS
drop policy if exists "Los pacientes pueden ver sus propias citas" on public.citas;
create policy "Los pacientes pueden ver sus propias citas"
  on public.citas for select
  using (auth.uid() = paciente_id);

drop policy if exists "Los pacientes pueden solicitar/crear sus citas" on public.citas;
create policy "Los pacientes pueden solicitar/crear sus citas"
  on public.citas for insert
  with check (auth.uid() = paciente_id);

-- Políticas para TAREAS DE TERAPIA
drop policy if exists "Los pacientes pueden ver sus tareas" on public.tareas_terapia;
create policy "Los pacientes pueden ver sus tareas"
  on public.tareas_terapia for select
  using (auth.uid() = paciente_id);

drop policy if exists "Los pacientes pueden actualizar sus tareas" on public.tareas_terapia;
create policy "Los pacientes pueden actualizar sus tareas"
  on public.tareas_terapia for update
  using (auth.uid() = paciente_id);

drop policy if exists "Permitir insertar tareas" on public.tareas_terapia;
create policy "Permitir insertar tareas"
  on public.tareas_terapia for insert
  with check (auth.uid() = paciente_id);

-- Políticas para REGISTRO EMOCIONAL
drop policy if exists "Los pacientes pueden ver su registro emocional" on public.registro_emocional;
create policy "Los pacientes pueden ver su registro emocional"
  on public.registro_emocional for select
  using (auth.uid() = paciente_id);

drop policy if exists "Los pacientes pueden guardar registros emocionales" on public.registro_emocional;
create policy "Los pacientes pueden guardar registros emocionales"
  on public.registro_emocional for insert
  with check (auth.uid() = paciente_id);

-- ========================================================
-- TRIGGER AUTOMÁTICO: CREAR PERFIL AL REGISTRARSE
-- Cuando un usuario entra con Google por primera vez,
-- se crea automáticamente su fila en public.perfiles
-- ========================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, email, nombre_completo, avatar_url, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'paciente'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Asignar el trigger a la tabla auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
