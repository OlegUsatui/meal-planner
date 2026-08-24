create or replace function public.move_meal_plan_entry(
  p_entry_id text,
  p_target_date text,
  p_target_slot text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  source_entry public.meal_plan_entries%rowtype;
  target_entry public.meal_plan_entries%rowtype;
  target_key text;
begin
  if p_target_slot not in ('breakfast', 'lunch', 'dinner', 'snack') then
    raise exception 'invalid target slot';
  end if;

  select * into source_entry
  from public.meal_plan_entries
  where id = p_entry_id and owner_id = auth.uid()
  for update;
  if not found then raise exception 'plan entry not found'; end if;
  if source_entry.date < current_date or p_target_date::date < current_date then
    raise exception 'cannot move a past plan entry';
  end if;
  if source_entry.date::text = p_target_date and source_entry.slot = p_target_slot then
    return;
  end if;

  target_key := p_target_date || ':' || p_target_slot;
  select * into target_entry
  from public.meal_plan_entries
  where owner_id = auth.uid() and date_slot = target_key
  for update;

  update public.meal_plan_entries
  set date_slot = '__moving:' || source_entry.id,
      updated_at = now()
  where id = source_entry.id;

  if found and target_entry.id is not null then
    update public.meal_plan_entries
    set date = source_entry.date,
        slot = source_entry.slot,
        date_slot = source_entry.date_slot,
        updated_at = now()
    where id = target_entry.id;
  end if;

  update public.meal_plan_entries
  set date = p_target_date::date,
      slot = p_target_slot,
      date_slot = target_key,
      updated_at = now()
  where id = source_entry.id;
end;
$$;

revoke all on function public.move_meal_plan_entry(text, text, text) from public;
grant execute on function public.move_meal_plan_entry(text, text, text) to authenticated;
