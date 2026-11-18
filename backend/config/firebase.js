const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(
  __dirname,
  '..',
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
);

if (!admin.apps.length) {
  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(
      `[Firebase] Fichier introuvable : ${serviceAccountPath}. Placez le fichier serviceAccountKey.json de votre collègue dans backend/ avant de lancer les routes Firebase.`
    );
  } else {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase Admin] Initialisé avec succès.');
  }
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;
const messaging = admin.apps.length ? admin.messaging() : null;

module.exports = { admin, db, auth, messaging };
