# Marketplace con Mercado Pago - Advanced Payments (Split Real + Retención de Fondos)

## ⚠️ IMPORTANTE - Complejidad Real

Este POC implementa la **versión REAL** de un marketplace con Mercado Pago usando **Advanced Payments API**. A diferencia de la versión anterior, este código muestra la complejidad y requisitos reales para implementar:

- ✅ Split payments entre múltiples vendedores
- ✅ Retención de fondos configurable (money_release_days)
- ✅ Liberación manual de fondos por API
- ✅ Comisiones de marketplace (application_fee)

## 🚨 Requisitos Críticos

### 1. Aplicación Aprobada como Marketplace

Mercado Pago **NO permite** usar Advanced Payments sin aprobación previa:

- Debes crear una aplicación en https://www.mercadopago.com.ar/developers/panel
- Solicitar permisos para "Marketplace" o "PSP"
- **Esperar aprobación de Mercado Pago** (puede tardar días/semanas)
- Sin aprobación, la API devolverá errores 403/401

### 2. OAuth con Cada Vendedor

Cada vendedor debe autorizar explícitamente al marketplace:

```
https://auth.mercadopago.com.ar/authorization?client_id={APP_ID}&response_type=code&platform_id=mp&redirect_uri={REDIRECT_URI}
```

**Datos obtenidos del OAuth:**
- `access_token`: Token del vendedor (válido 6 meses)
- `collector_id`: ID único del vendedor (requerido en disbursements)
- `refresh_token`: Para renovar credenciales

**Sin OAuth no hay forma de obtener el collector_id real del vendedor.**

### 3. Variables de Entorno Requeridas

```env
# Access Token de tu aplicación marketplace
MP_ACCESS_TOKEN=APP-XXXXXXXXXXXX

# ID de tu aplicación
MP_APPLICATION_ID=1234567890

# Collector IDs obtenidos vía OAuth de cada vendedor
SELLER_1_COLLECTOR_ID=123456789
SELLER_2_COLLECTOR_ID=987654321

# Configuración
MARKETPLACE_FEE_PERCENTAGE=5
MONEY_RELEASE_DAYS=90
BASE_URL=https://tu-dominio.com
```

## 📚 Qué Implica Desarrollar Esta Integración

### Nivel 1: Configuración Inicial
**Tiempo estimado: 1-2 semanas**

1. **Crear aplicación en Mercado Pago**
   - Registrarse como desarrollador
   - Crear aplicación tipo "Marketplace"
   - Completar información legal y fiscal
   - Solicitar aprobación

2. **Implementar OAuth**
   ```javascript
   // Endpoint de autorización
   app.get('/auth/mercadopago', (req, res) => {
     const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${REDIRECT_URI}`;
     res.redirect(authUrl);
   });

   // Callback OAuth
   app.get('/auth/callback', async (req, res) => {
     const code = req.query.code;
     // Intercambiar código por tokens
     const tokens = await exchangeCodeForTokens(code);
     // Guardar tokens y collector_id en base de datos
   });
   ```

3. **Sistema de gestión de vendedores**
   - Base de datos para almacenar tokens OAuth
   - Sistema de renovación de tokens (expiran a los 6 meses)
   - Interface para que vendedores conecten sus cuentas

### Nivel 2: Advanced Payments API
**Tiempo estimado: 2-3 semanas**

#### A) Crear Advanced Payment con Disbursements

```javascript
POST /v1/advanced_payments
Authorization: Bearer {MARKETPLACE_ACCESS_TOKEN}
X-Idempotency-Key: {UUID}
Content-Type: application/json

{
  "application_id": "tu_app_id",
  "payments": [{
    "payment_method_id": "account_money",
    "transaction_amount": 2500,
    "description": "Compra marketplace",
    "payer": {
      "email": "comprador@test.com",
      "first_name": "Juan",
      "last_name": "Pérez"
    }
  }],
  "disbursements": [
    {
      "collector_id": "SELLER_1_COLLECTOR_ID",
      "amount": 950,
      "application_fee": 50,
      "money_release_days": 90,
      "external_reference": "seller_1_order_123"
    },
    {
      "collector_id": "SELLER_2_COLLECTOR_ID",
      "amount": 1425,
      "application_fee": 75,
      "money_release_days": 90,
      "external_reference": "seller_2_order_123"
    }
  ]
}
```

**Complejidad:**
- Calcular split correcto entre vendedores
- Manejar múltiples productos de múltiples sellers
- Calcular application_fee proporcional
- Validar collector_ids válidos

#### B) Liberar Fondos Manualmente

```javascript
POST /v1/advanced_payments/{ADVANCED_PAYMENT_ID}/disbursements/{DISBURSEMENT_ID}/disburses
Authorization: Bearer {MARKETPLACE_ACCESS_TOKEN}
X-Idempotency-Key: {UUID}
```

**Complejidad:**
- Obtener IDs correctos de la respuesta del pago
- Manejar casos de error (disbursement ya liberado)
- Tracking de estado de cada disbursement
- Interface de administración para liberar fondos

### Nivel 3: Webhooks y Notificaciones
**Tiempo estimado: 1 semana**

```javascript
POST /api/webhook
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  }
}
```

**Implementación requerida:**
- Validar firma de webhook (seguridad)
- Consultar API de Mercado Pago para detalles del pago
- Actualizar estado en base de datos
- Notificar a vendedores
- Manejar reintentos fallidos

### Nivel 4: Casos de Borde
**Tiempo estimado: 2-3 semanas**

1. **Reembolsos**
   - Calcular reembolso proporcional entre vendedores
   - Validar saldo disponible de cada vendedor
   - Implementar reembolsos parciales

2. **Tokens expirados**
   - Detectar cuando un token OAuth expira
   - Sistema automático de renovación con refresh_token
   - Notificar al vendedor si falla la renovación

3. **Vendedor sin fondos**
   - Qué hacer si un vendedor no tiene saldo para reembolso
   - Sistema de crédito/deuda entre marketplace y vendedor

4. **Disputas y chargebacks**
   - Manejar disputas de Mercado Pago
   - Bloquear liberación de fondos si hay disputa
   - Sistema de resolución de disputas

## 🏗️ Arquitectura Completa Requerida

### Base de Datos

```sql
-- Vendedores
CREATE TABLE sellers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  mp_collector_id VARCHAR(50) UNIQUE,
  mp_access_token TEXT,
  mp_refresh_token TEXT,
  token_expires_at TIMESTAMP,
  status VARCHAR(20) -- active, inactive, pending_auth
);

-- Advanced Payments
CREATE TABLE advanced_payments (
  id VARCHAR(50) PRIMARY KEY, -- ID de Mercado Pago
  status VARCHAR(20),
  total_amount DECIMAL(10,2),
  marketplace_fee DECIMAL(10,2),
  created_at TIMESTAMP,
  paid_at TIMESTAMP
);

-- Disbursements
CREATE TABLE disbursements (
  id SERIAL PRIMARY KEY,
  mp_disbursement_id VARCHAR(50),
  advanced_payment_id VARCHAR(50) REFERENCES advanced_payments(id),
  seller_id INT REFERENCES sellers(id),
  amount DECIMAL(10,2),
  application_fee DECIMAL(10,2),
  money_release_days INT,
  release_date DATE,
  status VARCHAR(20), -- pending, held, released
  released_at TIMESTAMP
);

-- Ordenes
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  advanced_payment_id VARCHAR(50) REFERENCES advanced_payments(id),
  buyer_email VARCHAR(255),
  total DECIMAL(10,2),
  delivery_status VARCHAR(20), -- pending, shipped, delivered, cancelled
  created_at TIMESTAMP
);

-- Items de orden
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  seller_id INT REFERENCES sellers(id),
  product_name VARCHAR(255),
  quantity INT,
  unit_price DECIMAL(10,2),
  seller_amount DECIMAL(10,2),
  marketplace_fee DECIMAL(10,2)
);
```

### Backend Services

```
marketplace-backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js         # OAuth con vendedores
│   │   ├── payment.controller.js      # Advanced Payments
│   │   ├── webhook.controller.js      # Notificaciones MP
│   │   └── seller.controller.js       # CRUD vendedores
│   ├── services/
│   │   ├── mercadopago.service.js     # Wrapper API de MP
│   │   ├── oauth.service.js           # Lógica OAuth
│   │   ├── disbursement.service.js    # Gestión disbursements
│   │   └── token-refresh.service.js   # Renovación tokens
│   ├── jobs/
│   │   ├── token-refresh.job.js       # Cron job tokens
│   │   └── auto-release.job.js        # Auto-liberación fondos
│   ├── models/
│   │   ├── Seller.js
│   │   ├── AdvancedPayment.js
│   │   ├── Disbursement.js
│   │   └── Order.js
│   └── middlewares/
│       ├── auth.middleware.js
│       └── webhook-validator.middleware.js
```

## 💰 Estructura de Comisiones

### Ejemplo con compra de $2500

**Comprador paga: $2500**

**Vendedor 1 ($1000 en productos):**
- Monto bruto: $1000
- Comisión MP (~3.5%): -$35
- Comisión Marketplace (5%): -$50
- **Recibe: $915**

**Vendedor 2 ($1500 en productos):**
- Monto bruto: $1500
- Comisión MP (~3.5%): -$52.50
- Comisión Marketplace (5%): -$75
- **Recibe: $1372.50**

**Marketplace:**
- Comisión Vendedor 1: $50
- Comisión Vendedor 2: $75
- **Total: $125**

**Mercado Pago:**
- Comisión total: $87.50

### Cálculo en Código

```javascript
const feePercentage = 5; // Marketplace
const mpFeePercentage = 3.5; // Mercado Pago

disbursements = sellers.map(seller => {
  const grossAmount = seller.totalSales;
  const mpFee = grossAmount * (mpFeePercentage / 100);
  const marketplaceFee = grossAmount * (feePercentage / 100);
  const netAmount = grossAmount - mpFee - marketplaceFee;

  return {
    collector_id: seller.collectorId,
    amount: netAmount,
    application_fee: marketplaceFee,
    money_release_days: 90
  };
});
```

## 🔒 Seguridad

### 1. Validación de Webhooks

```javascript
const crypto = require('crypto');

function validateWebhook(req) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  const parts = xSignature.split(',');
  const ts = parts[0].split('=')[1];
  const hash = parts[1].split('=')[1];

  const manifest = `id:${req.body.data.id};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET);
  hmac.update(manifest);
  const sha = hmac.digest('hex');

  return sha === hash;
}
```

### 2. Idempotencia

```javascript
const idempotencyKeys = new Map();

app.post('/api/release-funds', async (req, res) => {
  const key = req.headers['idempotency-key'] || uuidv4();

  if (idempotencyKeys.has(key)) {
    return res.json(idempotencyKeys.get(key));
  }

  const result = await releaseFunds(req.body);
  idempotencyKeys.set(key, result);

  return res.json(result);
});
```

## 📊 Testing

### Cuentas de Prueba

Mercado Pago requiere cuentas de prueba específicas para marketplace:

1. **Crear usuarios de prueba:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://api.mercadopago.com/users/test_user" \
  -d '{
    "site_id":"MLA"
  }'
```

2. **Hacer OAuth con usuarios de prueba**
3. **Crear pagos de prueba**

### Limitaciones del Sandbox

- No se pueden liberar fondos realmente
- Webhooks pueden no funcionar en localhost
- Algunos estados de pago son simulados

## 🚀 Deployment

### Variables de Entorno de Producción

```env
# Producción
MP_ACCESS_TOKEN=APP-XXXXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXXXX
MP_APPLICATION_ID=1234567890
MP_WEBHOOK_SECRET=tu_webhook_secret

# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db

# URLs
BASE_URL=https://tu-marketplace.com
FRONTEND_URL=https://tu-marketplace.com

# Configuración
MARKETPLACE_FEE_PERCENTAGE=5
MONEY_RELEASE_DAYS=15
NODE_ENV=production
```

### Checklist de Producción

- [ ] Aplicación aprobada por Mercado Pago
- [ ] OAuth configurado y probado
- [ ] Webhooks con HTTPS y validación de firma
- [ ] Base de datos con índices optimizados
- [ ] Sistema de logs (CloudWatch, DataDog, etc.)
- [ ] Monitoring de errores (Sentry, Bugsnag)
- [ ] Backups automatizados de BD
- [ ] Job de renovación de tokens funcionando
- [ ] Rate limiting configurado
- [ ] Tests automatizados (unit + integration)

## 🎓 Conclusión: ¿Vale la Pena?

### Complejidad Total
- **Tiempo de desarrollo**: 2-3 meses (desarrollador experimentado)
- **Requisitos**: OAuth, Advanced Payments, webhooks, jobs, BD relacional
- **Mantenimiento**: Alto (tokens que expiran, cambios en API de MP)

### Alternativas Más Simples

1. **Mercado Pago Split Payments (nuevo)**: Más simple que Advanced Payments
2. **Checkout Pro con marketplace_fee**: Más limitado pero más fácil
3. **Procesar pagos por separado**: Cada vendedor su propio checkout

### Cuándo Usar Advanced Payments

✅ **SÍ usar cuando:**
- Necesitas control total sobre liberación de fondos
- Tienes múltiples vendedores en una sola transacción
- Requieres retención de fondos customizable
- Tienes equipo técnico capacitado

❌ **NO usar cuando:**
- Marketplace simple con pocos vendedores
- No necesitas retención de fondos
- Recursos de desarrollo limitados
- Primeros prototipos/MVPs

## 📞 Recursos

- [Documentación Advanced Payments](https://www.mercadopago.com.ar/developers/en/reference/wallet_connect/_advanced_payments/post)
- [Split Payments (alternativa más simple)](https://www.mercadopago.com.ar/developers/es/docs/split-payments/landing)
- [Soporte Mercado Pago](https://www.mercadopago.com.ar/developers/es/support)
- [Comunidad de Desarrolladores](https://www.mercadopago.com.ar/developers/es/community)

---

**Nota Final**: Este README documenta la complejidad REAL de implementar un marketplace con Mercado Pago. La versión inicial del POC usaba APIs incorrectas. Esta versión muestra qué implica realmente desarrollar esta integración en producción.
