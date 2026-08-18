create or replace function public.update_product_base_unit(
  p_product_id text,
  p_name text,
  p_normalized_name text,
  p_category text,
  p_base_unit text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_product public.products%rowtype;
begin
  if p_base_unit not in ('g', 'ml', 'pcs') then
    raise exception 'invalid base unit';
  end if;

  select * into current_product from public.products where id = p_product_id for update;
  if not found then raise exception 'product not found'; end if;
  if current_product.owner_id is not null and current_product.owner_id <> auth.uid() and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.recipe_ingredients
  set entered_unit = p_base_unit,
      quantity_base = entered_quantity
  where product_id = p_product_id;

  update public.products
  set name = p_name,
      normalized_name = p_normalized_name,
      category = p_category,
      base_unit = p_base_unit,
      updated_at = now()
  where id = p_product_id;
end;
$$;

revoke all on function public.update_product_base_unit(text, text, text, text, text) from public;
grant execute on function public.update_product_base_unit(text, text, text, text, text) to authenticated;
