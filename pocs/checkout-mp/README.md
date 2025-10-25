# Marketplace Checkout con Mercado Pago

Aplicación de checkout tipo marketplace que implementa pagos divididos (split payments) usando Mercado Pago, con retención de fondos hasta confirmación de entrega.

## Características

- Productos precargados de 2 vendedores diferentes
- Carrito de compras multi-vendedor
- Comisión del 5% para el marketplace
- Split payment automático entre vendedores
- Retención de fondos (90 días configurado)
- Endpoint para liberar fondos sin autenticación
- Panel de administración para gestionar pagos

## Estructura del Proyecto

```
checkout-mp/
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
MP_ACCESS_TOKEN=tu_access_token_aqui
MP_PUBLIC_KEY=tu_public_key_aqui
MARKETPLACE_FEE_PERCENTAGE=5
PORT=3000
```

### 3. Obtener credenciales de Mercado Pago

1. Ir a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Crear una aplicación
3. Obtener las credenciales de prueba (Access Token y Public Key)
4. Configurar los IDs de los vendedores en `server/server.js`:
   - Reemplazar `SELLER_1_ID` y `SELLER_2_ID` con los IDs reales de las cuentas de vendedor

### 4. Iniciar el servidor

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
5. Completar el flujo de pago en Mercado Pago (usar tarjetas de prueba)
6. Ser redirigido de vuelta a la aplicación

### Panel de Administración

1. Abrir `http://localhost:3000/admin.html`
2. Ver todos los pagos registrados
3. Para liberar fondos:
   - Copiar el ID del pago
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

### POST /api/create-payment
Crea una preferencia de pago con split payment.

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
    "name": "Cliente",
    "surname": "Test",
    "email": "test@test.com"
  }
}
```

### POST /api/release-funds/:payment_id
Libera los fondos al vendedor después de confirmar la entrega.

### GET /api/payments
Lista todos los pagos registrados.

### GET /api/payments/:payment_id
Obtiene los detalles de un pago específico.

## Tarjetas de Prueba

Para probar en el ambiente de sandbox de Mercado Pago:

| Tarjeta | Número | CVV | Fecha |
|---------|--------|-----|-------|
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 |
| Visa | 4509 9535 6623 3704 | 123 | 11/25 |

**Documentación completa:** [Tarjetas de prueba Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-test/test-cards)

## Flujo de Pagos

1. **Cliente realiza compra** → Se crea una preferencia de pago con split payment
2. **Pago aprobado** → Los fondos se retienen por 90 días
3. **Producto entregado** → Se llama al endpoint `/api/release-funds/:payment_id`
4. **Fondos liberados** → Cada vendedor recibe su parte (95% del valor de sus productos)
5. **Marketplace** → Recibe el 5% de comisión total

## Notas Importantes

- Los fondos están retenidos por 90 días como máximo
- La comisión del marketplace es del 5% sobre el total
- Cada vendedor recibe el 95% del valor de sus productos vendidos
- El endpoint de liberación de fondos NO requiere autenticación (solo para POC)
- En producción, este endpoint debería estar protegido

## Tecnologías Utilizadas

- Node.js + Express
- Mercado Pago SDK
- HTML5 + CSS3 + JavaScript vanilla
- dotenv para variables de entorno

## Mejoras Sugeridas para Producción

- Agregar autenticación al endpoint de liberación de fondos
- Implementar webhooks de Mercado Pago para actualizar estados
- Agregar base de datos para persistir pagos
- Implementar sistema de tracking de entregas
- Agregar validaciones más robustas
- Implementar logs y monitoreo
- Agregar tests unitarios y de integración
