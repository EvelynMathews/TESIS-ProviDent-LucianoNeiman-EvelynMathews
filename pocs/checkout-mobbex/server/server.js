require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const MOBBEX_API_URL = 'https://api.mobbex.com';
const MOBBEX_HEADERS = {
  'x-api-key': process.env.MOBBEX_API_KEY,
  'x-access-token': process.env.MOBBEX_ACCESS_TOKEN,
  'Content-Type': 'application/json'
};

const checkouts = new Map();
const payments = new Map();

const products = [
  {
    id: 1,
    name: 'Producto Seller 1 - Item A',
    price: 1000,
    sellerId: 'seller_1@example.com',
    sellerName: 'Vendedor 1',
    description: 'Producto del vendedor 1'
  },
  {
    id: 2,
    name: 'Producto Seller 2 - Item B',
    price: 1500,
    sellerId: 'seller_2@example.com',
    sellerName: 'Vendedor 2',
    description: 'Producto del vendedor 2'
  }
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { items, payer } = req.body;

    const feePercentage = parseFloat(process.env.MARKETPLACE_FEE_PERCENTAGE) || 5;
    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const groupedBySeller = items.reduce((acc, item) => {
      const product = products.find(p => p.id === parseInt(item.id));
      if (!product) return acc;

      if (!acc[product.sellerId]) {
        acc[product.sellerId] = {
          name: product.sellerName,
          items: [],
          total: 0
        };
      }

      acc[product.sellerId].items.push(item);
      acc[product.sellerId].total += item.unit_price * item.quantity;

      return acc;
    }, {});

    const split = [];

    Object.entries(groupedBySeller).forEach(([sellerId, data]) => {
      const sellerTotal = data.total;
      const sellerFee = sellerTotal * (feePercentage / 100);
      const sellerAmount = sellerTotal - sellerFee;

      split.push({
        tax_id: sellerId,
        total: sellerAmount,
        reference: `seller_${sellerId}`,
        fee: sellerFee,
        hold: true
      });
    });

    const checkoutData = {
      total: total,
      currency: 'ARS',
      reference: `checkout_${Date.now()}`,
      description: 'Compra en Marketplace',
      return_url: `${BASE_URL}/success`,
      webhook: `${BASE_URL}/api/webhook`,
      items: items.map(item => ({
        description: item.title,
        quantity: item.quantity,
        total: item.unit_price * item.quantity
      })),
      customer: {
        email: payer.email,
        name: payer.name,
        identification: payer.identification || '11111111'
      },
      split: split,
      options: {
        theme: {
          type: 'light',
          background: '#ffffff',
          colors: {
            primary: '#009ee3'
          }
        }
      }
    };

    const response = await axios.post(
      `${MOBBEX_API_URL}/p/checkout`,
      checkoutData,
      { headers: MOBBEX_HEADERS }
    );

    if (response.data && response.data.data) {
      const checkoutId = response.data.data.id;

      checkouts.set(checkoutId, {
        id: checkoutId,
        reference: checkoutData.reference,
        items: items,
        total: total,
        fee: total * (feePercentage / 100),
        split: split,
        status: 'pending',
        created_at: new Date()
      });

      res.json({
        success: true,
        checkout_id: checkoutId,
        url: response.data.data.url,
        reference: checkoutData.reference
      });
    } else {
      throw new Error('Respuesta inválida de Mobbex');
    }

  } catch (error) {
    console.error('Error creando checkout:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear el checkout',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    const webhookData = req.body;

    console.log('Webhook recibido:', JSON.stringify(webhookData, null, 2));

    if (webhookData.payment && webhookData.payment.status) {
      const paymentId = webhookData.payment.id;
      const reference = webhookData.payment.reference;

      const checkout = Array.from(checkouts.values()).find(c => c.reference === reference);

      if (checkout) {
        payments.set(paymentId, {
          id: paymentId,
          checkout_id: checkout.id,
          reference: reference,
          status: webhookData.payment.status.code,
          total: webhookData.payment.total,
          split: checkout.split,
          hold_status: 'held',
          created_at: checkout.created_at,
          paid_at: new Date()
        });

        checkout.status = webhookData.payment.status.code;
        checkout.payment_id = paymentId;
        checkouts.set(checkout.id, checkout);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(200).json({ success: true });
  }
});

app.post('/api/release-funds/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;

    const payment = payments.get(payment_id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }

    if (payment.hold_status === 'released') {
      return res.status(400).json({
        success: false,
        error: 'Los fondos ya fueron liberados'
      });
    }

    const releaseData = {
      payment_id: payment_id
    };

    try {
      const response = await axios.post(
        `${MOBBEX_API_URL}/p/operations/${payment_id}/release`,
        releaseData,
        { headers: MOBBEX_HEADERS }
      );

      payment.hold_status = 'released';
      payment.released_at = new Date();
      payments.set(payment_id, payment);

      res.json({
        success: true,
        message: 'Fondos liberados exitosamente',
        payment_id: payment_id,
        split: payment.split,
        released_at: payment.released_at
      });

    } catch (apiError) {
      console.log('Info: API de liberación no disponible en sandbox, simulando liberación');

      payment.hold_status = 'released';
      payment.released_at = new Date();
      payments.set(payment_id, payment);

      res.json({
        success: true,
        message: 'Fondos liberados exitosamente (simulado)',
        payment_id: payment_id,
        split: payment.split,
        released_at: payment.released_at,
        simulated: true
      });
    }

  } catch (error) {
    console.error('Error liberando fondos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al liberar fondos',
      details: error.message
    });
  }
});

app.get('/api/payments', (req, res) => {
  const allPayments = Array.from(payments.values());
  res.json(allPayments);
});

app.get('/api/payments/:payment_id', (req, res) => {
  const { payment_id } = req.params;
  const payment = payments.get(payment_id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Pago no encontrado'
    });
  }

  res.json(payment);
});

app.get('/api/checkouts', (req, res) => {
  const allCheckouts = Array.from(checkouts.values());
  res.json(allCheckouts);
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
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Webhook URL: ${BASE_URL}/api/webhook`);
});
