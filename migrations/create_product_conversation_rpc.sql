-- Create or get a product-scoped conversation between a customer and a seller
-- Params:
--   p_customer_id uuid (auth user id)
--   p_seller_id   uuid (auth user id of seller)
--   p_product_id  uuid (products.id)
--   p_display_name text (optional title)
create or replace function public.create_or_get_product_conversation(
  p_customer_id uuid,
  p_seller_id uuid,
  p_product_id uuid,
  p_display_name text default 'Product chat'
) returns table (conversation_id uuid)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_conversation_id uuid;
begin
  -- Prevent self-chat
  if p_customer_id = p_seller_id then
    raise exception 'Seller and customer cannot be the same user';
  end if;

  -- Find existing active conversation for this product/customer/seller
  select c.id
    into v_conversation_id
  from conversations c
  join conversation_participants cp1 on cp1.conversation_id = c.id and cp1.user_id = p_customer_id
  join conversation_participants cp2 on cp2.conversation_id = c.id and cp2.user_id = p_seller_id
  where c.product_id = p_product_id
    and coalesce(c.is_archived, false) = false
    and c.type = 'direct'
  limit 1;

  if v_conversation_id is null then
    v_conversation_id := gen_random_uuid();
    insert into conversations (
      id, name, type, context, product_id, created_at, updated_at, is_archived
    ) values (
      v_conversation_id,
      p_display_name,
      'direct',
      'product',
      p_product_id,
      now(),
      now(),
      false
    );

    insert into conversation_participants (conversation_id, user_id, role, account_type, joined_at)
    values
      (v_conversation_id, p_customer_id, 'customer', 'customer', now()),
      (v_conversation_id, p_seller_id, 'seller', 'seller', now())
    on conflict (conversation_id, user_id) do nothing;
  end if;

  return query select v_conversation_id;
end;
$$;

grant execute on function public.create_or_get_product_conversation(uuid, uuid, uuid, text) to authenticated;
revoke execute on function public.create_or_get_product_conversation(uuid, uuid, uuid, text) from anon;
