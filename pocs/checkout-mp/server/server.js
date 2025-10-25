require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

const payments = new Map();

const products = [
  {
    id: 1,
    name: 'Producto Seller 1 - Item A',
    price: 1000,
    sellerId: 'SELLER_1_ID',
    description: 'Producto del vendedor 1'
  },
  {
    id: 2,
    name: 'Producto Seller 2 - Item B',
    price: 1500,
    sellerId: 'SELLER_2_ID',
    description: 'Producto del vendedor 2'
  }
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/create-payment', async (req, res) => {
  try {
    const { items, payer } = req.body;

    const feePercentage = parseFloat(process.env.MARKETPLACE_FEE_PERCENTAGE) || 5;

    const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const marketplaceFee = totalAmount * (feePercentage / 100);

    const groupedBySeller = items.reduce((acc, item) => {
      const product = products.find(p => p.id === parseInt(item.id));
      if (!product) return acc;

      if (!acc[product.sellerId]) {
        acc[product.sellerId] = {
          items: [],
          total: 0
        };
      }

      acc[product.sellerId].items.push(item);
      acc[product.sellerId].total += item.unit_price * item.quantity;

      return acc;
    }, {});

    const applicationFee = Math.round(marketplaceFee);

    const disbursements = Object.entries(groupedBySeller).map(([sellerId, data]) => {
      const sellerAmount = data.total;
      const sellerFee = Math.round(sellerAmount * (feePercentage / 100));

      return {
        amount: sellerAmount - sellerFee,
        external_reference: sellerId,
        collector_id: sellerId
      };
    });

    const preference = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'ARS'
      })),
      payer: payer,
      back_urls: {
        success: `http://localhost:${PORT}/success`,
        failure: `http://localhost:${PORT}/failure`,
        pending: `http://localhost:${PORT}/pending`
      },
      auto_return: 'approved',
      marketplace_fee: applicationFee,
      disbursements: disbursements,
      money_release_days: 90
    };

    const response = await mercadopago.preferences.create(preference);

    payments.set(response.body.id, {
      id: response.body.id,
      items: items,
      total: totalAmount,
      fee: marketplaceFee,
      disbursements: disbursements,
      status: 'pending',
      created_at: new Date()
    });

    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });

  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({
      error: 'Error al crear el pago',
      details: error.message
    });
  }
});

app.post('/api/release-funds/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;

    const paymentInfo = payments.get(payment_id);

    if (!paymentInfo) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    if (paymentInfo.status === 'released') {
      return res.status(400).json({ error: 'Los fondos ya fueron liberados' });
    }

    const disbursementResponse = await mercadopago.money_requests.create({
      payment_id: payment_id
    });

    paymentInfo.status = 'released';
    paymentInfo.released_at = new Date();
    payments.set(payment_id, paymentInfo);

    res.json({
      message: 'Fondos liberados exitosamente',
      payment_id: payment_id,
      disbursements: paymentInfo.disbursements,
      released_at: paymentInfo.released_at
    });

  } catch (error) {
    console.error('Error liberando fondos:', error);
    res.status(500).json({
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
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
