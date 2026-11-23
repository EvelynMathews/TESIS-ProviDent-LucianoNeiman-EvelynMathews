-- Un solo carrito por usuario.
--
-- Problema: versiones anteriores de la app creaban un carrito nuevo cada vez que no
-- encontraban uno (o cuando dos componentes lo pedían al mismo tiempo). Algunos usuarios
-- quedaron con varios carritos y los productos repartidos entre ellos, y la consulta
-- "dame mi carrito" fallaba con "JSON object requested, multiple rows returned".
--
-- Qué hace:
--   1. Mueve los productos de los carritos duplicados al carrito más antiguo de cada usuario.
--   2. Borra los carritos duplicados (ya vacíos).
--   3. Crea un índice único para que no se pueda volver a crear un segundo carrito.
--
-- Se puede ejecutar más de una vez sin problemas.

begin;

with ranked as (
    select id,
           first_value(id) over (partition by buyer_user_id order by created_at, id) as keep_id
    from public.carts
)
update public.cart_items ci
set cart_id = r.keep_id
from ranked r
where ci.cart_id = r.id
  and r.id <> r.keep_id;

with ranked as (
    select id,
           first_value(id) over (partition by buyer_user_id order by created_at, id) as keep_id
    from public.carts
)
delete from public.carts c
using ranked r
where c.id = r.id
  and r.id <> r.keep_id;

create unique index if not exists carts_buyer_user_id_key on public.carts (buyer_user_id);

commit;
