export type UserRole = 'student' | 'merchant' | 'admin';

export type CommerceStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus = 'reserved' | 'paid' | 'collected' | 'cancelled';

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

export interface StudentDashboardStats {
  totalOrders: number;
  pendingPayment: number;
  readyForPickup: number;
  mealsSaved: number;
  totalSpent: number;
  moneySaved: number;
}

export interface MerchantDashboardStats {
  activeOffers: number;
  totalOrders: number;
  awaitingPickup: number;
  collectedOrders: number;
  revenueTnd: number;
  portionsSaved: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  studentsCount: number;
  merchantsCount: number;
  pendingCommerces: number;
  approvedCommerces: number;
  activeOffers: number;
  totalOrders: number;
  portionsSaved: number;
  totalVolumeTnd: number;
}
