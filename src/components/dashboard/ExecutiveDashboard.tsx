import React, { useState, useEffect } from 'react';
import { Card, MetricCard, Button, StatusBadge, useToast } from '../common/DesignSystem.tsx';
import { AnalyticsCharts } from './AnalyticsCharts.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Member, Invoice, PaymentRecord, AttendanceRecord } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import { collection, getDocs } from 'firebase/firestore';
import {
  Users,
  CalendarCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  UserPlus,
  QrCode,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  Building2,
  Calendar,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  onNavigate: (tab: any) => void;
  onOpenAddMember: () => void;
  onOpenCheckIn: () => void;
  onOpenRecordPayment: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigate,
  onOpenAddMember,
  onOpenCheckIn,
  onOpenRecordPayment,
}) => {
  const { currentBusiness, labels } = useTenant();
  const { currentUser, profile } = useAuth();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentBusiness) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Members
        const memSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'members'));
        setMembers(memSnap.docs.map((d) => ({ ...(d.data() as Member), id: d.id })));

        // Invoices
        const invSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'invoices'));
        setInvoices(invSnap.docs.map((d) => ({ ...(d.data() as Invoice), id: d.id })));

        // Payments
        const paySnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'payments'));
        setPayments(paySnap.docs.map((d) => ({ ...(d.data() as PaymentRecord), id: d.id })));

        // Attendance
        const attSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'attendance'));
        setAttendance(attSnap.docs.map((d) => ({ ...(d.data() as AttendanceRecord), id: d.id })));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentBusiness]);

  // Calculations
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const todayAttendanceCount = todayAttendance.length;
  const monthlyRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const pendingFees = invoices.reduce((s, i) => s + i.balance, 0);

  // Expiring memberships in next 14 days
  const now = new Date();
  const fourteenDaysLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const expiringMembers = members.filter((m) => {
    if (!m.planEndDate) return false;
    const expDate = new Date(m.planEndDate);
    return expDate >= now && expDate <= fourteenDaysLater;
  });

  // Pending payments list
  const pendingInvoices = invoices.filter((i) => i.balance > 0).slice(0, 5);

  // Current formatted date
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formattedToday}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Welcome back, {profile?.displayName?.split(' ')[0] || 'Partner'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentBusiness?.name} • Live Operations &amp; Performance Overview
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCheckIn}
            icon={<QrCode className="w-3.5 h-3.5" />}
          >
            Quick Check-in
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenRecordPayment}
            icon={<DollarSign className="w-3.5 h-3.5" />}
          >
            Record Fee
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenAddMember}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add {labels.memberSingular}
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid (High density, clean typography, tabular nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={`Total ${labels.memberPlural}`}
          value={totalMembers}
          subtitle={`${activeMembers} active memberships`}
          change={`${activeMembers > 0 ? Math.round((activeMembers / Math.max(totalMembers, 1)) * 100) : 0}% active`}
          isPositive={true}
          icon={<Users className="w-4 h-4 text-blue-500" />}
        />

        <MetricCard
          title="Today's Attendance"
          value={todayAttendanceCount}
          subtitle={`${Math.max(activeMembers - todayAttendanceCount, 0)} absent / remaining`}
          change={activeMembers > 0 ? `${Math.round((todayAttendanceCount / activeMembers) * 100)}% attendance` : '0%'}
          isPositive={todayAttendanceCount > 0}
          icon={<CalendarCheck className="w-4 h-4 text-emerald-500" />}
        />

        <MetricCard
          title="Revenue Collected"
          value={`${currentBusiness?.currency} ${monthlyRevenue.toLocaleString()}`}
          subtitle={`${payments.length} verified transactions`}
          change="Real-time"
          isPositive={true}
          icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
        />

        <MetricCard
          title="Pending Fees"
          value={`${currentBusiness?.currency} ${pendingFees.toLocaleString()}`}
          subtitle={`${pendingInvoices.length} outstanding accounts`}
          change={pendingFees > 0 ? 'Requires follow-up' : 'All clear'}
          isPositive={pendingFees === 0}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Analytics Charts Section */}
      <AnalyticsCharts
        invoices={invoices}
        payments={payments}
        attendance={attendance}
        currency={currentBusiness?.currency || 'INR'}
      />

      {/* Two Column Layout: Pending Dues & Upcoming Expirations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments Table */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Pending Fee Dues
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accounts with outstanding balance
              </p>
            </div>
            <button
              onClick={() => onNavigate('plans')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {pendingInvoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <div className="font-medium">No pending fees</div>
                <div className="text-[11px] text-slate-400">All member dues are settled.</div>
              </div>
            ) : (
              pendingInvoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {inv.memberName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {inv.invoiceNumber} • Due {inv.dueDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {currentBusiness?.currency} {inv.balance.toLocaleString()}
                    </div>
                    <button
                      onClick={() => onNavigate('notifications')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 justify-end mt-0.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Remind via WA</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Renewals */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Upcoming {labels.planSingular} Expirations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expiring within the next 14 days
              </p>
            </div>
            <button
              onClick={() => onNavigate('members')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Roster</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {expiringMembers.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <div className="font-medium">No imminent renewals</div>
                <div className="text-[11px] text-slate-400">All active plans are valid for &gt; 14 days.</div>
              </div>
            ) : (
              expiringMembers.slice(0, 5).map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {m.memberCode} • {m.planName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                      Expires {m.planEndDate}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.phone}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
