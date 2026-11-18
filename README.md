# CampusSave

Plateforme de lutte contre le gaspillage alimentaire autour de l'ESSECT (Tunis) : les commerçants publient des offres anti-gaspi, les étudiants réservent, paient (Konnect sandbox) et retirent leur commande avec un QR code.

## Structure

| Dossier | Contenu | Lancement |
|---|---|---|
| `web/` | Application React + serveur de démo intégré (données locales, port 3000) | `cd web && npm install && npm run dev` |
| `backend/` | API Express + Firebase Admin (Firestore, FCM, Konnect), port 5000 | `cd backend && npm install && npm start` |
| `mobile/` | Application Flutter (espace étudiant, auth Firebase) | `cd mobile && flutter pub get && flutter run` |
| `documentation/` | Architecture, schéma Firestore, routes REST | |
| `rapport/` | Plan du rapport ESSECT | |

`web/` peut tourner seul (rien à configurer). `backend/` est l'API de production utilisée par le mobile : elle demande `backend/serviceAccountKey.json` (clé du projet Firebase, **jamais commitée**) et `backend/.env` (copier `.env.example`).

## Comptes de démonstration (web/)
- Étudiant : `etudiant@essect.tn` / `Student123!`
- Commerçant : `boulangerie@montfleury.tn` / `Merchant123!`
- Administrateur : `admin@campussave.tn` / `Admin123!`

## Mobile ↔ backend
L'émulateur Android joint le backend via `http://10.0.2.2:5000/api` (valeur par défaut de `mobile/lib/config/api_config.dart`). Sur un téléphone réel :
`flutter run --dart-define=API_BASE_URL=http://<IP-du-PC>:5000/api`
