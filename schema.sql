-- Drop existing (safe to rerun during development)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles;

-- Profiles table (extends auth.users)
create table public.profiles (
  user_id          uuid references auth.users(id) on delete cascade primary key,

  -- Account info (email pulled from auth on register)
  email            text,
  display_name     text,

  -- Physical stats (for personalized BMR/TDEE calculation)
  sex              text check (sex in ('male', 'female')),
  age              int,
  height_in        int,    -- inches
  weight_lbs       int,

  -- Fitness goal
  goal             text default 'maintain' check (goal in ('bulk', 'cut', 'maintain')),
  activity_level   text default 'moderate' check (activity_level in (
                     'sedentary', 'light', 'moderate', 'active', 'very_active'
                   )),

  -- Dietary needs (used to filter allergens from menu)
  dietary_restrictions text[] default '{}',

  created_at       timestamp default now(),
  updated_at       timestamp default now()
);

-- RLS: users can only read/write their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Auto-create a profile row (with email) when a user registers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
