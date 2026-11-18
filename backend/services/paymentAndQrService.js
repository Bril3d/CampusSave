const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { messaging } = require('../config/firebase');

const KONNECT_BASE_URL = process.env.KONNECT_BASE_URL || 'https://api.sandbox.konnect.network/api/v2';

async function initKonnectPayment({ orderId, amountTnd, studentName, studentEmail, studentPhone }) {
  const apiKey = process.env.KONNECT_API_KEY;
  const walletId = process.env.KONNECT_RECEIVER_WALLET_ID;
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

  if (!apiKey || !walletId || apiKey.startsWith('VOTRE_')) {
    throw new Error('Configurez KONNECT_API_KEY et KONNECT_RECEIVER_WALLET_ID dans backend/.env');
  }

  const response = await axios.post(
    `${KONNECT_BASE_URL}/payments/init-payment`,
    {
      receiverWalletId: walletId,
      token: 'TND',
      amount: Math.round(amountTnd * 1000),
      type: 'immediate',
      description: `CampusSave - Commande ${orderId}`,
      acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
      lifespan: 15,
      checkoutForm: true,
      addPaymentFeesToAmount: false,
      firstName: studentName.split(' ')[0] || 'Etudiant',
      lastName: studentName.split(' ').slice(1).join(' ') || 'ESSECT',
      phoneNumber: studentPhone || '20000000',
      email: studentEmail,
      orderId,
      successUrl: `${baseUrl}/orders?konnect=success&orderId=${orderId}`,
      failUrl: `${baseUrl}/orders?konnect=fail&orderId=${orderId}`,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }
  );

  return response.data; // { payUrl, paymentRef }
}

async function verifyKonnectPayment(paymentRef) {
  const apiKey = process.env.KONNECT_API_KEY;
  const response = await axios.get(`${KONNECT_BASE_URL}/payments/${encodeURIComponent(paymentRef)}`, {
    headers: { 'x-api-key': apiKey },
  });
  return response.data.payment;
}

async function generateOrderQr(orderId, commerceId) {
  const secret = process.env.QR_HMAC_SECRET || 'campussave_qr_secret';
  const nonce = crypto.randomBytes(4).toString('hex').toUpperCase();
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:${commerceId}:${nonce}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();

  const qrToken = `CS-${orderId}-${nonce}-${sig}`;
  const qrDataUrl = await QRCode.toDataURL(qrToken, { width: 260, margin: 2 });
  return { qrToken, qrDataUrl };
}

async function sendPushNotification(fcmToken, title, body) {
  if (!messaging || !fcmToken) return;
  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
    });
  } catch (err) {
    console.warn('[FCM] Envoi notification ignoré :', err.message);
  }
}

module.exports = {
  initKonnectPayment,
  verifyKonnectPayment,
  generateOrderQr,
  sendPushNotification,
};
