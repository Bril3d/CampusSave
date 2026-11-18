import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSchema, SafeUser, UserRecord } from '../types.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'campussave-db.json');

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, user: UserRecord): boolean {
  const { hash } = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}

function createInitialData(): DatabaseSchema {
  const now = new Date().toISOString();
  const studentCreds = hashPassword('Student123!');
  const merchantCreds = hashPassword('Merchant123!');
  const merchant2Creds = hashPassword('Merchant123!');
  const adminCreds = hashPassword('Admin123!');

  return {
    users: [
      {
        id: 'usr-student-1',
        fullName: 'Aicha Menif',
        email: 'etudiant@essect.tn',
        phone: '+216 22 410 890',
        role: 'student',
        active: true,
        passwordHash: studentCreds.hash,
        passwordSalt: studentCreds.salt,
        createdAt: now,
      },
      {
        id: 'usr-merchant-1',
        fullName: 'Karim Ben Salah',
        email: 'boulangerie@montfleury.tn',
        phone: '+216 71 390 120',
        role: 'merchant',
        active: true,
        passwordHash: merchantCreds.hash,
        passwordSalt: merchantCreds.salt,
        createdAt: now,
      },
      {
        id: 'usr-merchant-2',
        fullName: 'Sonia Trabelsi',
        email: 'gourmet@essect.tn',
        phone: '+216 55 812 340',
        role: 'merchant',
        active: true,
        passwordHash: merchant2Creds.hash,
        passwordSalt: merchant2Creds.salt,
        createdAt: now,
      },
      {
        id: 'usr-admin-1',
        fullName: 'Administrateur CampusSave',
        email: 'admin@campussave.tn',
        phone: '+216 71 000 100',
        role: 'admin',
        active: true,
        passwordHash: adminCreds.hash,
        passwordSalt: adminCreds.salt,
        createdAt: now,
      },
    ],
    commerces: [
      {
        id: 'com-1',
        ownerId: 'usr-merchant-1',
        name: 'Boulangerie Montfleury',
        category: 'Boulangerie & Pâtisserie',
        address: 'Rue Abou El Kacem Chebbi, Montfleury, Tunis',
        distanceLabel: '2 min de l\'ESSECT',
        phone: '+216 71 390 120',
        openingHours: '07:00 - 20:30',
        description: 'Viennoiseries artisanales, pains chauds et coffrets anti-gaspi en fin d\'après-midi.',
        status: 'approved',
        createdAt: now,
      },
      {
        id: 'com-2',
        ownerId: 'usr-merchant-2',
        name: 'Le Coin Gourmet ESSECT',
        category: 'Restauration Rapide & Bowls',
        address: 'Avenue Ali Trad, face au campus ESSECT',
        distanceLabel: '1 min de l\'ESSECT',
        phone: '+216 55 812 340',
        openingHours: '08:30 - 18:00',
        description: 'Bols méditerranéens, sandwichs frais et jus pressés préparés chaque matin.',
        status: 'approved',
        createdAt: now,
      },
      {
        id: 'com-3',
        ownerId: 'usr-merchant-2',
        name: 'Café La Pergola',
        category: 'Cafétéria',
        address: 'Impasse El Jazira, Montfleury',
        distanceLabel: '5 min de l\'ESSECT',
        phone: '+216 52 900 412',
        openingHours: '07:30 - 19:00',
        description: 'En-cas étudiants et jus d\'orange pressés.',
        status: 'pending',
        createdAt: now,
      },
    ],
    offers: [
      {
        id: 'off-1',
        commerceId: 'com-1',
        commerceName: 'Boulangerie Montfleury',
        title: 'Coffret Viennoiseries du Soir',
        description: 'Assortiment de 2 croissants pur beurre, 2 pains au chocolat et 2 brioches sucrées cuits le matin même.',
        category: 'Boulangerie',
        originalPrice: 12.0,
        discountedPrice: 4.8,
        availableQuantity: 6,
        pickupWindow: '17:30 - 19:30',
        imageUrl: '/src/assets/images/offer_bakery_box_1794947730298.jpg',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'off-2',
        commerceId: 'com-2',
        commerceName: 'Le Coin Gourmet ESSECT',
        title: 'Bowl Méditerranéen Poulet Grillé',
        description: 'Poulet mariné aux herbes, couscous léger, légumes rôtis, olives et citron frais. Préparé à midi.',
        category: 'Plats chauds',
        originalPrice: 15.5,
        discountedPrice: 6.5,
        availableQuantity: 4,
        pickupWindow: '15:00 - 17:30',
        imageUrl: '/src/assets/images/offer_mediterranean_bowl_1794947731536.jpg',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'off-3',
        commerceId: 'com-2',
        commerceName: 'Le Coin Gourmet ESSECT',
        title: 'Baguette Artisanale Thon & Harissa',
        description: 'Pain sésame croustillant, thon entier, harissa maison, câpres et laitue croquante.',
        category: 'Sandwichs',
        originalPrice: 8.5,
        discountedPrice: 3.9,
        availableQuantity: 8,
        pickupWindow: '15:30 - 18:00',
        imageUrl: '/src/assets/images/offer_tunisian_sandwich_1794947730622.jpg',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'off-4',
        commerceId: 'com-1',
        commerceName: 'Boulangerie Montfleury',
        title: 'Pause Jus Pressé & Feuilletés Amandes',
        description: 'Bouteille de jus d\'orange pressé 33cl accompagnée de deux feuilletés aux amandes grillées.',
        category: 'Pâtisserie & Jus',
        originalPrice: 9.0,
        discountedPrice: 4.0,
        availableQuantity: 5,
        pickupWindow: '16:30 - 19:00',
        imageUrl: '/src/assets/images/offer_juice_pastry_1794947731535.jpg',
        status: 'active',
        createdAt: now,
      },
    ],
    orders: [],
  };
}

let cachedDb: DatabaseSchema | null = null;

export function readDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      cachedDb = JSON.parse(raw) as DatabaseSchema;
      return cachedDb;
    }
  } catch {
    // Fallback to fresh seed if corrupted
  }
  cachedDb = createInitialData();
  writeDb(cachedDb);
  return cachedDb;
}

export function writeDb(data: DatabaseSchema): void {
  cachedDb = data;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}
