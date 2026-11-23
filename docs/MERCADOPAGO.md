# Pagos con Mercado Pago — guía de puesta en marcha

ProviDent cobra con **Mercado Pago Checkout Pro**. El comprador paga el total del carrito a la cuenta de
ProviDent; la app registra cuánto le corresponde a cada vendedor (`payment_splits`), descontando una
comisión del **5 %**. El envío no se cobra en el pago: se coordina con cada vendedor.

## Cómo funciona

```
Carrito ─► /checkout ─► Edge Function create-checkout ─► Mercado Pago (Checkout Pro)
                         · relee el carrito y valida                    │
                         · crea orders, order_items, payments, splits   │ el comprador paga
                         · crea la preferencia                          ▼
/pago/resultado ◄─ vuelve el comprador ─── Mercado Pago ──► Edge Function mp-webhook
   · llama a verify-payment                                 · consulta el pago a la API
   · muestra aprobado / pendiente / rechazado               · pedido PAID, descuenta stock,
                                                              vacía lo comprado del carrito
```

- **La clave secreta de Mercado Pago (Access Token) nunca llega al navegador**: solo la usan las Edge Functions.
- El webhook **no confía en el aviso**: vuelve a consultar el pago a Mercado Pago con la clave secreta.
- Archivos: `supabase/functions/` (backend), `src/pages/Checkout.vue`, `src/pages/PaymentResult.vue`, `src/services/checkout.js`.

## Lo que tenés que hacer (una sola vez)

### 1. Crear la aplicación en Mercado Pago

1. Entrá a <https://www.mercadopago.com.ar/developers/panel/app> con la cuenta de Mercado Pago de ProviDent.
2. **Crear aplicación** → nombre "ProviDent" → tipo de solución **Pagos online** → producto **Checkout Pro**.
3. En la aplicación, abrí **Credenciales de prueba** y copiá el **Access Token** (empieza con `TEST-` o `APP_USR-`).
   No lo pegues en el código ni en el chat.

### 2. Crear usuarios de prueba

En la aplicación → **Cuentas de prueba** → crear:
- un **vendedor** (opcional, si querés usar sus credenciales en vez de las de prueba de tu cuenta);
- un **comprador**: con ese usuario vas a pagar. Nunca pagues una prueba con tu cuenta real.

### 3. Instalar la CLI de Supabase y vincular el proyecto

```bash
npx supabase login
npx supabase link --project-ref ptnyqciqjzpuekwslbcv
```

### 4. Cargar los secretos en Supabase

```bash
npx supabase secrets set MP_ACCESS_TOKEN=TU_ACCESS_TOKEN_DE_PRUEBA 
npx supabase secrets set SITE_URL=https://TU-DOMINIO-PUBLICO (pendiente a crearlo)
```

- `SITE_URL` es la dirección pública del sitio (por ejemplo la de Vercel o un túnel HTTPS, ver paso 7).
  Mercado Pago **no acepta `localhost`** como URL de retorno. Si `SITE_URL` es local o falta, el pago
  igual funciona: el comprador vuelve a ProviDent a mano y la app le muestra el estado del pago.
- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya existen en las Edge Functions, no hay que cargarlos.

### 5. Desplegar las funciones

```bash
npx supabase functions deploy create-checkout
npx supabase functions deploy verify-payment
npx supabase functions deploy mp-webhook --no-verify-jwt
```

`mp-webhook` va **sin verificación de JWT** porque Mercado Pago no envía el token de Supabase.

### 6. Configurar el webhook en Mercado Pago (recomendado)

La preferencia ya manda `notification_url`, así que los avisos llegan aunque no hagas este paso.
Para agregar la validación de firma:

1. En la aplicación → **Webhooks** → **Configurar notificaciones** → modo **Pruebas**.
2. URL: `https://ptnyqciqjzpuekwslbcv.supabase.co/functions/v1/mp-webhook`
3. Evento: **Pagos**. Guardá y copiá la **clave secreta** que aparece.
4. `npx supabase secrets set MP_WEBHOOK_SECRET=LA_CLAVE_SECRETA`

### 7. Probar desde tu computadora con retorno automático (opcional)

Para que Mercado Pago te devuelva solo a ProviDent necesitás una URL pública HTTPS. Opción rápida:

```bash
npx vite --port 5179
npx cloudflared tunnel --url http://localhost:5179
```

Usá la URL `https://….trycloudflare.com` que aparece como `SITE_URL` (paso 4) y entrá a ProviDent
desde esa URL. Si Vite bloquea el dominio, agregá `server: { allowedHosts: ['.trycloudflare.com'] }` en `vite.config.js`.

## Cómo probar una compra

1. Iniciá sesión en ProviDent con un usuario **comprador** (no podés comprar tus propias publicaciones).
2. El vendedor de los productos tiene que haber completado **Configurar ventas** (cuenta de cobro conectada).
3. Carrito → **Ir al pago** → elegí domicilio → **Pagar con Mercado Pago**.
4. En Mercado Pago, en una ventana de incógnito, ingresá con el **comprador de prueba** y pagá con una tarjeta de prueba:

| Tarjeta | Número | CVV | Vencimiento |
|---|---|---|---|
| Mastercard crédito | 5031 7557 3453 0604 | 123 | 11/30 |
| Visa crédito | 4509 9535 6623 3704 | 123 | 11/30 |
| Visa débito | 4002 7686 9439 5619 | 123 | 11/30 |

El **nombre del titular** define el resultado (documento DNI `12345678`):

| Nombre | Resultado |
|---|---|
| `APRO` | Pago aprobado |
| `CONT` | Pago pendiente |
| `OTHE` | Rechazado por error general |
| `FUND` | Rechazado por saldo insuficiente |
| `SECU` | Rechazado por código de seguridad |

5. Al volver, `/pago/resultado` muestra el estado. Si fue aprobado: el pedido pasa a **PAID**, se descuenta
   el stock de los insumos y esos productos salen del carrito. El pedido aparece en **Mi perfil → Mis compras**.

### Problemas conocidos del modo prueba

- **"Una de las partes con la que intentás hacer el pago es de prueba"**: pasa si pagás como invitado ("Sin cuenta").
  El vendedor es de prueba y el pagador queda con un email real. Solución: en Mercado Pago elegí
  **Ingresar con mi cuenta** y entrá con el **comprador de prueba** (usuario `TESTUSER…` + contraseña).
- **"Estamos procesando tu pago"** con la tarjeta OTHE u otros rechazos: el entorno de pruebas a veces deja el
  pago en proceso y no vuelve al sitio. ProviDent lo muestra como "Tu pago está en proceso" y se actualiza solo
  cuando Mercado Pago avisa (webhook). Para probar una aprobación, lo más estable es pagar con **dinero disponible**
  del comprador de prueba.

## Revisar qué pasó

- Logs de las funciones: Supabase → Edge Functions → la función → **Logs**.
- Tablas: `orders` (estado del pedido), `payments` (estado del pago y respuesta completa de Mercado Pago en
  `raw_payload`), `payment_splits` (parte de cada vendedor: `gross_amount`, `app_fee_amount`, `net_amount`).

## Pasar a producción

1. Completá los datos de la aplicación en Mercado Pago y activá las **credenciales de producción**.
2. `npx supabase secrets set MP_ACCESS_TOKEN=APP_USR-…` (producción) y `SITE_URL` con el dominio real.
3. Configurá el webhook en modo **Productivo** y actualizá `MP_WEBHOOK_SECRET`.
4. Volvé a desplegar las tres funciones.
