const { db } = require('../config/firebase');
const {
  initKonnectPayment,
  verifyKonnectPayment,
  generateOrderQr,
  sendPushNotification,
} = require('../services/paymentAndQrService');

const RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

exports.reserveOrder = async (req, res) => {
  try {
    const { offerId, quantity } = req.body;
    const qty = Number(quantity || 1);
    if (!offerId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: 'Offre et quantité valide requises.' });
    }

    const orderRef = db.collection('orders').doc();
    const offerRef = db.collection('offers').doc(offerId);

    const createdOrder = await db.runTransaction(async (tx) => {
      const offerSnap = await tx.get(offerRef);
      if (!offerSnap.exists) {
        throw new Error('OFFER_NOT_FOUND');
      }
      const offer = offerSnap.data();
      if ((offer.quantity || 0) < qty) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const duplicateSnap = await tx.get(
        db
          .collection('orders')
          .where('studentId', '==', req.user.uid)
          .where('offerId', '==', offerId)
          .where('status', '==', 'reserved')
          .limit(1)
      );
      if (!duplicateSnap.empty) {
        throw new Error('DUPLICATE_RESERVATION');
      }

      const now = Date.now();
      const unitPrice = Number(offer.price || 0);
      const origUnitPrice = Number(offer.originalPrice || unitPrice);

      tx.update(offerRef, {
        quantity: Number(offer.quantity) - qty,
      });

      const orderData = {
        offerId,
        shopId: offer.shopId,
        studentId: req.user.uid,
        studentName: req.user.name || req.user.email,
        title: offer.title,
        quantity: qty,
        total: Number((unitPrice * qty).toFixed(2)),
        originalTotal: Number((origUnitPrice * qty).toFixed(2)),
        status: 'reserved',
        createdAt: now,
        expiresAt: now + RESERVATION_TTL_MS,
        releasedAt: null,
        paymentRef: null,
        qrToken: null,
      };
      tx.set(orderRef, orderData);
      return { id: orderRef.id, ...orderData };
    });

    res.status(201).json({ order: createdOrder });
  } catch (err) {
    if (err.message === 'OFFER_NOT_FOUND') return res.status(404).json({ error: 'Offre introuvable.' });
    if (err.message === 'INSUFFICIENT_STOCK') return res.status(409).json({ error: 'Stock insuffisant.' });
    if (err.message === 'DUPLICATE_RESERVATION') {
      return res.status(409).json({ error: 'Vous avez déjà une réservation en attente pour cette offre.' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw new Error('ORDER_NOT_FOUND');
      const order = snap.data();
      if (order.studentId !== req.user.uid) throw new Error('FORBIDDEN');
      if (order.status !== 'reserved') throw new Error('NOT_RESERVED');

      const offerRef = db.collection('offers').doc(order.offerId);
      const offerSnap = await tx.get(offerRef);
      if (offerSnap.exists) {
        const currentQty = Number(offerSnap.data().quantity || 0);
        tx.update(offerRef, { quantity: currentQty + Number(order.quantity || 1) });
      }
      tx.update(orderRef, {
        status: 'cancelled',
        releasedAt: Date.now(),
      });
    });
    res.json({ cancelled: true });
  } catch (err) {
    if (err.message === 'ORDER_NOT_FOUND') return res.status(404).json({ error: 'Commande introuvable.' });
    if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Accès interdit.' });
    if (err.message === 'NOT_RESERVED') return res.status(409).json({ error: 'Annulation impossible pour ce statut.' });
    res.status(500).json({ error: err.message });
  }
};

exports.initPayment = async (req, res) => {
  try {
    const { orderId, phone } = req.body;
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Commande introuvable.' });

    const order = snap.data();
    if (order.studentId !== req.user.uid) return res.status(403).json({ error: 'Accès interdit.' });
    if (order.status !== 'reserved') return res.status(409).json({ error: 'Commande non éligible au paiement.' });
    if (order.expiresAt && Date.now() > order.expiresAt) {
      return res.status(409).json({ error: 'Réservation expirée.' });
    }

    // Si Konnect API key n'est pas configurée, mode test sandbox explicite
    if (!process.env.KONNECT_API_KEY || process.env.KONNECT_API_KEY.startsWith('VOTRE_')) {
      const testRef = `KNX-TEST-${Date.now()}`;
      await orderRef.update({ paymentRef: testRef });
      return res.json({ paymentRef: testRef, payUrl: null, mode: 'sandbox_test' });
    }

    const konnect = await initKonnectPayment({
      orderId,
      amountTnd: order.total,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentPhone: phone || '20000000',
    });

    await orderRef.update({ paymentRef: konnect.paymentRef });
    res.json({ paymentRef: konnect.paymentRef, payUrl: konnect.payUrl, mode: 'konnect_sandbox' });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentRef, sandboxConfirmed } = req.body;
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Commande introuvable.' });

    const order = snap.data();
    if (order.studentId !== req.user.uid) return res.status(403).json({ error: 'Accès interdit.' });
    if (order.status === 'paid' || order.status === 'collected') return res.json({ order: { id: snap.id, ...order } });
    if (order.paymentRef !== paymentRef) return res.status(409).json({ error: 'Référence invalide.' });

    if (process.env.KONNECT_API_KEY && !process.env.KONNECT_API_KEY.startsWith('VOTRE_')) {
      const payment = await verifyKonnectPayment(paymentRef);
      if (!payment || payment.status !== 'completed') {
        return res.status(402).json({ error: `Paiement non confirmé (statut: ${payment?.status || 'inconnu'}).` });
      }
    } else if (!sandboxConfirmed) {
      return res.status(402).json({ error: 'Confirmation sandbox requise.' });
    }

    const { qrToken, qrDataUrl } = await generateOrderQr(orderId, order.shopId);
    await orderRef.update({
      status: 'paid',
      qrToken,
      qrDataUrl,
      paidAt: Date.now(),
    });

    await sendPushNotification(
      req.user.fcmToken,
      'CampusSave - Commande confirmée',
      `Votre QR Code pour ${order.title} est prêt.`
    );

    const updated = await orderRef.get();
    res.json({ order: { id: updated.id, ...updated.data() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validateQr = async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ error: 'Code QR requis.' });

    const result = await db.runTransaction(async (tx) => {
      const qSnap = await tx.get(db.collection('orders').where('qrToken', '==', qrToken.trim()).limit(1));
      if (qSnap.empty) throw new Error('QR_NOT_FOUND');

      const orderDoc = qSnap.docs[0];
      const order = orderDoc.data();

      const shopSnap = await tx.get(db.collection('shops').doc(order.shopId));
      if (!shopSnap.exists || shopSnap.data().ownerId !== req.user.uid) {
        throw new Error('FORBIDDEN_SHOP');
      }

      if (order.status === 'collected') throw new Error('QR_ALREADY_USED');
      if (order.status !== 'paid') throw new Error('ORDER_NOT_PAID');

      tx.update(orderDoc.ref, {
        status: 'collected',
        collectedAt: Date.now(),
      });
      return { id: orderDoc.id, ...order, status: 'collected' };
    });

    res.json({ validated: true, message: 'Récupération validée avec succès.', order: result });
  } catch (err) {
    if (err.message === 'QR_NOT_FOUND') return res.status(404).json({ error: 'QR Code inconnu.' });
    if (err.message === 'FORBIDDEN_SHOP') return res.status(403).json({ error: 'Ce QR Code appartient à un autre commerce.' });
    if (err.message === 'QR_ALREADY_USED') return res.status(409).json({ error: 'Ce QR Code a déjà été utilisé.' });
    if (err.message === 'ORDER_NOT_PAID') return res.status(409).json({ error: 'Commande non payée.' });
    res.status(500).json({ error: err.message });
  }
};
