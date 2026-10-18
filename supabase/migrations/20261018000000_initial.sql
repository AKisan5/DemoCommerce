-- M1: synthetic catalog, accounts and fixture orders. No checkout or Lab RPC.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 2000),
  price_jpy integer not null check (price_jpy >= 0),
  category text not null check (category in ('文房具', '暮らし', 'ガジェット')),
  image_path text not null check (image_path ~ '^/products/[a-z0-9-]+\.svg$'),
  is_active boolean not null default true,
  stock integer not null default 0 check (stock >= 0)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_code text not null unique check (char_length(order_code) between 1 and 80),
  status text not null default 'demo_confirmed' check (status in ('demo_confirmed', 'demo_cancelled')),
  total_jpy integer not null check (total_jpy >= 0),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_jpy integer not null check (unit_price_jpy >= 0),
  unique (order_id, product_id)
);

create index orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Remove Supabase's broad default grants before allowing the necessary operations.
revoke all on table public.products, public.profiles, public.orders, public.order_items
  from public, anon, authenticated, service_role;
revoke create on schema public from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

grant select on public.products to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items to authenticated;
-- A user cannot change their ID or created_at through the Data API.
grant update (display_name) on public.profiles to authenticated;

-- Server-only fixture provisioning. Catalog deletion is deliberately unavailable.
grant select, insert, update on public.products to service_role;
grant select, insert, update on public.profiles, public.order_items to service_role;
-- Fixture reset deletes only named orders; their items follow ON DELETE CASCADE.
grant select, insert, update, delete on public.orders to service_role;

create policy products_active_read on public.products
  for select to anon, authenticated using (is_active = true);
create policy profiles_owner_read on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_owner_update on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy orders_owner_read on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy order_items_owner_read on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid()))
  );

comment on table public.orders is 'Synthetic demonstration orders only; client writes are not granted.';
comment on table public.order_items is 'Synthetic order items; visibility follows the parent order owner.';
