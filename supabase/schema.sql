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
  rol text check (rol in ('paciente', 'psicologo', 'admin', 'superadmin')) default 'paciente',
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
  estado text check (estado in ('pendiente', 'confirmada', 'completada', 'cancelada', 'finalizado')) default 'confirmada',
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

-- 6. TABLA DE CALIFICACIONES Y RESEÑAS
-- Regla de negocio: Solo 1 calificación por cita finalizada/completada
create table if not exists public.calificaciones (
  id uuid default gen_random_uuid() primary key,
  cita_id uuid references public.citas(id) on delete cascade unique not null,
  paciente_id uuid references public.perfiles(id) on delete cascade not null,
  estrellas integer check (estrellas between 1 and 5) not null,
  comentario text,
  nombre_mostrar text,
  servicio text default 'Terapia Individual',
  es_publico boolean default true,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- FUNCIONES HELPER DE SEGURIDAD (Evitan recursión en RLS)
-- ========================================================
create or replace function public.es_admin(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.perfiles
    where id = user_id and (rol in ('admin', 'superadmin') or email = 'brayancamilo2407@gmail.com')
  );
$$ language sql security definer;

create or replace function public.es_psicologo(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.perfiles
    where id = user_id and (rol in ('psicologo', 'admin', 'superadmin') or email = 'brayancamilo2407@gmail.com')
  );
$$ language sql security definer;

-- ========================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Pacientes ven lo propio; la Psicóloga y el Super Admin gestionan el consultorio
-- ========================================================

alter table public.perfiles enable row level security;
alter table public.citas enable row level security;
alter table public.tareas_terapia enable row level security;
alter table public.registro_emocional enable row level security;
alter table public.calificaciones enable row level security;

-- Políticas para PERFILES
drop policy if exists "Los usuarios pueden ver su propio perfil" on public.perfiles;
create policy "Los usuarios pueden ver su propio perfil"
  on public.perfiles for select
  using (auth.uid() = id or public.es_psicologo(auth.uid()));

drop policy if exists "Los usuarios pueden actualizar su propio perfil" on public.perfiles;
create policy "Los usuarios pueden actualizar su propio perfil"
  on public.perfiles for update
  using (auth.uid() = id or public.es_admin(auth.uid()));

-- Políticas para CITAS
drop policy if exists "Los pacientes pueden ver sus propias citas" on public.citas;
create policy "Los pacientes pueden ver sus propias citas"
  on public.citas for select
  using (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

drop policy if exists "Los pacientes pueden solicitar/crear sus citas" on public.citas;
create policy "Los pacientes pueden solicitar/crear sus citas"
  on public.citas for insert
  with check (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

drop policy if exists "Psicologa y pacientes pueden actualizar citas" on public.citas;
create policy "Psicologa y pacientes pueden actualizar citas"
  on public.citas for update
  using (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

-- Políticas para TAREAS DE TERAPIA
drop policy if exists "Los pacientes pueden ver sus tareas" on public.tareas_terapia;
create policy "Los pacientes pueden ver sus tareas"
  on public.tareas_terapia for select
  using (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

drop policy if exists "Los pacientes pueden actualizar sus tareas" on public.tareas_terapia;
create policy "Los pacientes pueden actualizar sus tareas"
  on public.tareas_terapia for update
  using (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

drop policy if exists "Permitir insertar tareas" on public.tareas_terapia;
create policy "Permitir insertar tareas"
  on public.tareas_terapia for insert
  with check (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

-- Políticas para REGISTRO EMOCIONAL
drop policy if exists "Los pacientes pueden ver su registro emocional" on public.registro_emocional;
create policy "Los pacientes pueden ver su registro emocional"
  on public.registro_emocional for select
  using (auth.uid() = paciente_id or public.es_psicologo(auth.uid()));

drop policy if exists "Los pacientes pueden guardar registros emocionales" on public.registro_emocional;
create policy "Los pacientes pueden guardar registros emocionales"
  on public.registro_emocional for insert
  with check (auth.uid() = paciente_id);

-- Políticas para CALIFICACIONES (Público puede leer para mostrar en la web)
drop policy if exists "Cualquiera puede leer resenas publicas" on public.calificaciones;
create policy "Cualquiera puede leer resenas publicas"
  on public.calificaciones for select
  using (es_publico = true or public.es_psicologo(auth.uid()));

drop policy if exists "Los pacientes pueden calificar sus citas finalizadas" on public.calificaciones;
create policy "Los pacientes pueden calificar sus citas finalizadas"
  on public.calificaciones for insert
  with check (
    auth.uid() = paciente_id and
    exists (
      select 1 from public.citas
      where id = cita_id and paciente_id = auth.uid() and estado in ('completada', 'finalizado')
    )
  );

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

