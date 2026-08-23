alter table public.meal_plan_entries
  drop constraint if exists meal_plan_entries_servings_check;

alter table public.meal_plan_entries
  drop column if exists servings;
