import React, { useState, useEffect } from 'react';
import { Card, Button, StatusBadge, useToast, MetricCard } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Member, Invoice, PaymentRecord, AttendanceRecord } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import { collection, getDocs } from 'firebase/firestore';
import {
  FileText,
  Download,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { currentBusiness, labels } = useTenant();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReportType, setSelectedReportType] = useState<
    'revenue' | 'attendance' | 'members' | 'pending'
  >('revenue');

  useEffect(() => {
    if (!currentBusiness) return;
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const memSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'members'));
        setMembers(memSnap.docs.map((d) => ({ ...(d.data() as Member), id: d.id })));

        const invSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'invoices'));
        setInvoices(invSnap.docs.map((d) => ({ ...(d.data() as Invoice), id: d.id })));

        const paySnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'payments'));
        setPayments(paySnap.docs.map((d) => ({ ...(d.data() as PaymentRecord), id: d.id })));

        const attSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'attendance'));
        setAttendance(attSnap.docs.map((d) => ({ ...(d.data() as AttendanceRecord), id: d.id })));
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [currentBusiness]);

  // Export CSV handler
  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'report.csv';

    if (selectedReportType === 'revenue') {
      headers = ['Payment Date', 'Invoice #', 'Member Name', 'Amount', 'Payment Method', 'Reference'];
      rows = payments.map((p) => [p.date, p.invoiceNumber, `"${p.memberName}"`, p.amount.toString(), p.paymentMethod, p.referenceNo || '']);
      filename = `${currentBusiness?.name || 'business'}_revenue_report.csv`;
    } else if (selectedReportType === 'attendance') {
      headers = ['Date', 'Time', 'Member Code', 'Member Name', 'Check-in Method', 'Verified By'];
      rows = attendance.map((a) => [a.date, a.time, a.memberCode, `"${a.memberName}"`, a.method, `"${a.verifiedBy}"`]);
      filename = `${currentBusiness?.name || 'business'}_attendance_report.csv`;
    } else if (selectedReportType === 'pending') {
      headers = ['Invoice #', 'Member Name', 'Plan', 'Total Invoiced', 'Paid Amount', 'Pending Balance', 'Due Date'];
      rows = invoices.filter((i) => i.balance > 0).map((i) => [
        i.invoiceNumber,
        `"${i.memberName}"`,
        `"${i.planName || ''}"`,
        i.amount.toString(),
        i.paidAmount.toString(),
        i.balance.toString(),
        i.dueDate,
      ]);
      filename = `${currentBusiness?.name || 'business'}_pending_fees_report.csv`;
    } else {
      headers = ['Member Code', 'Full Name', 'Phone', 'Email', 'Status', 'Plan', 'Join Date', 'Expiry Date'];
      rows = members.map((m) => [m.memberCode, `"${m.fullName}"`, m.phone, m.email || '', m.status, `"${m.planName || ''}"`, m.joinDate, m.planEndDate || '']);
      filename = `${currentBusiness?.name || 'business'}_members_growth_report.csv`;
    }

    if (rows.length === 0) {
      showToast('No records found for this report filter', 'info');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully!`, 'success');
  };

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const pendingCount = invoices.filter((i) => i.balance > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Reports &amp; Business Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and export daily attendance logs, revenue collections, pending dues, and member retention metrics.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleExportReportCSV}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export Report to CSV
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Paid Revenue"
          value={`${currentBusiness?.currency} ${totalRevenue.toLocaleString()}`}
          subtitle="Lifetime verified collections"
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Outstanding Receivables"
          value={`${currentBusiness?.currency} ${totalOutstanding.toLocaleString()}`}
          subtitle={`${pendingCount} pending invoices`}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Total Check-ins"
          value={attendance.length}
          subtitle="All-time attendance logs"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Total Enrolled"
          value={members.length}
          subtitle={`${members.filter((m) => m.status === 'active').length} active`}
          icon={<Users className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xl text-xs font-semibold">
        {[
          { id: 'revenue', label: 'Revenue & Collections' },
          { id: 'attendance', label: 'Attendance Records' },
          { id: 'pending', label: 'Pending Dues' },
          { id: 'members', label: `${labels.memberPlural} Roster` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedReportType(t.id as any)}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              selectedReportType === t.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Data Preview Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white capitalize">
            {selectedReportType} Preview
          </h3>
          <span className="text-xs text-slate-400">Live Database Records</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            {selectedReportType === 'revenue' && (
              <>
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Mode</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-3 text-slate-500">{p.date}</td>
                      <td className="px-6 py-3 font-mono">{p.invoiceNumber}</td>
                      <td className="px-6 py-3 font-semibold">{p.memberName}</td>
                      <td className="px-6 py-3 uppercase text-[11px] font-semibold">{p.paymentMethod}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">
                        {currentBusiness?.currency} {p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {selectedReportType === 'attendance' && (
              <>
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Member Code</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3 text-right">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendance.map((a) => (
                    <tr key={a.id}>
                      <td className="px-6 py-3 text-slate-500">{a.date}</td>
                      <td className="px-6 py-3 font-medium">{a.time}</td>
                      <td className="px-6 py-3 font-mono">{a.memberCode}</td>
                      <td className="px-6 py-3 font-semibold">{a.memberName}</td>
                      <td className="px-6 py-3 text-right uppercase text-[11px]">{a.method}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {selectedReportType === 'pending' && (
              <>
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Total Invoiced</th>
                    <th className="px-6 py-3 text-right">Outstanding Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.filter((i) => i.balance > 0).map((i) => (
                    <tr key={i.id}>
                      <td className="px-6 py-3 font-mono">{i.invoiceNumber}</td>
                      <td className="px-6 py-3 font-semibold">{i.memberName}</td>
                      <td className="px-6 py-3 text-slate-500">{i.planName}</td>
                      <td className="px-6 py-3">{currentBusiness?.currency} {i.amount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-bold text-rose-600">
                        {currentBusiness?.currency} {i.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {selectedReportType === 'members' && (
              <>
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="px-6 py-3 font-mono">{m.memberCode}</td>
                      <td className="px-6 py-3 font-semibold">{m.fullName}</td>
                      <td className="px-6 py-3">{m.phone}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500">{m.planEndDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
};
