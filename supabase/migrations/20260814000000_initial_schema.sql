create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  category text not null,
  base_unit text not null check (base_unit in ('g', 'ml', 'pcs')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  image_path text not null,
  image_mime_type text not null,
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  image_byte_size integer not null check (image_byte_size > 0),
  instructions text not null,
  calories_per_serving numeric,
  protein_grams_per_serving numeric,
  fat_grams_per_serving numeric,
  carbs_grams_per_serving numeric,
  preparation_time_min_minutes integer,
  preparation_time_max_minutes integer,
  classifications jsonb not null default '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (preparation_time_min_minutes is null or preparation_time_min_minutes between 0 and 1440),
  check (preparation_time_max_minutes is null or preparation_time_max_minutes between 0 and 1440),
  check (preparation_time_min_minutes is null or preparation_time_max_minutes is not null),
  check (preparation_time_max_minutes is null or preparation_time_min_minutes is not null),
  check (preparation_time_min_minutes is null or preparation_time_min_minutes <= preparation_time_max_minutes)
);

create table if not exists public.recipe_ingredients (
  id text primary key,
  recipe_id text not null references public.recipes(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity_base numeric not null check (quantity_base > 0),
  entered_quantity numeric not null check (entered_quantity > 0),
  entered_unit text not null check (entered_unit in ('g', 'kg', 'ml', 'l', 'pcs')),
  unique (recipe_id, product_id)
);

create table if not exists public.meal_plan_entries (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  date_slot text not null,
  recipe_id text not null references public.recipes(id) on delete restrict,
  servings integer not null check (servings between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, date_slot)
);

create unique index if not exists products_owner_name_unique
  on public.products (owner_id, normalized_name)
  where archived_at is null;
create unique index if not exists recipes_owner_name_unique
  on public.recipes (owner_id, normalized_name)
  where archived_at is null;
create index if not exists products_visible_name on public.products (normalized_name);
create index if not exists recipes_visible_name on public.recipes (normalized_name);
create index if not exists recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);
create index if not exists meal_plan_owner_date on public.meal_plan_entries (owner_id, date);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plan_entries enable row level security;

create policy "Users can read their profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "Users can read system and own products" on public.products
  for select to authenticated using (owner_id is null or owner_id = auth.uid());
create policy "Users can create own products" on public.products
  for insert to authenticated with check (owner_id = auth.uid());
create policy "Users can update own products" on public.products
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users can archive own products" on public.products
  for delete to authenticated using (owner_id = auth.uid());

create policy "Users can read system and own recipes" on public.recipes
  for select to authenticated using (owner_id is null or owner_id = auth.uid());
create policy "Users can create own recipes" on public.recipes
  for insert to authenticated with check (owner_id = auth.uid());
create policy "Users can update own recipes" on public.recipes
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users can delete own recipes" on public.recipes
  for delete to authenticated using (owner_id = auth.uid());

create policy "Users can read visible recipe ingredients" on public.recipe_ingredients
  for select to authenticated using (exists (
    select 1 from public.recipes r where r.id = recipe_id and (r.owner_id is null or r.owner_id = auth.uid())
  ));
create policy "Users can create ingredients for own recipes" on public.recipe_ingredients
  for insert to authenticated with check (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid()
  ) and exists (
    select 1 from public.products p where p.id = product_id and (p.owner_id is null or p.owner_id = auth.uid())
  ));
create policy "Users can update ingredients for own recipes" on public.recipe_ingredients
  for update to authenticated using (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid()
  ));
create policy "Users can delete ingredients for own recipes" on public.recipe_ingredients
  for delete to authenticated using (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid()
  ));

create policy "Users can read own meal plans" on public.meal_plan_entries
  for select to authenticated using (owner_id = auth.uid());
create policy "Users can create own meal plans" on public.meal_plan_entries
  for insert to authenticated with check (owner_id = auth.uid() and exists (
    select 1 from public.recipes r where r.id = recipe_id and (r.owner_id is null or r.owner_id = auth.uid())
  ));
create policy "Users can update own meal plans" on public.meal_plan_entries
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and exists (
    select 1 from public.recipes r where r.id = recipe_id and (r.owner_id is null or r.owner_id = auth.uid())
  ));
create policy "Users can delete own meal plans" on public.meal_plan_entries
  for delete to authenticated using (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', false)
on conflict (id) do nothing;

create policy "Users can read system and own recipe images" on storage.objects
  for select to authenticated using (
    bucket_id = 'recipe-images' and ((storage.foldername(name))[1] = 'system' or (storage.foldername(name))[1] = auth.uid()::text)
  );
create policy "Users can upload own recipe images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can update own recipe images" on storage.objects
  for update to authenticated using (
    bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can delete own recipe images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
