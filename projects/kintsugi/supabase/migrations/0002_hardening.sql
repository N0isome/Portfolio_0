-- Kintsugi: aplicar después de 0001_original.sql en un proyecto nuevo.
-- La aplicación publicada usa D1/R2; estos archivos preparan una futura
-- implementación con Supabase. No conectan el frontend automáticamente.

-- Privilegios explícitos; no depender de los grants por defecto de Supabase.
grant usage on schema public to authenticated;
grant select on public.users, public.maker_profiles, public.repair_requests,
  public.offers, public.reviews, public.cad_purchases to authenticated;
revoke insert, delete on public.users from authenticated;
revoke insert, delete on public.maker_profiles from authenticated;
revoke update (ai_diagnosis_text, ai_diagnosis_json) on public.repair_requests from authenticated;
grant insert (user_id, image_url, item_name) on public.repair_requests to authenticated;
grant insert (offer_id, reviewer_id, maker_id, rating, comment) on public.reviews to authenticated;
revoke update, delete on public.reviews from authenticated;

-- Un pago simulado nunca puede habilitar una descarga comercial.
revoke all on function public.mock_confirm_cad_purchase(uuid,text,integer,text)
  from public, anon, authenticated;

-- El archivo debe existir y pertenecer al dueño de la solicitud.
drop policy requests_owner_insert on public.repair_requests;
create policy requests_owner_insert on public.repair_requests
for insert to authenticated with check (
 auth.uid()=user_id and status='open'
 and split_part(image_url,'/',1)=auth.uid()::text
 and exists(select 1 from storage.objects s
            where s.bucket_id='repair-images' and s.name=image_url)
);

-- Acceso a una foto solo si participa o puede leer la solicitud abierta.
create or replace function public.can_read_repair_image(p_path text)
returns boolean language sql stable security definer set search_path=public
as $$
 select exists(select 1 from public.repair_requests r
 where r.image_url=p_path and (
 r.user_id=auth.uid() or (public.is_maker() and r.status='open')
 or exists(select 1 from public.offers o where o.request_id=r.id and o.maker_id=auth.uid())
 ));
$$;
revoke all on function public.can_read_repair_image(text) from public,anon;
grant execute on function public.can_read_repair_image(text) to authenticated;
drop policy repair_images_select on storage.objects;
create policy repair_images_select on storage.objects for select to authenticated
using(bucket_id='repair-images' and (
 (storage.foldername(name))[1]=auth.uid()::text or public.can_read_repair_image(name)
));

-- Crear oferta y aceptar comparten el bloqueo de la solicitud: evita
-- ofertas pendientes que aparezcan por carrera después de aceptar otra.
revoke insert on public.offers from authenticated;
create or replace function public.create_offer(p_request_id uuid,p_price numeric,p_message text)
returns public.offers language plpgsql security definer set search_path=public
as $$
declare r public.repair_requests; o public.offers;
begin
 if not public.is_maker() then raise exception 'forbidden' using errcode='42501'; end if;
 if p_price is null or p_price<=0 or p_price>99999999.99 or p_price<>round(p_price,2)
    or char_length(coalesce(p_message,''))>1000 then
  raise exception 'invalid_offer' using errcode='22023';
 end if;
 select * into r from public.repair_requests where id=p_request_id for update;
 if not found or r.status<>'open' or r.user_id=auth.uid() then
  raise exception 'invalid_state' using errcode='P0001';
 end if;
 insert into public.offers(request_id,maker_id,price,message)
 values(p_request_id,auth.uid(),p_price,p_message) returning * into o;
 return o;
end;
$$;
revoke all on function public.create_offer(uuid,numeric,text) from public,anon;
grant execute on function public.create_offer(uuid,numeric,text) to authenticated;

create or replace function public.accept_offer(p_offer_id uuid)
returns public.offers language plpgsql security definer set search_path=public
as $$
declare o public.offers; r public.repair_requests; rid uuid;
begin
 select request_id into rid from public.offers where id=p_offer_id;
 if not found then raise exception 'offer_not_found' using errcode='P0002'; end if;
 select * into r from public.repair_requests where id=rid for update;
 if r.user_id is distinct from auth.uid() then
  raise exception 'forbidden' using errcode='42501';
 end if;
 select * into o from public.offers where id=p_offer_id for update;
 if r.status<>'open' or o.status<>'pending' then
  raise exception 'invalid_state' using errcode='P0001';
 end if;
 update public.offers set status='accepted' where id=p_offer_id returning * into o;
 update public.offers set status='rejected' where request_id=rid and id<>p_offer_id and status='pending';
 update public.repair_requests set status='in_progress' where id=rid;
 return o;
end;
$$;

-- Revocar borrado de solicitudes preserva la trazabilidad y las reseñas.
revoke delete on public.repair_requests from authenticated;
-- La confirmación de compra real debe venir de un webhook autenticado
-- con precio validado en servidor. Nunca desde el importe del navegador.
