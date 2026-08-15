alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

alter table public.recipes
  alter column image_path drop not null,
  alter column image_mime_type drop not null,
  alter column image_width drop not null,
  alter column image_height drop not null,
  alter column image_byte_size drop not null;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
