-- Ventas, seguimiento de envíos y liquidaciones a vendedores.
--
-- 1. Estado de envío por producto vendido (order_items.fulfillment_status):
--    PENDING (pagado, falta enviar) -> SHIPPED (enviado) -> DELIVERED (entregado).
--    Al marcar DELIVERED, la parte del vendedor (payment_splits) pasa de HELD a RELEASED.
-- 2. Funciones SECURITY DEFINER que validan quién llama (auth.uid()) y devuelven solo lo que
--    le corresponde a cada uno:
--    - seller_update_fulfillment: el vendedor avanza el envío de SUS productos.
--    - get_seller_sales: ventas pagadas del vendedor, con datos del comprador para coordinar el envío.
--    - get_my_order: detalle de una compra para el comprador, con datos de contacto de cada vendedor.
--    - admin_get_settlements / admin_mark_payouts: el admin ve lo que se le debe a cada vendedor
--      y registra las transferencias hechas (tabla payouts).

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_fulfillment_status_check
    CHECK (fulfillment_status IN ('PENDING', 'SHIPPED', 'DELIVERED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Vendedor: avanzar el envío de un producto vendido
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seller_update_fulfillment(p_order_item_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item record;
  v_total int;
  v_delivered int;
  v_moved int;
BEGIN
  IF p_status NOT IN ('SHIPPED', 'DELIVERED') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT oi.id, oi.order_id, oi.fulfillment_status, p.owner_user_id, o.status::text AS order_status
    INTO v_item
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    JOIN public.orders o ON o.id = oi.order_id
   WHERE oi.id = p_order_item_id
   FOR UPDATE OF oi;

  IF NOT FOUND OR v_item.owner_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_item.order_status NOT IN ('PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED') THEN
    RAISE EXCEPTION 'order_not_paid';
  END IF;
  IF v_item.fulfillment_status = 'DELIVERED'
     OR (v_item.fulfillment_status = 'SHIPPED' AND p_status = 'SHIPPED') THEN
    RAISE EXCEPTION 'invalid_transition';
  END IF;

  UPDATE public.order_items
     SET fulfillment_status = p_status,
         shipped_at = COALESCE(shipped_at, now()),
         delivered_at = CASE WHEN p_status = 'DELIVERED' THEN now() ELSE delivered_at END
   WHERE id = p_order_item_id;

  IF p_status = 'DELIVERED' THEN
    UPDATE public.payment_splits
       SET escrow_status = 'RELEASED', updated_at = now()
     WHERE order_item_id = p_order_item_id AND escrow_status = 'HELD';
  END IF;

  -- Estado general del pedido según el avance de todos sus productos
  SELECT count(*),
         count(*) FILTER (WHERE fulfillment_status = 'DELIVERED'),
         count(*) FILTER (WHERE fulfillment_status <> 'PENDING')
    INTO v_total, v_delivered, v_moved
    FROM public.order_items WHERE order_id = v_item.order_id;

  UPDATE public.orders
     SET status = (CASE WHEN v_delivered = v_total THEN 'DELIVERED'
                        WHEN v_moved > 0 THEN 'SHIPPED'
                        ELSE 'PAID' END)::order_status,
         updated_at = now()
   WHERE id = v_item.order_id;

  RETURN jsonb_build_object('order_item_id', p_order_item_id, 'fulfillment_status', p_status);
END $$;

-- ---------------------------------------------------------------------------
-- Vendedor: sus ventas pagadas
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_seller_sales()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(t.row ORDER BY t.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT o.created_at,
      jsonb_build_object(
        'order_item_id', oi.id,
        'order_id', o.id,
        'created_at', o.created_at,
        'order_status', o.status,
        'product_id', oi.product_id,
        'product_name', COALESCE(oi.snapshot_json->>'name', p.name),
        'product_type', p.product_type,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal,
        'fulfillment_status', oi.fulfillment_status,
        'shipped_at', oi.shipped_at,
        'delivered_at', oi.delivered_at,
        'options', oi.snapshot_json->'options',
        'rental', (SELECT jsonb_build_object('start_date', r.start_date, 'end_date', r.end_date,
                     'start_time', r.start_time, 'end_time', r.end_time, 'total_days', r.total_days)
                   FROM public.rental_order_items r WHERE r.order_item_id = oi.id),
        'plaster_description', (SELECT ps.custom_description FROM public.plaster_service_order_items ps
                                WHERE ps.order_item_id = oi.id),
        'buyer', jsonb_build_object('name', trim(u.first_name || ' ' || u.last_name), 'email', u.email),
        'address', (SELECT jsonb_build_object('street', a.street, 'city', a.city, 'postal_code', a.postal_code,
                      'province', pr.name, 'recipient_name', a.recipient_name)
                    FROM public.addresses a LEFT JOIN public.provinces pr ON pr.id = a.province_id
                    WHERE a.id = o.shipping_address_id),
        'gross', s.gross_amount,
        'fee', s.app_fee_amount,
        'net', s.net_amount,
        'escrow_status', s.escrow_status,
        'paid_out_at', (SELECT max(po.paid_at) FROM public.payouts po WHERE po.split_id = s.id AND po.status = 'PAID')
      ) AS row
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.users u ON u.id = o.buyer_user_id
    LEFT JOIN public.payment_splits s ON s.order_item_id = oi.id
    WHERE p.owner_user_id = auth.uid()
      AND o.status IN ('PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'COMPLETED')
  ) t;
$$;

-- ---------------------------------------------------------------------------
-- Comprador: detalle de una compra propia
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'total', o.total_amount,
    'created_at', o.created_at,
    'address', (SELECT jsonb_build_object('street', a.street, 'city', a.city, 'postal_code', a.postal_code,
                  'province', pr.name, 'recipient_name', a.recipient_name)
                FROM public.addresses a LEFT JOIN public.provinces pr ON pr.id = a.province_id
                WHERE a.id = o.shipping_address_id),
    'payment', (SELECT jsonb_build_object(
                  'status', py.status,
                  'received_at', py.received_at,
                  'provider_pay_id', py.provider_pay_id,
                  'method', py.raw_payload->>'payment_method_id',
                  'type', py.raw_payload->>'payment_type_id',
                  'installments', py.raw_payload->>'installments',
                  'card_last_four', py.raw_payload->'card'->>'last_four_digits')
                FROM public.payments py WHERE py.order_id = o.id
                ORDER BY py.updated_at DESC NULLS LAST LIMIT 1),
    'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'name', COALESCE(oi.snapshot_json->>'name', p.name),
                  'product_type', p.product_type,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'subtotal', oi.subtotal,
                  'fulfillment_status', oi.fulfillment_status,
                  'shipped_at', oi.shipped_at,
                  'delivered_at', oi.delivered_at,
                  'options', oi.snapshot_json->'options',
                  'rental', (SELECT jsonb_build_object('start_date', r.start_date, 'end_date', r.end_date,
                               'start_time', r.start_time, 'end_time', r.end_time, 'total_days', r.total_days)
                             FROM public.rental_order_items r WHERE r.order_item_id = oi.id),
                  'plaster_description', (SELECT ps.custom_description FROM public.plaster_service_order_items ps
                                          WHERE ps.order_item_id = oi.id),
                  'seller', jsonb_build_object('id', p.owner_user_id,
                              'name', trim(su.first_name || ' ' || su.last_name), 'email', su.email)
                ) ORDER BY su.first_name, oi.id), '[]'::jsonb)
              FROM public.order_items oi
              JOIN public.products p ON p.id = oi.product_id
              JOIN public.users su ON su.id = p.owner_user_id
              WHERE oi.order_id = o.id)
  )
  FROM public.orders o
  WHERE o.id = p_order_id AND o.buyer_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Admin: liquidaciones pendientes por vendedor
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_settlements()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(seller ORDER BY seller->>'name'), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'seller_id', u.id,
        'name', trim(u.first_name || ' ' || u.last_name),
        'email', u.email,
        'payout_info', (SELECT pa.config_json FROM public.payment_accounts pa
                        WHERE pa.user_id = u.id AND pa.config_json ? 'account'
                        ORDER BY pa.is_primary DESC NULLS LAST, pa.updated_at DESC NULLS LAST LIMIT 1),
        'held_total', COALESCE(sum(s.net_amount) FILTER (WHERE s.escrow_status = 'HELD'), 0),
        'pending_total', COALESCE(sum(s.net_amount) FILTER (WHERE s.escrow_status = 'RELEASED' AND po.id IS NULL), 0),
        'paid_total', COALESCE(sum(s.net_amount) FILTER (WHERE po.id IS NOT NULL), 0),
        'pending_items', COALESCE(jsonb_agg(jsonb_build_object(
            'split_id', s.id,
            'order_id', o.id,
            'product_name', COALESCE(oi.snapshot_json->>'name', p.name),
            'quantity', oi.quantity,
            'gross', s.gross_amount,
            'fee', s.app_fee_amount,
            'net', s.net_amount,
            'delivered_at', oi.delivered_at
          ) ORDER BY oi.delivered_at) FILTER (WHERE s.escrow_status = 'RELEASED' AND po.id IS NULL), '[]'::jsonb)
      ) AS seller
      FROM public.payment_splits s
      JOIN public.order_items oi ON oi.id = s.order_item_id
      JOIN public.orders o ON o.id = oi.order_id
      JOIN public.products p ON p.id = oi.product_id
      JOIN public.users u ON u.id = p.owner_user_id
      LEFT JOIN public.payouts po ON po.split_id = s.id AND po.status = 'PAID'
      WHERE o.status IN ('PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'COMPLETED')
      GROUP BY u.id, u.first_name, u.last_name, u.email
    ) sellers
  );
END $$;

-- ---------------------------------------------------------------------------
-- Admin: registrar transferencias hechas
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_mark_payouts(p_split_ids uuid[], p_reference text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
  v_total numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH eligible AS (
    SELECT s.id, s.net_amount
      FROM public.payment_splits s
     WHERE s.id = ANY(p_split_ids)
       AND s.escrow_status = 'RELEASED'
       AND NOT EXISTS (SELECT 1 FROM public.payouts po WHERE po.split_id = s.id AND po.status = 'PAID')
  ), inserted AS (
    INSERT INTO public.payouts (split_id, status, amount, paid_at, raw_payload)
    SELECT e.id, 'PAID', e.net_amount, now(),
           jsonb_build_object('reference', NULLIF(trim(p_reference), ''), 'admin_id', auth.uid())
      FROM eligible e
    RETURNING amount
  )
  SELECT count(*), COALESCE(sum(amount), 0) INTO v_count, v_total FROM inserted;

  RETURN jsonb_build_object('count', v_count, 'total', v_total);
END $$;

-- Permisos: solo usuarios logueados (cada función valida además quién llama)
REVOKE ALL ON FUNCTION public.seller_update_fulfillment(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_seller_sales() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_settlements() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_mark_payouts(uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seller_update_fulfillment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_settlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_payouts(uuid[], text) TO authenticated;
