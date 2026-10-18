begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Isolated synthetic accounts; everything in this test is rolled back.
insert into auth.users (id, email) values
  ('90000000-0000-4000-8000-00000000000a', 'rls-a@example.test'),
  ('90000000-0000-4000-8000-00000000000b', 'rls-b@example.test');
insert into public.profiles (id, display_name) values
  ('90000000-0000-4000-8000-00000000000a', 'Synthetic A'),
  ('90000000-0000-4000-8000-00000000000b', 'Synthetic B');
insert into public.products (id, slug, name, description, price_jpy, category, image_path, is_active, stock)
values ('90000000-0000-4000-8000-000000000100', 'inactive-rls-fixture', '非公開の架空商品', 'RLS test only', 100, '文房具', '/products/inactive-rls-fixture.svg', false, 1);
insert into public.orders (id, user_id, order_code, total_jpy) values
  ('90000000-0000-4000-8000-00000000010a', '90000000-0000-4000-8000-00000000000a', 'RLS_DEMO_ONLY_ORDER_A', 1280),
  ('90000000-0000-4000-8000-00000000010b', '90000000-0000-4000-8000-00000000000b', 'RLS_DEMO_ONLY_ORDER_B', 1280);
insert into public.order_items (id, order_id, product_id, quantity, unit_price_jpy) values
  ('90000000-0000-4000-8000-00000000020a', '90000000-0000-4000-8000-00000000010a', '10000000-0000-4000-8000-000000000001', 1, 1280),
  ('90000000-0000-4000-8000-00000000020b', '90000000-0000-4000-8000-00000000010b', '10000000-0000-4000-8000-000000000001', 1, 1280);

select is((select count(*) from pg_class where oid in ('public.products'::regclass, 'public.profiles'::regclass, 'public.orders'::regclass, 'public.order_items'::regclass) and relrowsecurity), 4::bigint, 'RLS is enabled on all four application tables');
select ok(has_table_privilege('anon', 'public.products', 'SELECT'), 'anonymous catalog SELECT is granted');
select ok(not has_table_privilege('anon', 'public.products', 'INSERT,UPDATE,DELETE'), 'anonymous catalog mutations are not granted');
select ok(not has_table_privilege('anon', 'public.profiles', 'SELECT'), 'anonymous profiles SELECT is not granted');
select ok(not has_table_privilege('anon', 'public.orders', 'SELECT'), 'anonymous orders SELECT is not granted');
select ok(not has_table_privilege('anon', 'public.order_items', 'SELECT'), 'anonymous items SELECT is not granted');
select ok(not has_table_privilege('authenticated', 'public.orders', 'INSERT,UPDATE,DELETE'), 'authenticated order mutations are not granted');
select ok(not has_table_privilege('authenticated', 'public.order_items', 'INSERT,UPDATE,DELETE'), 'authenticated item mutations are not granted');
select ok(not has_table_privilege('authenticated', 'public.products', 'INSERT,UPDATE,DELETE'), 'authenticated catalog mutations are not granted');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'INSERT,DELETE'), 'authenticated profile creation and deletion are not granted');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), 'display name updates are granted');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE'), 'profile ownership column cannot be updated');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'UPDATE'), 'profile creation timestamp cannot be updated');
select ok(has_table_privilege('service_role', 'public.orders', 'SELECT'), 'server fixture role has explicit order SELECT');
select ok(has_table_privilege('service_role', 'public.orders', 'INSERT'), 'server fixture role has explicit order INSERT');
select ok(has_table_privilege('service_role', 'public.orders', 'UPDATE'), 'server fixture role has explicit order UPDATE');
select ok(has_table_privilege('service_role', 'public.orders', 'DELETE'), 'server fixture role has explicit order DELETE');
select ok(not has_table_privilege('service_role', 'public.products', 'DELETE'), 'server role cannot physically delete catalog products');
select ok(not has_table_privilege('service_role', 'public.profiles', 'DELETE'), 'server fixture role cannot delete profiles');
select ok(not has_table_privilege('service_role', 'public.order_items', 'DELETE'), 'server fixture role cannot directly delete items');
select ok(not pg_has_role('authenticated', 'service_role', 'MEMBER'), 'authenticated role cannot assume service_role');
select ok(not pg_has_role('anon', 'service_role', 'MEMBER'), 'anonymous role cannot assume service_role');

select throws_ok($$update public.products set price_jpy = -1 where id = '10000000-0000-4000-8000-000000000001'$$, '23514', null, 'negative JPY price is rejected');
select throws_ok($$update public.products set stock = -1 where id = '10000000-0000-4000-8000-000000000001'$$, '23514', null, 'negative stock is rejected');
select throws_ok($$update public.orders set total_jpy = -1 where id = '90000000-0000-4000-8000-00000000010a'$$, '23514', null, 'negative order total is rejected');
select throws_ok($$update public.order_items set quantity = 0 where id = '90000000-0000-4000-8000-00000000020a'$$, '23514', null, 'quantity zero is rejected');
select throws_ok($$update public.order_items set quantity = 11 where id = '90000000-0000-4000-8000-00000000020a'$$, '23514', null, 'quantity above ten is rejected');
select throws_ok($$update public.order_items set unit_price_jpy = -1 where id = '90000000-0000-4000-8000-00000000020a'$$, '23514', null, 'negative unit price is rejected');

set local role service_role;
select is((select count(*) from public.orders where id in ('90000000-0000-4000-8000-00000000010a', '90000000-0000-4000-8000-00000000010b')), 2::bigint, 'server-only fixture role can read both synthetic owners');
select is((select count(*) from public.products where id = '90000000-0000-4000-8000-000000000100'), 1::bigint, 'server-only fixture role can maintain inactive catalog entries');
select throws_ok($$delete from public.products where id = '90000000-0000-4000-8000-000000000100'$$, '42501', null, 'server-only fixture role still cannot physically delete products');
reset role;

set local role anon;
select is((select count(*) from public.products where is_active), 10::bigint, 'anonymous callers see ten seeded active products');
select is((select count(*) from public.products where id = '90000000-0000-4000-8000-000000000100'), 0::bigint, 'anonymous callers cannot read inactive products');
select throws_ok($$select * from public.profiles$$, '42501', null, 'anonymous profile access is denied');
select throws_ok($$select * from public.orders$$, '42501', null, 'anonymous order access is denied');
select throws_ok($$select * from public.order_items$$, '42501', null, 'anonymous order item access is denied');
select throws_ok($$update public.products set price_jpy = 0$$, '42501', null, 'anonymous callers cannot change prices');
select throws_ok($$delete from public.products$$, '42501', null, 'anonymous callers cannot delete products');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select is(auth.uid(), '90000000-0000-4000-8000-00000000000a'::uuid, 'JWT test principal is buyer A');
select is((select count(*) from public.profiles), 1::bigint, 'A sees only their own profile');
select is((select count(*) from public.profiles where id = '90000000-0000-4000-8000-00000000000b'), 0::bigint, 'A cannot see B profile');
select is((select count(*) from public.orders), 1::bigint, 'A sees only their own order');
select is((select order_code from public.orders where id = '90000000-0000-4000-8000-00000000010a'), 'RLS_DEMO_ONLY_ORDER_A', 'A can read their marked synthetic order');
select is((select count(*) from public.orders where id = '90000000-0000-4000-8000-00000000010b'), 0::bigint, 'A cannot read B order by known ID');
select is((select count(*) from public.order_items), 1::bigint, 'A sees only their own order item');
select is((select count(*) from public.order_items where order_id = '90000000-0000-4000-8000-00000000010b'), 0::bigint, 'A cannot read B items by known order ID');
select is((select count(*) from public.products where id = '90000000-0000-4000-8000-000000000100'), 0::bigint, 'authenticated callers also cannot read inactive products');
select lives_ok($$update public.profiles set display_name = 'Updated synthetic A' where id = '90000000-0000-4000-8000-00000000000a'$$, 'A can update their own display name');
select is((select display_name from public.profiles), 'Updated synthetic A', 'own display name update takes effect');
select lives_ok($$update public.profiles set display_name = 'Attempted overwrite' where id = '90000000-0000-4000-8000-00000000000b'$$, 'other-owner profile update affects zero rows');
select throws_ok($$update public.profiles set id = '90000000-0000-4000-8000-00000000000b' where id = '90000000-0000-4000-8000-00000000000a'$$, '42501', null, 'A cannot change their profile owner ID');
select throws_ok($$update public.profiles set created_at = now()$$, '42501', null, 'A cannot alter a profile creation timestamp');
select throws_ok($$insert into public.orders (user_id, order_code, total_jpy) values ('90000000-0000-4000-8000-00000000000b', 'FORGED_ORDER', 0)$$, '42501', null, 'A cannot forge orders with B user ID');
select throws_ok($$update public.orders set user_id = '90000000-0000-4000-8000-00000000000b' where id = '90000000-0000-4000-8000-00000000010a'$$, '42501', null, 'A cannot reassign an order owner');
select throws_ok($$delete from public.orders where id = '90000000-0000-4000-8000-00000000010a'$$, '42501', null, 'A cannot delete orders');
select throws_ok($$insert into public.order_items (order_id, product_id, quantity, unit_price_jpy) values ('90000000-0000-4000-8000-00000000010b', '10000000-0000-4000-8000-000000000002', 1, 0)$$, '42501', null, 'A cannot insert items into B order');
select throws_ok($$update public.order_items set quantity = 10$$, '42501', null, 'A cannot mutate order items');
select throws_ok($$delete from public.order_items$$, '42501', null, 'A cannot delete order items');

select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select is(auth.uid(), '90000000-0000-4000-8000-00000000000b'::uuid, 'JWT test principal changes to buyer B');
select is((select count(*) from public.profiles), 1::bigint, 'B sees only their own profile');
select is((select display_name from public.profiles), 'Synthetic B', 'A could not modify B display name');
select is((select count(*) from public.orders), 1::bigint, 'B sees only their own order');
select is((select order_code from public.orders), 'RLS_DEMO_ONLY_ORDER_B', 'B sees their own marked synthetic order');
select is((select count(*) from public.orders where id = '90000000-0000-4000-8000-00000000010a'), 0::bigint, 'B cannot read A order by known ID');
select is((select count(*) from public.order_items), 1::bigint, 'B sees only their own order item');
select is((select count(*) from public.order_items where order_id = '90000000-0000-4000-8000-00000000010a'), 0::bigint, 'B cannot read A items by known order ID');

select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select is(auth.uid(), null::uuid, 'missing subject does not create a principal');
select is((select count(*) from public.profiles), 0::bigint, 'missing subject cannot read profiles');
select is((select count(*) from public.orders), 0::bigint, 'missing subject cannot read orders');
select is((select count(*) from public.order_items), 0::bigint, 'missing subject cannot read items');

reset role;
select * from finish();
rollback;
