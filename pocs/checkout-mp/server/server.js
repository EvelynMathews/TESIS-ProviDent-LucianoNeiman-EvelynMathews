require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const MP_API_URL = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

const MONEY_RELEASE_DAYS = parseInt(process.env.MONEY_RELEASE_DAYS) || 90;

const advancedPayments = new Map();

const products = [
  {
    id: 1,
    name: 'Producto Seller 1 - Item A',
    price: 1000,
    sellerId: process.env.SELLER_1_COLLECTOR_ID || 'SELLER_1_COLLECTOR_ID_HERE',
    sellerName: 'Vendedor 1',
    description: 'Producto del vendedor 1'
  },
  {
    id: 2,
    name: 'Producto Seller 2 - Item B',
    price: 1500,
    sellerId: process.env.SELLER_2_COLLECTOR_ID || 'SELLER_2_COLLECTOR_ID_HERE',
    sellerName: 'Vendedor 2',
    description: 'Producto del vendedor 2'
  }
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/create-payment', async (req, res) => {
  try {
    const { items, payer } = req.body;

    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN === 'tu_access_token_aqui') {
      return res.status(500).json({
        error: 'Configuración incompleta',
        details: 'MP_ACCESS_TOKEN no configurado en .env'
      });
    }

    const feePercentage = parseFloat(process.env.MARKETPLACE_FEE_PERCENTAGE) || 5;
    const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const groupedBySeller = items.reduce((acc, item) => {
      const product = products.find(p => p.id === parseInt(item.id));
      if (!product) return acc;

      if (!acc[product.sellerId]) {
        acc[product.sellerId] = {
          sellerName: product.sellerName,
          items: [],
          total: 0
        };
      }

      acc[product.sellerId].items.push(item);
      acc[product.sellerId].total += item.unit_price * item.quantity;

      return acc;
    }, {});

    const disbursements = Object.entries(groupedBySeller).map(([sellerId, data]) => {
      const sellerAmount = data.total;
      const applicationFee = Math.round(sellerAmount * (feePercentage / 100));

      return {
        collector_id: sellerId,
        amount: sellerAmount - applicationFee,
        application_fee: applicationFee,
        money_release_days: MONEY_RELEASE_DAYS,
        external_reference: `${data.sellerName}_${Date.now()}`
      };
    });

    const advancedPaymentData = {
      application_id: process.env.MP_APPLICATION_ID,
      payments: [
        {
          payment_method_id: 'account_money',
          transaction_amount: totalAmount,
          description: `Compra en Marketplace - ${items.length} item(s)`,
          external_reference: `order_${Date.now()}`,
          payer: {
            email: payer.email || 'test@test.com',
            first_name: payer.name || 'Cliente',
            last_name: payer.surname || 'Test'
          }
        }
      ],
      disbursements: disbursements,
      notification_url: `${BASE_URL}/api/webhook`,
      external_reference: `marketplace_${Date.now()}`,
      capture: true
    };

    console.log('Creando Advanced Payment:', JSON.stringify(advancedPaymentData, null, 2));

    const response = await axios.post(
      `${MP_API_URL}/v1/advanced_payments`,
      advancedPaymentData,
      {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': uuidv4()
        }
      }
    );

    const advancedPaymentId = response.data.id;

    advancedPayments.set(advancedPaymentId, {
      id: advancedPaymentId,
      items: items,
      total: totalAmount,
      fee: totalAmount * (feePercentage / 100),
      disbursements: response.data.disbursements || disbursements,
      status: response.data.status,
      created_at: new Date(),
      money_release_days: MONEY_RELEASE_DAYS
    });

    res.json({
      success: true,
      advanced_payment_id: advancedPaymentId,
      status: response.data.status,
      disbursements: response.data.disbursements,
      message: 'Advanced Payment creado exitosamente. NOTA: Este es un pago avanzado que requiere completarse con wallet o tarjeta.'
    });

  } catch (error) {
    console.error('Error creando Advanced Payment:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al crear el pago',
      details: error.response?.data || error.message,
      note: 'Advanced Payments requiere configuración especial de la aplicación en Mercado Pago'
    });
  }
});

app.post('/api/release-funds/:advanced_payment_id/:disbursement_id', async (req, res) => {
  try {
    const { advanced_payment_id, disbursement_id } = req.params;

    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN === 'tu_access_token_aqui') {
      return res.status(500).json({
        error: 'Configuración incompleta',
        details: 'MP_ACCESS_TOKEN no configurado en .env'
      });
    }

    const paymentInfo = advancedPayments.get(advanced_payment_id);

    if (!paymentInfo) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        details: `No se encontró el Advanced Payment ${advanced_payment_id}`
      });
    }

    console.log(`Liberando fondos: Advanced Payment ${advanced_payment_id}, Disbursement ${disbursement_id}`);

    const response = await axios.post(
      `${MP_API_URL}/v1/advanced_payments/${advanced_payment_id}/disbursements/${disbursement_id}/disburses`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': uuidv4()
        }
      }
    );

    const disbursement = paymentInfo.disbursements.find(d => d.id === parseInt(disbursement_id));
    if (disbursement) {
      disbursement.status = 'released';
      disbursement.released_at = new Date();
    }

    advancedPayments.set(advanced_payment_id, paymentInfo);

    res.json({
      success: true,
      message: 'Fondos liberados exitosamente',
      advanced_payment_id: advanced_payment_id,
      disbursement_id: disbursement_id,
      released_at: new Date(),
      response: response.data
    });

  } catch (error) {
    console.error('Error liberando fondos:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al liberar fondos',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    const webhookData = req.body;

    console.log('Webhook recibido:', JSON.stringify(webhookData, null, 2));

    if (webhookData.type === 'payment') {
      const paymentId = webhookData.data?.id;

      if (paymentId) {
        console.log(`Procesando notificación de pago: ${paymentId}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(200).send('OK');
  }
});

app.get('/api/payments', (req, res) => {
  const allPayments = Array.from(advancedPayments.values());
  res.json(allPayments);
});

app.get('/api/payments/:payment_id', (req, res) => {
  const { payment_id } = req.params;
  const payment = advancedPayments.get(payment_id);

  if (!payment) {
    return res.status(404).json({ error: 'Pago no encontrado' });
  }

  res.json(payment);
});

app.get('/success', (req, res) => {
  res.redirect('/?status=success');
});

app.get('/failure', (req, res) => {
  res.redirect('/?status=failure');
});

app.get('/pending', (req, res) => {
  res.redirect('/?status=pending');
});

app.listen(PORT, () => {
  console.log(`
========================================
Servidor Marketplace con Mercado Pago
========================================
URL: http://localhost:${PORT}
Webhook URL: ${BASE_URL}/api/webhook
========================================

IMPORTANTE - Configuración Requerida:
========================================

1. ADVANCED PAYMENTS API:
   - Requiere aplicación aprobada como Marketplace
   - Configurar en: https://www.mercadopago.com.ar/developers/panel

2. VARIABLES DE ENTORNO (.env):
   - MP_ACCESS_TOKEN: Access Token del marketplace
   - SELLER_1_COLLECTOR_ID: collector_id del vendedor 1
   - SELLER_2_COLLECTOR_ID: collector_id del vendedor 2
   - MP_APPLICATION_ID: ID de tu aplicación

3. OAUTH PARA VENDEDORES:
   - Cada vendedor debe autorizar al marketplace
   - Usar OAuth para obtener collector_id

4. LIBERACIÓN DE FONDOS:
   - POST /api/release-funds/:advanced_payment_id/:disbursement_id
   - Requiere IDs correctos de la respuesta del pago

========================================
  `);
});
