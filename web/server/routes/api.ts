import crypto from 'node:crypto';
import express from 'express';
import {
  type AuthenticatedRequest,
  requireAuth,
  requireRole,
  signAuthToken,
} from '../middleware/auth.ts';
import { initKonnectPayment, verifyKonnectPayment } from '../services/konnectService.ts';
import { generateOrderQrCode } from '../services/qrService.ts';
import { hashPassword, readDb, toSafeUser, verifyPassword, writeDb } from '../store/db.ts';
import type { Commerce, Offer, Order, UserRole } from '../types.ts';

export const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CampusSave API' });
});

// ========================
// AUTHENTICATION
// ========================
apiRouter.post('/auth/register', (req, res) => {
  const { fullName, email, phone, password, role } = req.body as {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: UserRole;
  };

  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'Nom complet, e-mail et mot de passe sont obligatoires.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    return;
  }

  const safeRole: UserRole = role === 'merchant' ? 'merchant' : 'student';
  const normalizedEmail = email.trim().toLowerCase();

  const db = readDb();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr-${crypto.randomBytes(4).toString('hex')}`,
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: (phone || '').trim(),
    role: safeRole,
    active: true,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  const token = signAuthToken(newUser.id, newUser.role);
  res.status(201).json({ token, user: toSafeUser(newUser) });
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'E-mail et mot de passe requis.' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user)) {
    res.status(401).json({ error: 'Identifiants incorrects.' });
    return;
  }
  if (!user.active) {
    res.status(403).json({ error: 'Ce compte est suspendu.' });
    return;
  }

  const token = signAuthToken(user.id, user.role);
  res.json({ token, user: toSafeUser(user) });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// ========================
// COMMERCES
// ========================
apiRouter.get('/commerces', (req, res) => {
  const db = readDb();
  const includeAll = req.query.all === 'true';
  const commerces = includeAll
    ? db.commerces
    : db.commerces.filter((c) => c.status === 'approved');
  res.json({ commerces });
});

apiRouter.get('/commerces/mine', requireAuth, requireRole('merchant'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const commerces = db.commerces.filter((c) => c.ownerId === req.user!.id);
  res.json({ commerces });
});

apiRouter.post('/commerces', requireAuth, requireRole('merchant'), (req: AuthenticatedRequest, res) => {
  const { name, category, address, distanceLabel, phone, openingHours, description } = req.body as Partial<Commerce>;
  if (!name || !category || !address) {
    res.status(400).json({ error: 'Nom, catégorie et adresse du commerce sont obligatoires.' });
    return;
  }

  const db = readDb();
  const newCommerce: Commerce = {
    id: `com-${crypto.randomBytes(4).toString('hex')}`,
    ownerId: req.user!.id,
    name: name.trim(),
    category: category.trim(),
    address: address.trim(),
    distanceLabel: (distanceLabel || 'À proximité de l\'ESSECT').trim(),
    phone: (phone || req.user!.phone || '').trim(),
    openingHours: (openingHours || '08:00 - 19:00').trim(),
    description: (description || '').trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.commerces.push(newCommerce);
  writeDb(db);
  res.status(201).json({ commerce: newCommerce });
});

apiRouter.put('/commerces/:id', requireAuth, requireRole('merchant', 'admin'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const commerce = db.commerces.find((c) => c.id === req.params.id);
  if (!commerce) {
    res.status(404).json({ error: 'Commerce introuvable.' });
    return;
  }
  if (req.user!.role !== 'admin' && commerce.ownerId !== req.user!.id) {
    res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre commerce.' });
    return;
  }

  const { name, category, address, distanceLabel, phone, openingHours, description } = req.body as Partial<Commerce>;
  if (name) commerce.name = name.trim();
  if (category) commerce.category = category.trim();
  if (address) commerce.address = address.trim();
  if (distanceLabel) commerce.distanceLabel = distanceLabel.trim();
  if (phone !== undefined) commerce.phone = phone.trim();
  if (openingHours) commerce.openingHours = openingHours.trim();
  if (description !== undefined) commerce.description = description.trim();

  // Keep offer commerceName synchronized
  for (const offer of db.offers) {
    if (offer.commerceId === commerce.id) {
      offer.commerceName = commerce.name;
    }
  }

  writeDb(db);
  res.json({ commerce });
});

// ========================
// OFFERS
// ========================
apiRouter.get('/offers', (req, res) => {
  const db = readDb();
  const approvedCommerceIds = new Set(
    db.commerces.filter((c) => c.status === 'approved').map((c) => c.id),
  );

  const search = String(req.query.search || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();
  const commerceId = String(req.query.commerceId || '').trim();
  const maxPriceRaw = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const includeAll = req.query.includeAll === 'true';

  const offers = db.offers.filter((offer) => {
    if (!includeAll) {
      if (!approvedCommerceIds.has(offer.commerceId)) return false;
      if (offer.status !== 'active') return false;
    }
    if (category && category !== 'Toutes' && offer.category !== category) return false;
    if (commerceId && offer.commerceId !== commerceId) return false;
    if (maxPriceRaw !== null && !Number.isNaN(maxPriceRaw) && maxPriceRaw > 0 && offer.discountedPrice > maxPriceRaw) {
      return false;
    }
    if (search) {
      const hay = `${offer.title} ${offer.description} ${offer.commerceName} ${offer.category}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  res.json({ offers });
});

apiRouter.get('/offers/:id', (req, res) => {
  const db = readDb();
  const offer = db.offers.find((o) => o.id === req.params.id);
  if (!offer) {
    res.status(404).json({ error: 'Offre introuvable.' });
    return;
  }
  const commerce = db.commerces.find((c) => c.id === offer.commerceId) || null;
  res.json({ offer, commerce });
});

apiRouter.post('/offers', requireAuth, requireRole('merchant'), (req: AuthenticatedRequest, res) => {
  const {
    commerceId,
    title,
    description,
    category,
    originalPrice,
    discountedPrice,
    availableQuantity,
    pickupWindow,
    imageUrl,
  } = req.body as Partial<Offer>;

  if (!commerceId || !title || !category || originalPrice === undefined || discountedPrice === undefined || availableQuantity === undefined) {
    res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires de l\'offre.' });
    return;
  }

  const db = readDb();
  const commerce = db.commerces.find((c) => c.id === commerceId);
  if (!commerce || commerce.ownerId !== req.user!.id) {
    res.status(403).json({ error: 'Commerce non autorisé.' });
    return;
  }
  if (commerce.status !== 'approved') {
    res.status(403).json({ error: 'Votre commerce doit être validé par un administrateur avant de publier des offres.' });
    return;
  }

  const orig = Number(originalPrice);
  const disc = Number(discountedPrice);
  const qty = Number(availableQuantity);

  if (Number.isNaN(orig) || Number.isNaN(disc) || disc <= 0 || disc >= orig) {
    res.status(400).json({ error: 'Le prix réduit doit être strictement inférieur au prix initial.' });
    return;
  }
  if (!Number.isInteger(qty) || qty < 1) {
    res.status(400).json({ error: 'La quantité disponible doit être un entier positif.' });
    return;
  }

  const defaultImages: Record<string, string> = {
    Boulangerie: '/src/assets/images/offer_bakery_box_1794947730298.jpg',
    'Plats chauds': '/src/assets/images/offer_mediterranean_bowl_1794947731536.jpg',
    Sandwichs: '/src/assets/images/offer_tunisian_sandwich_1794947730622.jpg',
    'Pâtisserie & Jus': '/src/assets/images/offer_juice_pastry_1794947731535.jpg',
    'Panier Surprise': '/src/assets/images/hero_campus_food_1794947730758.jpg',
  };

  const newOffer: Offer = {
    id: `off-${crypto.randomBytes(4).toString('hex')}`,
    commerceId: commerce.id,
    commerceName: commerce.name,
    title: title.trim(),
    description: (description || '').trim(),
    category,
    originalPrice: Number(orig.toFixed(2)),
    discountedPrice: Number(disc.toFixed(2)),
    availableQuantity: qty,
    pickupWindow: (pickupWindow || '17:00 - 19:00').trim(),
    imageUrl: imageUrl?.trim() || defaultImages[category] || '/src/assets/images/offer_bakery_box_1794947730298.jpg',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.offers.unshift(newOffer);
  writeDb(db);
  res.status(201).json({ offer: newOffer });
});

apiRouter.put('/offers/:id', requireAuth, requireRole('merchant'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const offer = db.offers.find((o) => o.id === req.params.id);
  if (!offer) {
    res.status(404).json({ error: 'Offre introuvable.' });
    return;
  }
  const commerce = db.commerces.find((c) => c.id === offer.commerceId);
  if (!commerce || commerce.ownerId !== req.user!.id) {
    res.status(403).json({ error: 'Vous ne pouvez modifier que les offres de votre établissement.' });
    return;
  }

  const { title, description, category, originalPrice, discountedPrice, availableQuantity, pickupWindow, status } =
    req.body as Partial<Offer>;

  if (title) offer.title = title.trim();
  if (description !== undefined) offer.description = description.trim();
  if (category) offer.category = category;
  if (pickupWindow) offer.pickupWindow = pickupWindow.trim();
  if (status === 'active' || status === 'paused') offer.status = status;

  if (originalPrice !== undefined) offer.originalPrice = Number(Number(originalPrice).toFixed(2));
  if (discountedPrice !== undefined) offer.discountedPrice = Number(Number(discountedPrice).toFixed(2));
  if (offer.discountedPrice >= offer.originalPrice) {
    res.status(400).json({ error: 'Le prix réduit doit rester inférieur au prix initial.' });
    return;
  }

  if (availableQuantity !== undefined) {
    const qty = Number(availableQuantity);
    if (!Number.isInteger(qty) || qty < 0) {
      res.status(400).json({ error: 'La quantité disponible doit être un entier positif ou nul.' });
      return;
    }
    offer.availableQuantity = qty;
  }

  writeDb(db);
  res.json({ offer });
});

apiRouter.delete('/offers/:id', requireAuth, requireRole('merchant', 'admin'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const index = db.offers.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Offre introuvable.' });
    return;
  }
  const offer = db.offers[index];
  if (req.user!.role === 'merchant') {
    const commerce = db.commerces.find((c) => c.id === offer.commerceId);
    if (!commerce || commerce.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Action non autorisée sur cette offre.' });
      return;
    }
  }

  db.offers.splice(index, 1);
  writeDb(db);
  res.json({ deleted: true });
});

// ========================
// ORDERS & RESERVATIONS
// ========================
apiRouter.post('/orders/reserve', requireAuth, requireRole('student'), (req: AuthenticatedRequest, res) => {
  const { offerId, quantity } = req.body as { offerId?: string; quantity?: number };
  const qty = Number(quantity || 1);

  if (!offerId || !Number.isInteger(qty) || qty < 1) {
    res.status(400).json({ error: 'Offre et quantité valide requises.' });
    return;
  }

  const db = readDb();
  const offer = db.offers.find((o) => o.id === offerId);
  if (!offer || offer.status !== 'active') {
    res.status(404).json({ error: 'Cette offre n\'est plus disponible.' });
    return;
  }

  // Prevent duplicate unpaid reservation for the same offer by the same student
  const existingUnpaid = db.orders.find(
    (ord) => ord.studentId === req.user!.id && ord.offerId === offer.id && ord.status === 'reserved',
  );
  if (existingUnpaid) {
    res.status(409).json({
      error: 'Vous avez déjà une réservation en attente de paiement pour cette offre.',
      order: existingUnpaid,
    });
    return;
  }

  if (offer.availableQuantity < qty) {
    res.status(409).json({
      error: `Stock insuffisant. Il ne reste que ${offer.availableQuantity} portion(s) disponible(s).`,
    });
    return;
  }

  offer.availableQuantity -= qty;

  const newOrder: Order = {
    id: `CMD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    studentId: req.user!.id,
    studentName: req.user!.fullName,
    studentEmail: req.user!.email,
    offerId: offer.id,
    offerTitle: offer.title,
    commerceId: offer.commerceId,
    commerceName: offer.commerceName,
    quantity: qty,
    unitPrice: offer.discountedPrice,
    totalAmount: Number((offer.discountedPrice * qty).toFixed(2)),
    status: 'reserved',
    paymentRef: null,
    paymentMode: null,
    qrToken: null,
    qrDataUrl: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
    collectedAt: null,
  };

  db.orders.unshift(newOrder);
  writeDb(db);

  res.status(201).json({ order: newOrder });
});

apiRouter.post('/orders/:id/cancel', requireAuth, requireRole('student'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.studentId === req.user!.id);
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }
  if (order.status !== 'reserved') {
    res.status(409).json({ error: 'Seule une réservation non payée peut être annulée.' });
    return;
  }

  const offer = db.offers.find((o) => o.id === order.offerId);
  if (offer) {
    offer.availableQuantity += order.quantity;
  }
  order.status = 'cancelled';
  writeDb(db);
  res.json({ order });
});

apiRouter.get('/orders/my', requireAuth, requireRole('student'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const orders = db.orders.filter((o) => o.studentId === req.user!.id);
  res.json({ orders });
});

apiRouter.get('/orders/merchant', requireAuth, requireRole('merchant'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const myCommerceIds = new Set(
    db.commerces.filter((c) => c.ownerId === req.user!.id).map((c) => c.id),
  );
  const orders = db.orders.filter((o) => myCommerceIds.has(o.commerceId));
  res.json({ orders });
});

// ========================
// KONNECT PAYMENTS & QR CODE
// ========================
apiRouter.post('/payments/konnect/init', requireAuth, requireRole('student'), async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.body as { orderId?: string };
  if (!orderId) {
    res.status(400).json({ error: 'Identifiant de commande requis.' });
    return;
  }

  const db = readDb();
  const order = db.orders.find((o) => o.id === orderId && o.studentId === req.user!.id);
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }
  if (order.status === 'paid' || order.status === 'collected') {
    res.status(409).json({ error: 'Cette commande a déjà été payée.' });
    return;
  }
  if (order.status !== 'reserved') {
    res.status(409).json({ error: 'Cette réservation n\'est plus valide.' });
    return;
  }

  try {
    const originUrl = `${req.protocol}://${req.get('host')}`;
    const init = await initKonnectPayment({
      orderId: order.id,
      amountTnd: order.totalAmount,
      studentName: req.user!.fullName,
      studentEmail: req.user!.email,
      studentPhone: req.user!.phone,
      originUrl,
    });

    order.paymentRef = init.paymentRef;
    order.paymentMode = init.mode;
    writeDb(db);

    res.json({
      paymentRef: init.paymentRef,
      payUrl: init.payUrl,
      mode: init.mode,
      amountTnd: order.totalAmount,
      orderId: order.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur d\'initialisation Konnect.';
    res.status(502).json({ error: message });
  }
});

apiRouter.post('/payments/konnect/verify', requireAuth, requireRole('student'), async (req: AuthenticatedRequest, res) => {
  const { orderId, paymentRef, sandboxConfirmed } = req.body as {
    orderId?: string;
    paymentRef?: string;
    sandboxConfirmed?: boolean;
  };

  if (!orderId || !paymentRef) {
    res.status(400).json({ error: 'orderId et paymentRef sont requis.' });
    return;
  }

  const db = readDb();
  const order = db.orders.find((o) => o.id === orderId && o.studentId === req.user!.id);
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }
  if (order.status === 'paid' || order.status === 'collected') {
    res.json({ order, alreadyPaid: true });
    return;
  }
  if (order.status !== 'reserved' || order.paymentRef !== paymentRef) {
    res.status(409).json({ error: 'Référence de paiement invalide pour cette commande.' });
    return;
  }

  const verification = await verifyKonnectPayment({
    paymentRef,
    mode: order.paymentMode || 'local_sandbox_test',
    sandboxConfirmed,
  });

  if (!verification.confirmed) {
    res.status(402).json({ error: verification.reason || 'Paiement non confirmé par Konnect.' });
    return;
  }

  const { qrToken, qrDataUrl } = await generateOrderQrCode(order.id, order.commerceId);
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  order.qrToken = qrToken;
  order.qrDataUrl = qrDataUrl;
  writeDb(db);

  res.json({ order });
});

apiRouter.post('/orders/validate-qr', requireAuth, requireRole('merchant', 'admin'), (req: AuthenticatedRequest, res) => {
  const { qrToken } = req.body as { qrToken?: string };
  if (!qrToken || !qrToken.trim()) {
    res.status(400).json({ error: 'Veuillez saisir ou scanner le code QR.' });
    return;
  }

  const cleanedToken = qrToken.trim();
  const db = readDb();
  const order = db.orders.find((o) => o.qrToken === cleanedToken);
  if (!order) {
    res.status(404).json({ error: 'QR Code inconnu ou invalide.' });
    return;
  }

  if (req.user!.role === 'merchant') {
    const commerce = db.commerces.find((c) => c.id === order.commerceId);
    if (!commerce || commerce.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Ce QR Code concerne un autre établissement.' });
      return;
    }
  }

  if (order.status === 'collected') {
    res.status(409).json({
      error: `Ce QR Code a déjà été utilisé le ${new Date(order.collectedAt || '').toLocaleString('fr-FR')}.`,
      order,
    });
    return;
  }

  if (order.status !== 'paid') {
    res.status(409).json({ error: 'Cette commande n\'est pas réglée.' });
    return;
  }

  order.status = 'collected';
  order.collectedAt = new Date().toISOString();
  writeDb(db);

  res.json({
    validated: true,
    message: 'Récupération validée avec succès. Le QR Code est maintenant désactivé.',
    order,
  });
});

// ========================
// DASHBOARDS & ADMIN
// ========================
apiRouter.get('/dashboard/student', requireAuth, requireRole('student'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const orders = db.orders.filter((o) => o.studentId === req.user!.id);
  const paidOrCollected = orders.filter((o) => o.status === 'paid' || o.status === 'collected');
  const mealsSaved = paidOrCollected.reduce((sum, o) => sum + o.quantity, 0);
  const totalSpent = paidOrCollected.reduce((sum, o) => sum + o.totalAmount, 0);

  let estimatedSaved = 0;
  for (const ord of paidOrCollected) {
    const offer = db.offers.find((o) => o.id === ord.offerId);
    if (offer) {
      estimatedSaved += Math.max(0, offer.originalPrice - ord.unitPrice) * ord.quantity;
    }
  }

  res.json({
    stats: {
      totalOrders: orders.length,
      pendingPayment: orders.filter((o) => o.status === 'reserved').length,
      readyForPickup: orders.filter((o) => o.status === 'paid').length,
      mealsSaved,
      totalSpent: Number(totalSpent.toFixed(2)),
      moneySaved: Number(estimatedSaved.toFixed(2)),
    },
  });
});

apiRouter.get('/dashboard/merchant', requireAuth, requireRole('merchant'), (req: AuthenticatedRequest, res) => {
  const db = readDb();
  const commerces = db.commerces.filter((c) => c.ownerId === req.user!.id);
  const commerceIds = new Set(commerces.map((c) => c.id));
  const offers = db.offers.filter((o) => commerceIds.has(o.commerceId));
  const orders = db.orders.filter((o) => commerceIds.has(o.commerceId));
  const confirmedOrders = orders.filter((o) => o.status === 'paid' || o.status === 'collected');

  res.json({
    commerces,
    offers,
    stats: {
      activeOffers: offers.filter((o) => o.status === 'active' && o.availableQuantity > 0).length,
      totalOrders: orders.length,
      awaitingPickup: orders.filter((o) => o.status === 'paid').length,
      collectedOrders: orders.filter((o) => o.status === 'collected').length,
      revenueTnd: Number(confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)),
      portionsSaved: confirmedOrders.reduce((sum, o) => sum + o.quantity, 0),
    },
  });
});

apiRouter.get('/dashboard/admin', requireAuth, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const confirmedOrders = db.orders.filter((o) => o.status === 'paid' || o.status === 'collected');

  res.json({
    stats: {
      totalUsers: db.users.length,
      studentsCount: db.users.filter((u) => u.role === 'student').length,
      merchantsCount: db.users.filter((u) => u.role === 'merchant').length,
      pendingCommerces: db.commerces.filter((c) => c.status === 'pending').length,
      approvedCommerces: db.commerces.filter((c) => c.status === 'approved').length,
      activeOffers: db.offers.filter((o) => o.status === 'active').length,
      totalOrders: db.orders.length,
      portionsSaved: confirmedOrders.reduce((sum, o) => sum + o.quantity, 0),
      totalVolumeTnd: Number(confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)),
    },
  });
});

apiRouter.get('/admin/users', requireAuth, requireRole('admin'), (_req, res) => {
  const db = readDb();
  res.json({ users: db.users.map(toSafeUser) });
});

apiRouter.patch('/admin/users/:id/status', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { active } = req.body as { active?: boolean };
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable.' });
    return;
  }
  if (user.id === req.user!.id) {
    res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte administrateur.' });
    return;
  }
  user.active = Boolean(active);
  writeDb(db);
  res.json({ user: toSafeUser(user) });
});

apiRouter.patch('/admin/commerces/:id/approve', requireAuth, requireRole('admin'), (req, res) => {
  const { status } = req.body as { status?: 'approved' | 'rejected' | 'pending' };
  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    res.status(400).json({ error: 'Statut de validation invalide.' });
    return;
  }
  const db = readDb();
  const commerce = db.commerces.find((c) => c.id === req.params.id);
  if (!commerce) {
    res.status(404).json({ error: 'Commerce introuvable.' });
    return;
  }
  commerce.status = status;
  writeDb(db);
  res.json({ commerce });
});

apiRouter.get('/admin/orders', requireAuth, requireRole('admin'), (_req, res) => {
  const db = readDb();
  res.json({ orders: db.orders });
});
