export interface Building {
  id: string;
  name: string;
  address: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  roomNumber: string;
  role: 'resident' | 'admin';
  avatar?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistExpiry?: string;
}

export interface Tool {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  buildingId: string;
  buildingName: string;
  description: string;
  image: string;
  totalStock: number;
  availableStock: number;
  deposit: number;
  dailyRent: number;
  location: string;
  status: 'available' | 'maintenance' | 'lost';
  borrowCount: number;
  qrCode: string;
  specifications?: string[];
  usageNotes?: string[];
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'fullday';
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type BorrowStatus = 'borrowed' | 'returned' | 'overdue';
export type DamageSeverity = 'minor' | 'moderate' | 'severe';
export type AnnouncementType = 'notice' | 'faq' | 'rule';
export type AnnouncementPriority = 'normal' | 'important';

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  roomNumber: string;
  toolId: string;
  toolName: string;
  toolImage: string;
  startDate: string;
  endDate: string;
  timeSlot: TimeSlot;
  purpose: string;
  status: ReservationStatus;
  totalDeposit: number;
  totalRent: number;
  createdAt: string;
  approvedAt?: string;
  rejectedReason?: string;
}

export interface DamageReport {
  id: string;
  recordId: string;
  description: string;
  severity: DamageSeverity;
  photos: string[];
  compensationAmount: number;
  isPaid: boolean;
  reportedAt: string;
}

export interface BorrowRecord {
  id: string;
  reservationId?: string;
  userId: string;
  userName: string;
  roomNumber: string;
  toolId: string;
  toolName: string;
  toolImage: string;
  borrowAt: string;
  expectedReturnAt: string;
  actualReturnAt?: string;
  status: BorrowStatus;
  depositPaid: number;
  rentPaid: number;
  damageReport?: DamageReport;
}

export interface Deposit {
  id: string;
  userId: string;
  recordId: string;
  amount: number;
  status: 'held' | 'refunded';
  createdAt: string;
  refundedAt?: string;
}

export interface Compensation {
  id: string;
  userId: string;
  damageId: string;
  amount: number;
  status: 'unpaid' | 'paid';
  paidAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  createdAt: string;
  expiresAt?: string;
}
