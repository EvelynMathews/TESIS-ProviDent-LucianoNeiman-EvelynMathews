-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  user_id uuid NOT NULL,
                                  street text,
                                  city text NOT NULL,
                                  postal_code text,
                                  is_primary boolean DEFAULT false,
                                  created_at timestamp with time zone NOT NULL DEFAULT now(),
                                  updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                  province_id uuid NOT NULL,
                                  recipient_name text,
                                  tax_id text,
                                  CONSTRAINT addresses_pkey PRIMARY KEY (id),
                                  CONSTRAINT addresses_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id),
                                  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_buyers(user_id)
);
CREATE TABLE public.app_fee_receipts (
                                         id uuid NOT NULL DEFAULT gen_random_uuid(),
                                         split_id uuid NOT NULL,
                                         status USER-DEFINED NOT NULL,
                                         amount numeric NOT NULL,
                                         received_at timestamp with time zone,
                                         raw_payload jsonb,
                                         created_at timestamp with time zone DEFAULT now(),
                                         CONSTRAINT app_fee_receipts_pkey PRIMARY KEY (id),
                                         CONSTRAINT app_fee_receipts_split_id_fkey FOREIGN KEY (split_id) REFERENCES public.payment_splits(id)
);
CREATE TABLE public.cart_items (
                                   id uuid NOT NULL DEFAULT gen_random_uuid(),
                                   cart_id uuid NOT NULL,
                                   product_id uuid NOT NULL,
                                   quantity integer NOT NULL DEFAULT 1,
                                   unit_price_snapshot numeric NOT NULL,
                                   options_json jsonb,
                                   CONSTRAINT cart_items_pkey PRIMARY KEY (id),
                                   CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id),
                                   CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.carts (
                              id uuid NOT NULL DEFAULT gen_random_uuid(),
                              buyer_user_id uuid NOT NULL,
                              created_at timestamp with time zone DEFAULT now(),
                              updated_at timestamp with time zone DEFAULT now(),
                              CONSTRAINT carts_pkey PRIMARY KEY (id),
                              CONSTRAINT carts_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES public.user_buyers(user_id)
);
CREATE TABLE public.materials (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  name text NOT NULL UNIQUE,
                                  CONSTRAINT materials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.news (
                             id uuid NOT NULL DEFAULT gen_random_uuid(),
                             admin_user_id uuid,
                             title text NOT NULL,
                             slug text UNIQUE,
                             preview text,
                             content text,
                             is_published boolean DEFAULT false,
                             published_at timestamp with time zone,
                             created_at timestamp with time zone DEFAULT now(),
                             updated_at timestamp with time zone DEFAULT now(),
                             CONSTRAINT news_pkey PRIMARY KEY (id),
                             CONSTRAINT news_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.user_admins(user_id)
);
CREATE TABLE public.news_images (
                                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                                    news_id uuid NOT NULL,
                                    path text NOT NULL,
                                    alt_text text,
                                    position integer NOT NULL DEFAULT 1,
                                    is_primary boolean DEFAULT false,
                                    created_at timestamp with time zone DEFAULT now(),
                                    CONSTRAINT news_images_pkey PRIMARY KEY (id),
                                    CONSTRAINT news_images_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id)
);
CREATE TABLE public.order_items (
                                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                                    order_id uuid NOT NULL,
                                    product_id uuid NOT NULL,
                                    quantity integer NOT NULL DEFAULT 1,
                                    unit_price numeric NOT NULL,
                                    subtotal numeric NOT NULL,
                                    snapshot_json jsonb,
                                    CONSTRAINT order_items_pkey PRIMARY KEY (id),
                                    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
                                    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
                               id uuid NOT NULL DEFAULT gen_random_uuid(),
                               buyer_user_id uuid NOT NULL,
                               status USER-DEFINED NOT NULL DEFAULT 'CREATED'::order_status,
                               total_amount numeric NOT NULL,
                               created_at timestamp with time zone DEFAULT now(),
                               updated_at timestamp with time zone DEFAULT now(),
                               shipping_address_id uuid NOT NULL,
                               billing_address_id uuid NOT NULL,
                               CONSTRAINT orders_pkey PRIMARY KEY (id),
                               CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id),
                               CONSTRAINT orders_billing_address_id_fkey FOREIGN KEY (billing_address_id) REFERENCES public.addresses(id),
                               CONSTRAINT orders_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES public.user_buyers(user_id)
);
CREATE TABLE public.payment_accounts (
                                         id uuid NOT NULL DEFAULT gen_random_uuid(),
                                         user_id uuid NOT NULL,
                                         provider text NOT NULL CHECK (provider = ANY (ARRAY['MERCADOPAGO'::text, 'MOBBEX'::text])),
                                         config_json jsonb NOT NULL,
                                         is_primary boolean DEFAULT false,
                                         created_at timestamp with time zone DEFAULT now(),
                                         updated_at timestamp with time zone DEFAULT now(),
                                         CONSTRAINT payment_accounts_pkey PRIMARY KEY (id),
                                         CONSTRAINT payment_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_sellers(user_id)
);
CREATE TABLE public.payment_splits (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       payment_id uuid NOT NULL,
                                       order_item_id uuid NOT NULL,
                                       seller_account_id uuid NOT NULL,
                                       gross_amount numeric NOT NULL,
                                       app_fee_amount numeric DEFAULT 0,
                                       net_amount numeric NOT NULL,
                                       escrow_status USER-DEFINED NOT NULL DEFAULT 'HELD'::escrow_status,
                                       provider_split_id text,
                                       created_at timestamp with time zone DEFAULT now(),
                                       updated_at timestamp with time zone DEFAULT now(),
                                       CONSTRAINT payment_splits_pkey PRIMARY KEY (id),
                                       CONSTRAINT payment_splits_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
                                       CONSTRAINT payment_splits_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id),
                                       CONSTRAINT payment_splits_seller_account_id_fkey FOREIGN KEY (seller_account_id) REFERENCES public.payment_accounts(id)
);
CREATE TABLE public.payments (
                                 id uuid NOT NULL DEFAULT gen_random_uuid(),
                                 order_id uuid NOT NULL,
                                 provider text NOT NULL CHECK (provider = ANY (ARRAY['MERCADOPAGO'::text, 'MOBBEX'::text])),
                                 provider_pref_id text,
                                 provider_pay_id text,
                                 status USER-DEFINED NOT NULL,
                                 amount numeric NOT NULL,
                                 payer_user_id uuid NOT NULL,
                                 received_at timestamp with time zone,
                                 updated_at timestamp with time zone DEFAULT now(),
                                 raw_payload jsonb,
                                 CONSTRAINT payments_pkey PRIMARY KEY (id),
                                 CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
                                 CONSTRAINT payments_payer_user_id_fkey FOREIGN KEY (payer_user_id) REFERENCES public.user_buyers(user_id)
);
CREATE TABLE public.payouts (
                                id uuid NOT NULL DEFAULT gen_random_uuid(),
                                split_id uuid NOT NULL,
                                status USER-DEFINED NOT NULL,
                                amount numeric NOT NULL,
                                paid_at timestamp with time zone,
                                raw_payload jsonb,
                                created_at timestamp with time zone DEFAULT now(),
                                CONSTRAINT payouts_pkey PRIMARY KEY (id),
                                CONSTRAINT payouts_split_id_fkey FOREIGN KEY (split_id) REFERENCES public.payment_splits(id)
);
CREATE TABLE public.plaster_service_products (
                                                 product_id uuid NOT NULL,
                                                 base_price numeric NOT NULL,
                                                 notes text,
                                                 manufacturing_days integer,
                                                 CONSTRAINT plaster_service_products_pkey PRIMARY KEY (product_id),
                                                 CONSTRAINT plaster_service_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_images (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       product_id uuid NOT NULL,
                                       path text NOT NULL,
                                       alt_text text,
                                       position integer NOT NULL DEFAULT 1,
                                       is_primary boolean DEFAULT false,
                                       created_at timestamp with time zone DEFAULT now(),
                                       CONSTRAINT product_images_pkey PRIMARY KEY (id),
                                       CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_prices (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       product_id uuid NOT NULL,
                                       work_type_id uuid NOT NULL,
                                       tooth_group_id uuid NOT NULL,
                                       unit_price numeric NOT NULL,
                                       CONSTRAINT product_prices_pkey PRIMARY KEY (id),
                                       CONSTRAINT product_prices_work_type_id_fkey FOREIGN KEY (work_type_id) REFERENCES public.work_types(id),
                                       CONSTRAINT product_prices_tooth_group_id_fkey FOREIGN KEY (tooth_group_id) REFERENCES public.tooth_groups(id),
                                       CONSTRAINT product_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.prosthesis_products(product_id)
);
CREATE TABLE public.product_shipping_methods (
                                                 product_id uuid NOT NULL,
                                                 method_id uuid NOT NULL,
                                                 CONSTRAINT product_shipping_methods_pkey PRIMARY KEY (product_id, method_id),
                                                 CONSTRAINT product_shipping_profiles_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
                                                 CONSTRAINT product_shipping_profiles_profile_id_fkey FOREIGN KEY (method_id) REFERENCES public.shipping_methods(id)
);
CREATE TABLE public.products (
                                 id uuid NOT NULL DEFAULT gen_random_uuid(),
                                 owner_user_id uuid NOT NULL,
                                 name text NOT NULL,
                                 description text,
                                 product_type USER-DEFINED NOT NULL,
                                 is_active boolean DEFAULT true,
                                 created_at timestamp with time zone DEFAULT now(),
                                 weight_kg numeric,
                                 length_cm numeric,
                                 width_cm numeric,
                                 height_cm numeric,
                                 CONSTRAINT products_pkey PRIMARY KEY (id),
                                 CONSTRAINT products_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.user_sellers(user_id)
);
CREATE TABLE public.prosthesis_products (
                                            product_id uuid NOT NULL,
                                            material_id uuid,
                                            manufacturing_days integer,
                                            CONSTRAINT prosthesis_products_pkey PRIMARY KEY (product_id),
                                            CONSTRAINT prosthesis_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
                                            CONSTRAINT prosthesis_products_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
);
CREATE TABLE public.provinces (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  name text NOT NULL UNIQUE,
                                  code text UNIQUE,
                                  enabled boolean DEFAULT false,
                                  CONSTRAINT provinces_pkey PRIMARY KEY (id)
);
CREATE TABLE public.refunds (
                                id uuid NOT NULL DEFAULT gen_random_uuid(),
                                payment_id uuid,
                                split_id uuid,
                                amount numeric NOT NULL,
                                status USER-DEFINED NOT NULL,
                                created_at timestamp with time zone DEFAULT now(),
                                raw_payload jsonb,
                                CONSTRAINT refunds_pkey PRIMARY KEY (id),
                                CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
                                CONSTRAINT refunds_split_id_fkey FOREIGN KEY (split_id) REFERENCES public.payment_splits(id)
);
CREATE TABLE public.rental_pricing (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       product_id uuid NOT NULL,
                                       period interval NOT NULL,
                                       price numeric NOT NULL,
                                       CONSTRAINT rental_pricing_pkey PRIMARY KEY (id),
                                       CONSTRAINT rental_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.rental_products(product_id)
);
CREATE TABLE public.rental_products (
                                        product_id uuid NOT NULL,
                                        stock_qty integer,
                                        policy_document_url text,
                                        refundable_deposit_amount numeric,
                                        CONSTRAINT rental_products_pkey PRIMARY KEY (product_id),
                                        CONSTRAINT rental_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.shipments (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  order_item_id uuid NOT NULL,
                                  carrier text,
                                  service text,
                                  tracking_code text,
                                  label_url text,
                                  shipping_price_charged numeric,
                                  shipping_cost_estimated numeric,
                                  status USER-DEFINED NOT NULL DEFAULT 'READY'::shipment_status,
                                  delivered_at timestamp with time zone,
                                  proof_of_delivery_url text,
                                  created_at timestamp with time zone DEFAULT now(),
                                  updated_at timestamp with time zone DEFAULT now(),
                                  CONSTRAINT shipments_pkey PRIMARY KEY (id),
                                  CONSTRAINT shipments_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id)
);
CREATE TABLE public.shipping_methods (
                                         id uuid NOT NULL DEFAULT gen_random_uuid(),
                                         seller_user_id uuid NOT NULL,
                                         name text NOT NULL,
                                         active boolean DEFAULT true,
                                         created_at timestamp with time zone DEFAULT now(),
                                         volume_min_cm3 numeric,
                                         volume_max_cm3 numeric,
                                         CONSTRAINT shipping_methods_pkey PRIMARY KEY (id),
                                         CONSTRAINT shipping_profiles_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES public.user_sellers(user_id)
);
CREATE TABLE public.shipping_rates (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       method_id uuid NOT NULL,
                                       zone_id uuid,
                                       price numeric NOT NULL,
                                       weight_min numeric,
                                       weight_max numeric,
                                       eta_days integer,
                                       active boolean DEFAULT true,
                                       volume_min_cm3 numeric,
                                       volume_max_cm3 numeric,
                                       CONSTRAINT shipping_rates_pkey PRIMARY KEY (id),
                                       CONSTRAINT shipping_rates_profile_id_fkey FOREIGN KEY (method_id) REFERENCES public.shipping_methods(id),
                                       CONSTRAINT shipping_rates_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.shipping_zones(id)
);
CREATE TABLE public.shipping_zones (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       method_id uuid NOT NULL,
                                       province_id uuid NOT NULL,
                                       zone_name text NOT NULL,
                                       postal_code_min text NOT NULL,
                                       postal_code_max text NOT NULL,
                                       CONSTRAINT shipping_zones_pkey PRIMARY KEY (id),
                                       CONSTRAINT shipping_zones_profile_id_fkey FOREIGN KEY (method_id) REFERENCES public.shipping_methods(id),
                                       CONSTRAINT shipping_zones_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id)
);
CREATE TABLE public.simple_material_products (
                                                 product_id uuid NOT NULL,
                                                 sku text UNIQUE,
                                                 unit_price numeric NOT NULL,
                                                 unit_label text NOT NULL,
                                                 stock_qty numeric,
                                                 CONSTRAINT simple_material_products_pkey PRIMARY KEY (product_id),
                                                 CONSTRAINT simple_material_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.supply_products (
                                        product_id uuid NOT NULL,
                                        sku text UNIQUE,
                                        unit_price numeric NOT NULL,
                                        unit_label text NOT NULL,
                                        stock_qty numeric,
                                        CONSTRAINT supply_products_pkey PRIMARY KEY (product_id),
                                        CONSTRAINT supply_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.teeth (
                              id uuid NOT NULL DEFAULT gen_random_uuid(),
                              fdi_code integer NOT NULL UNIQUE,
                              tooth_group_id uuid NOT NULL,
                              CONSTRAINT teeth_pkey PRIMARY KEY (id),
                              CONSTRAINT teeth_tooth_group_id_fkey FOREIGN KEY (tooth_group_id) REFERENCES public.tooth_groups(id)
);
CREATE TABLE public.tooth_groups (
                                     id uuid NOT NULL DEFAULT gen_random_uuid(),
                                     name text NOT NULL UNIQUE,
                                     CONSTRAINT tooth_groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_admins (
                                    user_id uuid NOT NULL,
                                    created_at timestamp with time zone DEFAULT now(),
                                    CONSTRAINT user_admins_pkey PRIMARY KEY (user_id),
                                    CONSTRAINT user_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_buyers (
                                    user_id uuid NOT NULL,
                                    created_at timestamp with time zone DEFAULT now(),
                                    CONSTRAINT user_buyers_pkey PRIMARY KEY (user_id),
                                    CONSTRAINT user_buyers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_profiles (
                                      user_id uuid NOT NULL,
                                      avatar text,
                                      bio text,
                                      location text,
                                      is_public boolean NOT NULL DEFAULT true,
                                      created_at timestamp with time zone NOT NULL DEFAULT now(),
                                      updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                      CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id),
                                      CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_roles (
                                   user_id uuid NOT NULL,
                                   role USER-DEFINED NOT NULL,
                                   CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role),
                                   CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_sellers (
                                     user_id uuid NOT NULL,
                                     display_name text,
                                     rating_avg numeric,
                                     created_at timestamp with time zone DEFAULT now(),
                                     enabled boolean DEFAULT false,
                                     CONSTRAINT user_sellers_pkey PRIMARY KEY (user_id),
                                     CONSTRAINT user_sellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
                              id uuid NOT NULL,
                              first_name text NOT NULL,
                              last_name text NOT NULL,
                              email text UNIQUE,
                              photo_url text,
                              is_active boolean DEFAULT true,
                              created_at timestamp with time zone DEFAULT now(),
                              CONSTRAINT users_pkey PRIMARY KEY (id),
                              CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.work_type_tooth_group_combinations (
                                                           id uuid NOT NULL DEFAULT gen_random_uuid(),
                                                           work_type_id uuid NOT NULL,
                                                           tooth_group_id uuid NOT NULL,
                                                           CONSTRAINT work_type_tooth_group_combinations_pkey PRIMARY KEY (id),
                                                           CONSTRAINT work_type_tooth_group_combinations_work_type_id_fkey FOREIGN KEY (work_type_id) REFERENCES public.work_types(id),
                                                           CONSTRAINT work_type_tooth_group_combinations_tooth_group_id_fkey FOREIGN KEY (tooth_group_id) REFERENCES public.tooth_groups(id)
);
CREATE TABLE public.work_types (
                                   id uuid NOT NULL DEFAULT gen_random_uuid(),
                                   name text NOT NULL UNIQUE,
                                   CONSTRAINT work_types_pkey PRIMARY KEY (id)
);