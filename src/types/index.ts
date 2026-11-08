export type UserRole = 'super_admin' | 'owner' | 'staff' | 'member';

export type BusinessCategory = 'gym' | 'tuition' | 'academy' | 'yoga' | 'dance' | 'sports';

export type SaaSPlan = 'trial' | 'starter' | 'growth' | 'pro';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface BusinessConfigLabels {
  category: BusinessCategory;
  categoryName: string;
  categoryIcon: string;
  memberSingular: string;
  memberPlural: string;
  planSingular: string;
  planPlural: string;
  attendanceSingular: string;
  feeSingular: string;
  feePlural: string;
  defaultPlanDurations: { name: string; months: number; defaultPrice: number }[];
}

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  ownerId: string;
  ownerEmail: string;
  phone?: string;
  address?: string;
  currency: string;
  subscriptionPlan: SaaSPlan;
  status: 'active' | 'trial' | 'suspended';
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  primaryBranchName?: string;
}

export interface BusinessMembership {
  id: string; // businessId_userId
  businessId: string;
  userId: string;
  email: string;
  role: 'owner' | 'staff' | 'member';
  permissions: string[];
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  isPrimary: boolean;
  address?: string;
  phone?: string;
}

export interface Member {
  id: string;
  businessId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive' | 'expired' | 'pending';
  joinDate: string;
  photoUrl?: string;
  planId?: string;
  planName?: string;
  planEndDate?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  businessId: string;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  businessId: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  method: 'qr' | 'manual';
  verifiedBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  memberId: string;
  memberName: string;
  planId?: string;
  planName?: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  dueDate: string;
  description?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'online';
  referenceNo?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'trainer' | 'receptionist' | 'coach';
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: 'expiry_reminder' | 'fee_due' | 'payment_receipt' | 'welcome';
  title: string;
  body: string;
  sampleVariables: string[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isSuperAdmin: boolean;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  todayAttendanceCount: number;
  attendanceRatePercent: number;
  monthlyRevenue: number;
  pendingFees: number;
  expiringIn14DaysCount: number;
}
