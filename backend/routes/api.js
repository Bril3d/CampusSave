const express = require('express');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { db } = require('../config/firebase');
const orderController = require('../controllers/orderController');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CampusSave Express + Firebase Admin API' });
});

// Profil de l'utilisateur connecté : le rôle vient d'ici (jamais décidé par l'app mobile).
router.get('/me', verifyFirebaseToken, (req, res) => {
  const { uid, email, name, role } = req.user;
  res.json({ uid, email, name, role });
});

// ========================
// SHOPS (Commerces)
// ========================
router.get('/shops', async (req, res) => {
  try {
    const includeAll = req.query.all === 'true';
    const snap = includeAll
      ? await db.collection('shops').get()
      : await db.collection('shops').where('approved', '==', true).get();
    const shops = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shops', verifyFirebaseToken, requireRole('merchant'), async (req, res) => {
  try {
    const { name, address, phone, description } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Nom et adresse obligatoires.' });
    }
    const shopRef = db.collection('shops').doc(req.user.uid);
    const shopData = {
      ownerId: req.user.uid,
      name: name.trim(),
      address: address.trim(),
      phone: (phone || '').trim(),
      description: (description || '').trim(),
      approved: false,
      createdAt: Date.now(),
    };
    await shopRef.set(shopData, { merge: true });
    res.status(201).json({ shop: { id: shopRef.id, ...shopData } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// OFFERS
// ========================
router.get('/offers', async (req, res) => {
  try {
    const approvedShopsSnap = await db.collection('shops').where('approved', '==', true).get();
    const approvedShopIds = new Set(approvedShopsSnap.docs.map((d) => d.id));

    const snap = await db.collection('offers').get();
    const search = String(req.query.search || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim();
    const shopId = String(req.query.shopId || '').trim();
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const includeAll = req.query.includeAll === 'true';

    const offers = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((o) => {
        if (!includeAll && !approvedShopIds.has(o.shopId)) return false;
        if (category && category !== 'Toutes' && o.category !== category) return false;
        if (shopId && o.shopId !== shopId) return false;
        if (maxPrice && !Number.isNaN(maxPrice) && Number(o.price) > maxPrice) return false;
        if (search && !`${o.title} ${o.category}`.toLowerCase().includes(search)) return false;
        return true;
      });

    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/offers', verifyFirebaseToken, requireRole('merchant'), async (req, res) => {
  try {
    const { shopId, title, category, originalPrice, price, quantity, pickupFrom, pickupTo, photo } = req.body;
    const targetShopId = shopId || req.user.uid;
    const shopSnap = await db.collection('shops').doc(targetShopId).get();
    if (!shopSnap.exists || shopSnap.data().ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Commerce non autorisé.' });
    }
    if (shopSnap.data().approved !== true) {
      return res.status(403).json({ error: 'Votre commerce doit être approuvé par l\'administrateur.' });
    }

    const orig = Number(originalPrice);
    const disc = Number(price);
    const qty = Number(quantity);
    if (disc <= 0 || disc >= orig) {
      return res.status(400).json({ error: 'Le prix réduit doit être inférieur au prix initial.' });
    }

    const ref = db.collection('offers').doc();
    const offer = {
      shopId: targetShopId,
      title: title.trim(),
      category: category.trim(),
      originalPrice: orig,
      price: disc,
      quantity: qty,
      pickupFrom: pickupFrom || '17:00',
      pickupTo: pickupTo || '19:00',
      photo: photo || '',
      createdAt: Date.now(),
    };
    await ref.set(offer);
    res.status(201).json({ offer: { id: ref.id, ...offer } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/offers/:id', verifyFirebaseToken, requireRole('merchant'), async (req, res) => {
  try {
    const ref = db.collection('offers').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Offre introuvable.' });

    const shopSnap = await db.collection('shops').doc(snap.data().shopId).get();
    if (!shopSnap.exists || shopSnap.data().ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Accès interdit.' });
    }

    const updates = {};
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.quantity !== undefined) updates.quantity = Number(req.body.quantity);
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.originalPrice !== undefined) updates.originalPrice = Number(req.body.originalPrice);

    await ref.update(updates);
    const updated = await ref.get();
    res.json({ offer: { id: updated.id, ...updated.data() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/offers/:id', verifyFirebaseToken, requireRole('merchant', 'admin'), async (req, res) => {
  try {
    const ref = db.collection('offers').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Offre introuvable.' });

    if (req.user.role === 'merchant') {
      const shopSnap = await db.collection('shops').doc(snap.data().shopId).get();
      if (!shopSnap.exists || shopSnap.data().ownerId !== req.user.uid) {
        return res.status(403).json({ error: 'Accès interdit.' });
      }
    }
    await ref.delete();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// ORDERS, KONNECT & QR
// ========================
router.get('/orders/my', verifyFirebaseToken, requireRole('student'), async (req, res) => {
  try {
    const snap = await db.collection('orders').where('studentId', '==', req.user.uid).get();
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/merchant', verifyFirebaseToken, requireRole('merchant'), async (req, res) => {
  try {
    const shopsSnap = await db.collection('shops').where('ownerId', '==', req.user.uid).get();
    const shopIds = shopsSnap.docs.map((d) => d.id);
    if (!shopIds.length) return res.json({ orders: [] });

    const snap = await db.collection('orders').where('shopId', 'in', shopIds.slice(0, 10)).get();
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/reserve', verifyFirebaseToken, requireRole('student'), orderController.reserveOrder);
router.post('/orders/:id/cancel', verifyFirebaseToken, requireRole('student'), orderController.cancelOrder);
router.post('/payments/konnect/init', verifyFirebaseToken, requireRole('student'), orderController.initPayment);
router.post('/payments/konnect/verify', verifyFirebaseToken, requireRole('student'), orderController.verifyPayment);
router.post('/orders/validate-qr', verifyFirebaseToken, requireRole('merchant', 'admin'), orderController.validateQr);

// ========================
// ADMIN
// ========================
router.get('/admin/users', verifyFirebaseToken, requireRole('admin'), async (_req, res) => {
  try {
    const snap = await db.collection('users').get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/users/:id/block', verifyFirebaseToken, requireRole('admin'), async (req, res) => {
  try {
    const blocked = Boolean(req.body.blocked);
    await db.collection('users').doc(req.params.id).update({ blocked });
    res.json({ updated: true, blocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/shops/:id/approve', verifyFirebaseToken, requireRole('admin'), async (req, res) => {
  try {
    const approved = Boolean(req.body.approved);
    await db.collection('shops').doc(req.params.id).update({ approved });
    res.json({ updated: true, approved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/orders', verifyFirebaseToken, requireRole('admin'), async (_req, res) => {
  try {
    const snap = await db.collection('orders').get();
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
