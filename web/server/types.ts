export type UserRole = 'student' | 'merchant' | 'admin';

export type CommerceStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus = 'reserved' | 'paid' | 'collected' | 'cancelled';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Commerce {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  address: string;
  distanceLabel: string;
  phone: string;
  openingHours: string;
  description: string;
  status: CommerceStatus;
  createdAt: string;
}

export interface Offer {
  id: string;
  commerceId: string;
  commerceName: string;
  title: string;
  description: string;
  category: 'Boulangerie' | 'Plats chauds' | 'Sandwichs' | 'Pâtisserie & Jus' | 'Panier Surprise';
  originalPrice: number;
  discountedPrice: number;
  availableQuantity: number;
  pickupWindow: string;
  imageUrl: string;
  status: 'active' | 'paused';
  createdAt: string;
}

export interface Order {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  offerId: string;
  offerTitle: string;
  commerceId: string;
  commerceName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  paymentRef: string | null;
  paymentMode: 'konnect_sandbox' | 'local_sandbox_test' | null;
  qrToken: string | null;
  qrDataUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  collectedAt: string | null;
}

export interface DatabaseSchema {
  users: UserRecord[];
  commerces: Commerce[];
  offers: Offer[];
  orders: Order[];
}
