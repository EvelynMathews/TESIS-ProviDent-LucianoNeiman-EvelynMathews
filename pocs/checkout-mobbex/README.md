# Marketplace Checkout con Mobbex

Aplicación de checkout tipo marketplace que implementa pagos divididos (split payments) usando Mobbex, con retención de fondos hasta confirmación de entrega.

## Características

- Productos precargados de 2 vendedores diferentes
- Carrito de compras multi-vendedor
- Comisión del 5% para el marketplace
- Split payment automático entre vendedores con Mobbex
- Retención de fondos (hold) hasta confirmación de entrega
- Endpoint para liberar fondos sin autenticación
- Panel de administración para gestionar pagos
- Webhooks para recibir notificaciones de Mobbex

## Estructura del Proyecto

```
checkout-mobbex/
├── server/
│   └── server.js          # Backend Express con endpoints de API
├── public/
│   ├── index.html         # Página de checkout
│   ├── admin.html         # Panel de administración
│   ├── styles.css         # Estilos
│   ├── app.js            # Lógica del checkout
│   └── admin.js          # Lógica del panel admin
├── .env.example          # Ejemplo de variables de entorno
├── package.json
└── README.md
```

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env` basado en `.env.example`:

```env
MOBBEX_API_KEY=tu_api_key_aqui
MOBBEX_ACCESS_TOKEN=tu_access_token_aqui
MARKETPLACE_FEE_PERCENTAGE=5
PORT=3000
BASE_URL=http://localhost:3000
```

### 3. Obtener credenciales de Mobbex

1. Ir a [Mobbex Console](https://mobbex.com/)
2. Crear una cuenta de comercio
3. Ir a Configuración > Credenciales
4. Copiar el API Key y Access Token
5. Configurar los vendedores en `server/server.js:24-35`:
   - Los `sellerId` deben ser emails válidos de cuentas de Mobbex
   - Cada vendedor debe tener su propia cuenta en Mobbex

### 4. Exponer el webhook (desarrollo)

Para recibir webhooks en desarrollo local, usar un servicio como ngrok:

```bash
ngrok http 3000
```

Luego actualizar `BASE_URL` en `.env` con la URL de ngrok:

```env
BASE_URL=https://tu-subdominio.ngrok.io
```

### 5. Iniciar el servidor

```bash
npm start
```

O en modo desarrollo con auto-reload:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Uso

### Checkout

1. Abrir `http://localhost:3000` en el navegador
2. Ver los productos precargados de ambos vendedores
3. Agregar productos al carrito
4. Hacer clic en "Proceder al Pago"
5. Completar el flujo de pago en Mobbex (usar tarjetas de prueba)
6. Ser redirigido de vuelta a la aplicación

### Panel de Administración

1. Abrir `http://localhost:3000/admin.html`
2. Ver todos los pagos registrados y su estado de retención
3. Para liberar fondos:
   - Copiar el ID del pago (se muestra después de recibir el webhook)
   - Pegarlo en el campo de texto
   - Hacer clic en "Liberar Fondos"

### Endpoint de Liberación de Fondos

También se puede liberar fondos mediante API:

```bash
curl -X POST http://localhost:3000/api/release-funds/{payment_id}
```

## API Endpoints

### GET /api/products
Obtiene la lista de productos disponibles.

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Producto Seller 1 - Item A",
    "price": 1000,
    "sellerId": "seller_1@example.com",
    "sellerName": "Vendedor 1",
    "description": "Producto del vendedor 1"
  }
]
```

### POST /api/create-checkout
Crea un checkout de Mobbex con split payment y retención de fondos.

**Body:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Producto",
      "quantity": 1,
      "unit_price": 1000
    }
  ],
  "payer": {
    "name": "Cliente Test",
    "email": "cliente@test.com",
    "identification": "11111111"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "checkout_id": "abc123",
  "url": "https://mobbex.com/p/checkout/abc123",
  "reference": "checkout_1234567890"
}
```

### POST /api/webhook
Endpoint para recibir notificaciones de Mobbex cuando un pago se completa.

**Nota:** Este endpoint es llamado automáticamente por Mobbex.

### POST /api/release-funds/:payment_id
Libera los fondos retenidos al vendedor después de confirmar la entrega.

**Respuesta:**
```json
{
  "success": true,
  "message": "Fondos liberados exitosamente",
  "payment_id": "payment_123",
  "split": [...],
  "released_at": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/payments
Lista todos los pagos registrados.

### GET /api/payments/:payment_id
Obtiene los detalles de un pago específico.

### GET /api/checkouts
Lista todos los checkouts creados.

## Tarjetas de Prueba

Para probar en el ambiente de prueba de Mobbex:

| Tipo | Número | CVV | Vencimiento | Resultado |
|------|--------|-----|-------------|-----------|
| Visa | 4509 9535 6623 3704 | 123 | 12/25 | Aprobado |
| Mastercard | 5031 7557 3453 0604 | 123 | 12/25 | Aprobado |

**Documentación:** [Testing Mobbex](https://mobbex.dev/docs/testing)

## Flujo de Pagos con Split y Hold

1. **Cliente realiza compra** → Se crea un checkout con split payment y hold activado
2. **Pago aprobado** → Webhook notifica el pago, fondos quedan retenidos
3. **Producto entregado** → Se llama al endpoint `/api/release-funds/:payment_id`
4. **Fondos liberados** → Cada vendedor recibe su parte (95% del valor de sus productos)
5. **Marketplace** → Recibe el 5% de comisión de cada transacción

### Detalles del Split Payment

```javascript
{
  "split": [
    {
      "tax_id": "seller_1@example.com",  // Email del vendedor en Mobbex
      "total": 950,                       // 95% del valor del producto
      "reference": "seller_seller_1@example.com",
      "fee": 50,                          // 5% de comisión
      "hold": true                        // Retener fondos
    }
  ]
}
```

## Webhooks

El servidor escucha webhooks de Mobbex en `/api/webhook`. Cuando un pago se completa:

1. Mobbex envía una notificación POST a este endpoint
2. El servidor registra el pago con su estado
3. Los fondos quedan retenidos hasta que se liberen manualmente

**Ejemplo de payload de webhook:**
```json
{
  "payment": {
    "id": "payment_123",
    "reference": "checkout_1234567890",
    "status": {
      "code": "200",
      "text": "approved"
    },
    "total": 2500
  }
}
```

## Configuración de Vendedores

Para que el split payment funcione correctamente:

1. Cada vendedor debe tener una cuenta activa en Mobbex
2. El `tax_id` en el split debe ser el email registrado del vendedor en Mobbex
3. Los vendedores recibirán los fondos en sus cuentas de Mobbex al ser liberados
4. Asegúrate de actualizar los emails en `server/server.js` con emails reales

```javascript
// En server/server.js
const products = [
  {
    id: 1,
    name: 'Producto Seller 1 - Item A',
    price: 1000,
    sellerId: 'vendedor1@ejemplo.com',  // Email real de Mobbex
    sellerName: 'Vendedor 1',
    description: 'Producto del vendedor 1'
  }
];
```

## Notas Importantes

- Los fondos se retienen con `hold: true` en el split
- La comisión del marketplace es del 5% sobre el valor de cada producto
- Cada vendedor recibe el 95% del valor de sus productos vendidos
- El endpoint de liberación de fondos NO requiere autenticación (solo para POC)
- Los webhooks requieren que tu servidor sea accesible públicamente
- En desarrollo, usa ngrok o similar para exponer tu servidor local

## Diferencias con Mercado Pago

- Mobbex usa emails como identificadores de vendedores (tax_id)
- El hold se configura directamente en el split
- Mobbex tiene mejor soporte nativo para marketplaces argentinos
- Los webhooks son más directos y simples
- La liberación de fondos se hace por operación individual

## Tecnologías Utilizadas

- Node.js + Express
- Axios (cliente HTTP para llamar a la API de Mobbex)
- HTML5 + CSS3 + JavaScript vanilla
- dotenv para variables de entorno
- Mobbex API REST

## Mejoras Sugeridas para Producción

- Agregar autenticación al endpoint de liberación de fondos
- Implementar verificación de firma en webhooks de Mobbex
- Agregar base de datos para persistir checkouts y pagos
- Implementar sistema de tracking de entregas real
- Agregar validaciones más robustas
- Implementar logs y monitoreo
- Agregar manejo de errores más completo
- Configurar retry logic para llamadas a API
- Agregar tests unitarios y de integración
- Implementar rate limiting
- Configurar HTTPS en producción

## Recursos

- [Documentación Mobbex](https://mobbex.dev/)
- [API Reference](https://api-doc.mobbex.com/)
- [Mobbex Console](https://mobbex.com/)
- [Testing Guide](https://mobbex.dev/docs/testing)

## Soporte

Para problemas con Mobbex, contactar a su equipo de soporte:
- Email: soporte@mobbex.com
- Documentación: https://mobbex.dev/
