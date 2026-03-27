-- ============================================
-- Espace Actionnaire Universal Fab
-- A executer dans Supabase > SQL Editor
-- ============================================

-- 1. Profils actionnaires (étend auth.users de Supabase)
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  full_name        text,
  total_shares_count numeric default 0,
  total_invested   numeric default 0,
  dividends_balance numeric default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 2. Projets d'investissement
create table if not exists public.projects (
  id               text primary key,
  name             text not null,
  description      text,
  emoji            text default '🏭',
  price_per_share  numeric not null,
  min_shares       int default 5,
  target_shares    numeric default 1000,
  sold_shares      numeric default 0,
  roi_label        text default '20% / an estimé',
  status           text default 'En cours',
  created_at       timestamptz default now()
);

-- Insert du premier projet
insert into public.projects (id, name, description, emoji, price_per_share, min_shares, target_shares, roi_label)
values (
  'restaurant-50',
  '50 Restaurants Mobiles',
  'Déploiement stratégique de 50 restaurants mobiles solaires devant les universités, marchés et zones à fort trafic au Sénégal.',
  '🍽️',
  10000,
  5,
  500,
  '20% / an estimé'
) on conflict (id) do nothing;

-- 3. Investissements (un enregistrement par paiement Naboopay reçu)
create table if not exists public.investments (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references public.profiles(id),
  project_id             text,
  amount_paid            numeric not null,
  shares_count           numeric not null,
  order_id               text unique,           -- ID Naboopay
  status                 text default 'pending', -- pending | paid | cancelled
  paid_at                timestamptz,
  created_at             timestamptz default now()
);

-- ⚠️ Si la table existe déjà, exécutez ces ALTER pour ajouter les colonnes :
-- alter table public.investments add column if not exists order_id text unique;
-- alter table public.investments add column if not exists status text default 'pending';
-- alter table public.investments add column if not exists paid_at timestamptz;
-- alter table public.profiles add column if not exists phone text;


-- 4. Historique des retraits (dividendes)
create table if not exists public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id),
  amount              numeric not null,
  phone_number        text,
  operator            text,
  status              text default 'pending',
  naboopay_payout_id  text,
  created_at          timestamptz default now()
);

-- ── Row Level Security ──
-- Les utilisateurs ne voient que leurs propres données
alter table public.profiles    enable row level security;
alter table public.investments enable row level security;
alter table public.payouts     enable row level security;
alter table public.projects    enable row level security;

-- Profil : lire/écrire le sien uniquement
create policy "profiles: own" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- Investissements : voir les siens uniquement
create policy "investments: own" on public.investments
  using (auth.uid() = user_id);

-- Retraits : voir les siens uniquement
create policy "payouts: own" on public.payouts
  using (auth.uid() = user_id);

-- Projets : tout le monde peut lire
create policy "projects: read all" on public.projects
  for select using (true);

-- ── Trigger : créer le profil automatiquement à l'inscription ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
