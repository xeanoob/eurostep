-- ============================================================
-- EuroStep — Schéma Supabase
-- Exécuter dans l'éditeur SQL du dashboard Supabase
-- ============================================================

-- ========================
-- 1. TABLES (sans policies)
-- ========================

-- Profils
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Ligues
create table public.leagues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

-- Membres de ligue
create table public.league_members (
  league_id uuid references public.leagues(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now() not null,
  primary key (league_id, user_id)
);

-- Matchs
create type match_status as enum ('upcoming', 'live', 'finished');

create table public.matches (
  id uuid default gen_random_uuid() primary key,
  external_id text unique,
  home_team text not null,
  away_team text not null,
  league_name text not null default 'NBA',
  scheduled_at timestamptz not null,
  home_score int,
  away_score int,
  home_odds numeric(10,2),
  away_odds numeric(10,2),
  status match_status default 'upcoming' not null,
  created_at timestamptz default now() not null
);

-- Pronostics
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  predicted_home_score int not null,
  predicted_away_score int not null,
  points_earned int,
  created_at timestamptz default now() not null,
  unique(user_id, match_id)
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references public.leagues(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- Friends
create type friend_status as enum ('pending', 'accepted');

create table public.friends (
  user_id_1 uuid references public.profiles(id) on delete cascade not null,
  user_id_2 uuid references public.profiles(id) on delete cascade not null,
  status friend_status default 'pending' not null,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id_1, user_id_2),
  check (user_id_1 < user_id_2) -- Ensures alphabetical/uuid order to avoid duplicates (A,B) and (B,A)
);
  check (user_id_1 < user_id_2) -- Ensures alphabetical/uuid order to avoid duplicates (A,B) and (B,A)
);

-- Private Messages
create table public.private_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- ========================
-- 2. TRIGGER auto-profil
-- ========================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Joueur'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================
-- 3. RLS (toutes les tables existent maintenant)
-- ========================

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.messages enable row level security;
alter table public.friends enable row level security;
alter table public.private_messages enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Leagues
create policy "leagues_select" on public.leagues
  for select to authenticated
  using (true);

create policy "leagues_insert" on public.leagues
  for insert to authenticated
  with check (auth.uid() = created_by);

-- League members
create policy "league_members_select" on public.league_members
  for select to authenticated
  using (true);

create policy "league_members_insert" on public.league_members
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Matches
create policy "matches_select" on public.matches
  for select to authenticated using (true);

create policy "matches_insert" on public.matches
  for insert to authenticated with check (true);

create policy "matches_update" on public.matches
  for update to authenticated using (true);

-- Predictions
create policy "predictions_select" on public.predictions
  for select to authenticated using (true);

create policy "predictions_insert" on public.predictions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "predictions_update" on public.predictions
  for update to authenticated using (true);

-- Messages
create policy "messages_select" on public.messages
  for select to authenticated
  using (league_id in (select league_id from public.league_members where user_id = auth.uid()));

create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and league_id in (select league_id from public.league_members where user_id = auth.uid())
  );

-- Friends
create policy "friends_select" on public.friends
  for select to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "friends_insert" on public.friends
  for insert to authenticated
  with check (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "friends_update" on public.friends
  for update to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "friends_delete" on public.friends
  for delete to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- Private Messages
create policy "pm_select" on public.private_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "pm_insert" on public.private_messages
  for insert to authenticated
  with check (auth.uid() = sender_id);

-- ========================
-- 4. REALTIME
-- ========================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.private_messages;

-- ========================
-- 5. INDEX
-- ========================

create index idx_predictions_user on public.predictions(user_id);
create index idx_predictions_match on public.predictions(match_id);
create index idx_messages_league on public.messages(league_id, created_at);
create index idx_matches_status on public.matches(status, scheduled_at);
create index idx_league_members_user on public.league_members(user_id);
create index idx_private_messages_users on public.private_messages(sender_id, receiver_id, created_at);
create index idx_friends_users on public.friends(user_id_1, user_id_2);
