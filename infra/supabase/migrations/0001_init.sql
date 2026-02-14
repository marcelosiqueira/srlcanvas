create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Meu Canvas Estrategico',
  meta jsonb not null default '{}'::jsonb,
  blocks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists canvases_user_id_idx on public.canvases(user_id);
create index if not exists canvases_updated_at_idx on public.canvases(updated_at desc);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists canvases_updated_at on public.canvases;
create trigger canvases_updated_at
before update on public.canvases
for each row execute function public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.canvases enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id);

create policy "Canvases are viewable by owner"
on public.canvases
for select
using (auth.uid() = user_id);

create policy "Canvases are insertable by owner"
on public.canvases
for insert
with check (auth.uid() = user_id);

create policy "Canvases are updatable by owner"
on public.canvases
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Canvases are deletable by owner"
on public.canvases
for delete
using (auth.uid() = user_id);

create table if not exists public.research_survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_accepted boolean not null,
  consent_version text not null,
  age_18_or_more boolean not null,
  acted_in_ecosystem_12m boolean not null,
  viewed_srl_material boolean not null,
  is_eligible boolean not null,
  profile jsonb not null default '{}'::jsonb,
  dimension_answers jsonb not null default '{}'::jsonb,
  scale_feedback jsonb not null default '{}'::jsonb,
  sus_answers jsonb not null default '{}'::jsonb,
  adoption_feedback jsonb not null default '{}'::jsonb,
  follow_up jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint research_survey_responses_consent_true check (consent_accepted = true)
);

create index if not exists research_survey_responses_user_id_idx
  on public.research_survey_responses(user_id);

create index if not exists research_survey_responses_created_at_idx
  on public.research_survey_responses(created_at desc);

alter table public.research_survey_responses enable row level security;

create policy "Research survey responses are insertable by owner"
on public.research_survey_responses
for insert
with check (auth.uid() = user_id);

create policy "Research survey responses are viewable by owner"
on public.research_survey_responses
for select
using (auth.uid() = user_id);

create table if not exists public.research_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  accepted boolean not null,
  consent_version text not null,
  survey_version text not null,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists research_consents_user_id_idx
  on public.research_consents(user_id);

create index if not exists research_consents_created_at_idx
  on public.research_consents(created_at desc);

alter table public.research_consents enable row level security;

create policy "Research consents are insertable by owner"
on public.research_consents
for insert
with check (auth.uid() = user_id);

create policy "Research consents are viewable by owner"
on public.research_consents
for select
using (auth.uid() = user_id);

create policy "Research consents are updatable by owner"
on public.research_consents
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
