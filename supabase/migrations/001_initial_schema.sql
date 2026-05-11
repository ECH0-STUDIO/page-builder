-- ============================================================
-- 001_initial_schema.sql
-- Full initial schema for Eatery Page Builder
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search on directory

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with display info
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- BUSINESSES
-- ============================================================
create table public.businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  address text,
  city text,
  phone text,
  email text,
  opening_hours jsonb default '[]'::jsonb,
  -- [{ day: 'monday', open: true, from: '08:00', to: '22:00' }, ...]
  social_links jsonb default '{}'::jsonb,
  -- { facebook: '', instagram: '', zalo: '', tiktok: '', youtube: '' }
  category text[] default '{}',
  tags text[] default '{}',
  marketplace_listed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses(owner_id);
create index businesses_slug_idx on public.businesses(slug);
create index businesses_category_idx on public.businesses using gin(category);
create index businesses_tags_idx on public.businesses using gin(tags);
create index businesses_name_search_idx on public.businesses using gin(name gin_trgm_ops);

-- ============================================================
-- THEME SETTINGS
-- ============================================================
create table public.theme_settings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  primary_color text not null default '#E85D26',
  background_color text not null default '#FFFFFF',
  font_family text not null default 'Inter',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PUBLISHING SETTINGS
-- ============================================================
create table public.publishing_settings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  published boolean not null default false,
  custom_domain text,
  seo_title text,
  seo_description text,
  og_image_url text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PAGE BLOCKS
-- The ordered list of blocks that make up the live page
-- ============================================================
create table public.page_blocks (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null,
  -- 'hero' | 'text_image' | 'menu_grid' | 'contact' | 'qr_code'
  -- 'gallery' | 'video' | 'testimonials' | 'announcement'
  sort_order integer not null default 0,
  visible boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  -- Block-specific settings (layout, content, styles etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index page_blocks_business_id_idx on public.page_blocks(business_id);
create index page_blocks_sort_order_idx on public.page_blocks(business_id, sort_order);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
create table public.menu_categories (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_categories_business_id_idx on public.menu_categories(business_id);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 0) not null default 0, -- VND, no decimals
  image_url text,
  available boolean not null default true,
  sort_order integer not null default 0,
  tags text[] default '{}', -- 'vegetarian' | 'spicy' | 'bestseller' | 'new'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_business_id_idx on public.menu_items(business_id);
create index menu_items_category_id_idx on public.menu_items(category_id);

-- ============================================================
-- MENU ITEM VARIANT GROUPS
-- e.g. "Size", "Toppings", "Add-ons"
-- ============================================================
create table public.menu_item_variant_groups (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null, -- 'Size', 'Add-ons'
  required boolean not null default false,
  sort_order integer not null default 0
);

create index variant_groups_item_id_idx on public.menu_item_variant_groups(item_id);

-- ============================================================
-- MENU ITEM VARIANT OPTIONS
-- e.g. Small (+0), Large (+10000), Extra shot (+15000)
-- ============================================================
create table public.menu_item_variant_options (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.menu_item_variant_groups(id) on delete cascade,
  label text not null,
  price_delta numeric(12, 0) not null default 0,
  sort_order integer not null default 0
);

create index variant_options_group_id_idx on public.menu_item_variant_options(group_id);

-- ============================================================
-- PAYMENT SETTINGS
-- ============================================================
create table public.payment_settings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  vietqr_bank_id text,     -- VietQR bank code e.g. 'VCB', 'TCB'
  vietqr_bank_name text,
  vietqr_account_number text,
  vietqr_account_name text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- QR CODES (metadata — actual QR generated client-side)
-- ============================================================
create table public.qr_codes (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null, -- 'business' | 'item' | 'table'
  target_id uuid,     -- item_id or null for business QR
  label text,
  table_number integer, -- for table QRs (v2)
  scan_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index qr_codes_business_id_idx on public.qr_codes(business_id);

-- ============================================================
-- PRINT MENUS
-- ============================================================
create table public.print_menus (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null default 'Main Menu',
  template_id text not null default 'classic', -- 'classic' | 'modern' | 'dark' | 'minimal' | 'framed'
  page_size text not null default 'A4',        -- 'A4' | 'A5'
  category_filter uuid[] default null,          -- null = show all, else array of category_ids
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index print_menus_business_id_idx on public.print_menus(business_id);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.businesses
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.theme_settings
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.publishing_settings
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.page_blocks
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.menu_categories
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.menu_items
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.print_menus
  for each row execute procedure public.set_updated_at();
