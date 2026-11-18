const { auth, db } = require('../config/firebase');

async function verifyFirebaseToken(req, res, next) {
  if (!auth || !db) {
    return res.status(500).json({ error: 'Firebase Admin non initialisé (serviceAccountKey.json manquant).' });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Jeton d\'authentification manquant.' });
  }

  const idToken = header.slice(7).trim();
  try {
    const decoded = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Profil utilisateur introuvable dans Firestore.' });
    }

    const userData = userDoc.data();
    if (userData.blocked === true) {
      return res.status(403).json({ error: 'Compte bloqué par l\'administrateur.' });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email || userData.email || '',
      role: userData.role || 'student',
      name: userData.name || '',
      fcmToken: userData.fcmToken || null,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Jeton Firebase invalide ou expiré.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit pour ce rôle.' });
    }
    next();
  };
}

module.exports = { verifyFirebaseToken, requireRole };
