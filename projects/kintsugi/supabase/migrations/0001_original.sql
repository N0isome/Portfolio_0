-- =====================================================================
-- KINTSUGI · Migración 0001 · Esquema inicial (MVP)
-- =====================================================================
-- Principios de diseño:
--   1. El cliente (anon key) NUNCA puede escalar privilegios: los campos
--      sensibles (role, stripe_account_id, status) no son editables
--      directamente; las transiciones de estado pasan por funciones RPC.
--   2. RLS activado en todas las tablas. Los helpers SECURITY DEFINER
--      evitan recursión infinita entre políticas.
--   3. Las operaciones multi-fila (aceptar oferta) son atómicas.
--   4. Las fotos viven en un bucket PRIVADO; se sirven con URLs firmadas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------
create type public.user_role       as enum ('user', 'maker');
create type public.request_status  as enum ('open', 'in_progress', 'completed', 'cancelled');
create type public.offer_status    as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type public.purchase_status as enum ('paid', 'refunded');

-- ---------------------------------------------------------------------
-- 2. Utilidades
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Tabla: users (perfil ligado a auth.users)
-- ---------------------------------------------------------------------
create table public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  role              public.user_role not null default 'user',
  name              text not null check (char_length(name) between 1 and 80),
  email             text not null unique,
  location_lat      double precision check (location_lat between -90 and 90),
  location_lng      double precision check (location_lng between -180 and 180),
  stripe_account_id text,   -- Stripe Connect (solo Makers). Lo escribe únicamente el backend.
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint users_location_pair check ((location_lat is null) = (location_lng is null))
);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Tabla: maker_profiles (datos comerciales visibles en el mapa)
-- ---------------------------------------------------------------------
create table public.maker_profiles (
  maker_id     uuid primary key references public.users(id) on delete cascade,
  bio          text check (char_length(bio) <= 500),
  specialties  text[] not null default '{}',
  base_price   numeric(10,2) not null default 0 check (base_price >= 0),
  rating_avg   numeric(3,2)  not null default 0 check (rating_avg between 0 and 5),
  rating_count integer       not null default 0 check (rating_count >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_maker_profiles_updated_at
  before update on public.maker_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. Tabla: repair_requests
-- ---------------------------------------------------------------------
create table public.repair_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  -- Ruta del objeto dentro del bucket privado 'repair-images'
  -- (p. ej. '<uid>/1717171717_ab12cd34.jpg'). Se firma al leer.
  image_url         text not null,
  item_name         text check (char_length(item_name) <= 120),
  ai_diagnosis_text text,
  ai_diagnosis_json jsonb,   -- salida estructurada y validada de la IA
  status            public.request_status not null default 'open',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_repair_requests_updated_at
  before update on public.repair_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. Tabla: offers
-- ---------------------------------------------------------------------
create table public.offers (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.repair_requests(id) on delete cascade,
  maker_id    uuid not null references public.users(id) on delete cascade,
  price       numeric(10,2) not null check (price >= 0),
  message     text check (char_length(message) <= 1000),
  status      public.offer_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, maker_id)  -- una oferta por Maker y solicitud
);

create trigger trg_offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

-- Máximo una oferta aceptada por solicitud (garantía a nivel de BD)
create unique index uq_offers_one_accepted_per_request
  on public.offers(request_id) where status = 'accepted';

-- ---------------------------------------------------------------------
-- 7. Tabla: reviews (alimenta el rating de los Makers)
-- ---------------------------------------------------------------------
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null unique references public.offers(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  maker_id    uuid not null references public.users(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 1000),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Tabla: cad_purchases (compras de archivos CAD 3D)
-- ---------------------------------------------------------------------
create table public.cad_purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  request_id        uuid not null references public.repair_requests(id) on delete cascade,
  part_name         text not null,
  amount_cents      integer not null check (amount_cents > 0),
  currency          char(3) not null default 'USD',
  status            public.purchase_status not null default 'paid',
  payment_reference text not null,   -- id del PaymentIntent de Stripe (o mock_*)
  created_at        timestamptz not null default now(),
  -- Idempotencia: la misma pieza de la misma solicitud no se cobra dos veces
  unique (user_id, request_id, part_name)
);

-- ---------------------------------------------------------------------
-- 9. Índices
-- ---------------------------------------------------------------------
create index idx_requests_user_created on public.repair_requests(user_id, created_at desc);
create index idx_requests_open         on public.repair_requests(created_at desc) where status = 'open';
create index idx_offers_request        on public.offers(request_id, status);
create index idx_offers_maker          on public.offers(maker_id, status);
create index idx_reviews_maker         on public.reviews(maker_id);
create index idx_purchases_user        on public.cad_purchases(user_id);
create index idx_users_makers_geo      on public.users(location_lat, location_lng) where role = 'maker';

-- ---------------------------------------------------------------------
-- 10. Alta automática de perfil al registrarse
-- ---------------------------------------------------------------------
-- El rol llega en raw_user_meta_data ('user' | 'maker'). Cualquier otro
-- valor cae a 'user' (nunca falla el registro por un rol inválido).
-- En producción, la verificación de Makers debería pasar por un flujo
-- de aprobación (p. ej. estado 'pending_review').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
begin
  v_role := case when new.raw_user_meta_data->>'role' = 'maker'
                 then 'maker'::public.user_role
                 else 'user'::public.user_role end;

  v_name := left(coalesce(
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  ), 80);

  insert into public.users (id, email, name, role)
  values (new.id, new.email, v_name, v_role);

  if v_role = 'maker' then
    insert into public.maker_profiles (maker_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 11. Recalcular rating del Maker cuando cambian las reseñas
-- ---------------------------------------------------------------------
create or replace function public.refresh_maker_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_maker uuid;
begin
  if tg_op = 'DELETE' then
    v_maker := old.maker_id;
  else
    v_maker := new.maker_id;
  end if;

  update public.maker_profiles mp
     set rating_avg   = coalesce(s.avg_rating, 0),
         rating_count = s.cnt
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as cnt
        from public.reviews
       where maker_id = v_maker
    ) s
   where mp.maker_id = v_maker;

  return null;
end;
$$;

create trigger trg_reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_maker_rating();

-- ---------------------------------------------------------------------
-- 12. Helpers de autorización (SECURITY DEFINER para evitar recursión RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_maker()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'maker');
$$;

create or replace function public.owns_request(p_request_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.repair_requests where id = p_request_id and user_id = auth.uid());
$$;

create or replace function public.has_offer_on(p_request_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.offers where request_id = p_request_id and maker_id = auth.uid());
$$;

create or replace function public.can_offer_on(p_request_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.repair_requests
     where id = p_request_id and status = 'open' and user_id <> auth.uid()
  );
$$;

create or replace function public.can_review_offer(p_offer_id uuid, p_maker_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.offers o
      join public.repair_requests r on r.id = o.request_id
     where o.id = p_offer_id
       and o.maker_id = p_maker_id
       and o.status = 'accepted'
       and r.status = 'completed'
       and r.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 13. Vista pública de Makers (sin email ni stripe_account_id)
-- ---------------------------------------------------------------------
-- Se ejecuta con los privilegios del propietario a propósito: expone solo
-- columnas no sensibles de los Makers a cualquier usuario autenticado.
create view public.makers_public as
  select u.id, u.name, u.location_lat, u.location_lng,
         mp.bio, mp.specialties, mp.base_price, mp.rating_avg, mp.rating_count
    from public.users u
    join public.maker_profiles mp on mp.maker_id = u.id
   where u.role = 'maker';

-- ---------------------------------------------------------------------
-- 14. Makers cercanos (Haversine; migrar a PostGIS al escalar)
-- ---------------------------------------------------------------------
create or replace function public.nearby_makers(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 25,
  p_limit     integer default 50
)
returns table (
  id uuid, name text, bio text, specialties text[],
  base_price numeric, rating_avg numeric, rating_count integer,
  location_lat double precision, location_lng double precision,
  distance_km double precision
)
language sql stable
set search_path = public
as $$
  select t.*
    from (
      select m.id, m.name, m.bio, m.specialties, m.base_price,
             m.rating_avg, m.rating_count, m.location_lat, m.location_lng,
             6371 * acos(least(1, greatest(-1,
               cos(radians(p_lat)) * cos(radians(m.location_lat)) *
               cos(radians(m.location_lng) - radians(p_lng)) +
               sin(radians(p_lat)) * sin(radians(m.location_lat))
             ))) as distance_km
        from public.makers_public m
       where m.location_lat is not null and m.location_lng is not null
    ) t
   where t.distance_km <= p_radius_km
   order by t.distance_km
   limit least(greatest(p_limit, 1), 100);
$$;

-- ---------------------------------------------------------------------
-- 15. RPCs de transición de estado (atómicas y con comprobación de dueño)
-- ---------------------------------------------------------------------
create or replace function public.accept_offer(p_offer_id uuid)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer   public.offers;
  v_request public.repair_requests;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    raise exception 'offer_not_found' using errcode = 'P0002';
  end if;

  select * into v_request from public.repair_requests where id = v_offer.request_id for update;
  if v_request.user_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_request.status <> 'open' or v_offer.status <> 'pending' then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;

  update public.offers set status = 'accepted' where id = p_offer_id returning * into v_offer;
  update public.offers
     set status = 'rejected'
   where request_id = v_offer.request_id and id <> p_offer_id and status = 'pending';
  update public.repair_requests set status = 'in_progress' where id = v_offer.request_id;

  return v_offer;
end;
$$;

create or replace function public.withdraw_offer(p_offer_id uuid)
returns public.offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
begin
  update public.offers
     set status = 'withdrawn'
   where id = p_offer_id and maker_id = auth.uid() and status = 'pending'
  returning * into v_offer;

  if not found then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  return v_offer;
end;
$$;

create or replace function public.complete_request(p_request_id uuid)
returns public.repair_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.repair_requests;
begin
  update public.repair_requests
     set status = 'completed'
   where id = p_request_id and user_id = auth.uid() and status = 'in_progress'
  returning * into v_request;

  if not found then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  return v_request;
end;
$$;

create or replace function public.cancel_request(p_request_id uuid)
returns public.repair_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.repair_requests;
begin
  update public.repair_requests
     set status = 'cancelled'
   where id = p_request_id and user_id = auth.uid() and status in ('open', 'in_progress')
  returning * into v_request;

  if not found then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;

  update public.offers set status = 'rejected'  where request_id = p_request_id and status = 'pending';
  update public.offers set status = 'withdrawn' where request_id = p_request_id and status = 'accepted';
  return v_request;
end;
$$;

-- ⚠️ SOLO MVP (pagos simulados). Elimina esta función cuando Stripe real
-- esté integrado: el registro de la compra lo hará el webhook con service_role.
create or replace function public.mock_confirm_cad_purchase(
  p_request_id   uuid,
  p_part_name    text,
  p_amount_cents integer,
  p_reference    text
)
returns public.cad_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.cad_purchases;
begin
  if not public.owns_request(p_request_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.cad_purchases (user_id, request_id, part_name, amount_cents, payment_reference)
  values (auth.uid(), p_request_id, p_part_name, p_amount_cents, p_reference)
  on conflict (user_id, request_id, part_name) do nothing;

  select * into v_purchase
    from public.cad_purchases
   where user_id = auth.uid() and request_id = p_request_id and part_name = p_part_name;

  return v_purchase;
end;
$$;

-- ---------------------------------------------------------------------
-- 16. Privilegios a nivel de columna / función
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;

-- users: solo estas columnas son editables por el cliente
revoke update on public.users from authenticated;
grant  update (name, location_lat, location_lng) on public.users to authenticated;

-- repair_requests: el cliente nunca cambia 'status' ni 'user_id' tras crear
revoke update on public.repair_requests from authenticated;
grant  update (item_name, ai_diagnosis_text, ai_diagnosis_json) on public.repair_requests to authenticated;

-- maker_profiles: el Maker edita solo su información comercial
revoke update on public.maker_profiles from authenticated;
grant  update (bio, specialties, base_price) on public.maker_profiles to authenticated;

-- offers: sin UPDATE/DELETE directo (se usa accept_offer / withdraw_offer)
revoke update, delete on public.offers from authenticated;

-- cad_purchases: solo lectura desde el cliente
revoke insert, update, delete on public.cad_purchases from authenticated;

grant select on public.makers_public to authenticated;

revoke all on function public.accept_offer(uuid)                          from public;
revoke all on function public.withdraw_offer(uuid)                        from public;
revoke all on function public.complete_request(uuid)                      from public;
revoke all on function public.cancel_request(uuid)                        from public;
revoke all on function public.mock_confirm_cad_purchase(uuid, text, integer, text) from public;
revoke all on function public.nearby_makers(double precision, double precision, double precision, integer) from public;
grant execute on function public.accept_offer(uuid)                          to authenticated;
grant execute on function public.withdraw_offer(uuid)                        to authenticated;
grant execute on function public.complete_request(uuid)                      to authenticated;
grant execute on function public.cancel_request(uuid)                        to authenticated;
grant execute on function public.mock_confirm_cad_purchase(uuid, text, integer, text) to authenticated;
grant execute on function public.nearby_makers(double precision, double precision, double precision, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 17. Row Level Security
-- ---------------------------------------------------------------------
alter table public.users           enable row level security;
alter table public.maker_profiles  enable row level security;
alter table public.repair_requests enable row level security;
alter table public.offers          enable row level security;
alter table public.reviews         enable row level security;
alter table public.cad_purchases   enable row level security;

-- users
create policy users_select_own on public.users
  for select to authenticated using (auth.uid() = id);
create policy users_update_own on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- maker_profiles (lectura pública vía vista; escritura solo del propio Maker)
create policy maker_profiles_select_own on public.maker_profiles
  for select to authenticated using (auth.uid() = maker_id);
create policy maker_profiles_update_own on public.maker_profiles
  for update to authenticated using (auth.uid() = maker_id) with check (auth.uid() = maker_id);

-- repair_requests
create policy requests_owner_select on public.repair_requests
  for select to authenticated using (auth.uid() = user_id);
create policy requests_owner_insert on public.repair_requests
  for insert to authenticated with check (auth.uid() = user_id and status = 'open');
create policy requests_owner_update on public.repair_requests
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy requests_owner_delete on public.repair_requests
  for delete to authenticated using (auth.uid() = user_id and status in ('open', 'cancelled'));
create policy requests_maker_select on public.repair_requests
  for select to authenticated using (
    public.is_maker() and (status = 'open' or public.has_offer_on(id))
  );

-- offers
create policy offers_maker_insert on public.offers
  for insert to authenticated with check (
    auth.uid() = maker_id
    and status = 'pending'
    and public.is_maker()
    and public.can_offer_on(request_id)
  );
create policy offers_participants_select on public.offers
  for select to authenticated using (auth.uid() = maker_id or public.owns_request(request_id));

-- reviews
create policy reviews_select_all on public.reviews
  for select to authenticated using (true);
create policy reviews_owner_insert on public.reviews
  for insert to authenticated with check (
    auth.uid() = reviewer_id and public.can_review_offer(offer_id, maker_id)
  );

-- cad_purchases
create policy purchases_owner_select on public.cad_purchases
  for select to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 18. Storage: bucket privado para fotos de objetos rotos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('repair-images', 'repair-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy repair_images_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'repair-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy repair_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'repair-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_maker())
  );

create policy repair_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'repair-images' and (storage.foldername(name))[1] = auth.uid()::text);