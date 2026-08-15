alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  alter table public.profiles
    add constraint profiles_role_check check (role in ('user', 'admin'));
exception
  when duplicate_object then null;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Users can read system and own products" on public.products;
drop policy if exists "Users can update own products" on public.products;
drop policy if exists "Users can archive own products" on public.products;
create policy "Users and admins can read products" on public.products
  for select to authenticated using (owner_id is null or owner_id = auth.uid() or public.is_admin());
create policy "Users and admins can update products" on public.products
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or owner_id is null or public.is_admin());
create policy "Users and admins can archive products" on public.products
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Users can read system and own recipes" on public.recipes;
drop policy if exists "Users can update own recipes" on public.recipes;
drop policy if exists "Users can delete own recipes" on public.recipes;
create policy "Users and admins can read recipes" on public.recipes
  for select to authenticated using (owner_id is null or owner_id = auth.uid() or public.is_admin());
create policy "Users and admins can update recipes" on public.recipes
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or owner_id is null or public.is_admin());
create policy "Users and admins can delete recipes" on public.recipes
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Users can read visible recipe ingredients" on public.recipe_ingredients;
drop policy if exists "Users can create ingredients for own recipes" on public.recipe_ingredients;
drop policy if exists "Users can update ingredients for own recipes" on public.recipe_ingredients;
drop policy if exists "Users can delete ingredients for own recipes" on public.recipe_ingredients;
create policy "Users and admins can read visible recipe ingredients" on public.recipe_ingredients
  for select to authenticated using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.owner_id is null or r.owner_id = auth.uid() or public.is_admin())
  ));
create policy "Users and admins can create recipe ingredients" on public.recipe_ingredients
  for insert to authenticated with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.owner_id = auth.uid() or public.is_admin())
  ) and exists (
    select 1 from public.products p
    where p.id = product_id and (p.owner_id is null or p.owner_id = auth.uid() or public.is_admin())
  ));
create policy "Users and admins can update recipe ingredients" on public.recipe_ingredients
  for update to authenticated using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.owner_id = auth.uid() or public.is_admin())
  ));
create policy "Users and admins can delete recipe ingredients" on public.recipe_ingredients
  for delete to authenticated using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.owner_id = auth.uid() or public.is_admin())
  ));

comment on column public.profiles.role is 'Authorization role. Only trusted database operators should promote a user to admin.';

