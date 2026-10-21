create table if not exists public.alumno_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  auth_email text not null unique,
  pin_salt text not null,
  pin_hash text not null,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.alumno_access enable row level security;

revoke all on public.alumno_access from anon, authenticated;
grant all on public.alumno_access to service_role;
