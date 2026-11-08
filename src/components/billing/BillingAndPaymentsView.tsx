import React, { useState, useEffect } from 'react';
import { Card, Button, StatusBadge, Modal, SearchInput, EmptyState, TableSkeleton, useToast, MetricCard } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Member, MembershipPlan, Invoice, PaymentRecord } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const BillingAndPaymentsView: React.FC = () => {
  const { currentBusiness, labels } = useTenant();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'plans'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Record Payment Modal State
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'online'>('upi');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Receipt Modal State
  const [receiptRecord, setReceiptRecord] = useState<{
    invoice?: Invoice;
    payment?: PaymentRecord;
  } | null>(null);

  // Fetch Data from Firestore
  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // 1. Fetch Plans
      const plansSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'plans'));
      setPlans(plansSnap.docs.map((d) => ({ ...(d.data() as MembershipPlan), id: d.id })));

      // 2. Fetch Members
      const membersSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'members'));
      setMembers(membersSnap.docs.map((d) => ({ ...(d.data() as Member), id: d.id })));

      // 3. Fetch Invoices
      const invoicesSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'invoices'));
      const invList = invoicesSnap.docs.map((d) => ({ ...(d.data() as Invoice), id: d.id }));
      invList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(invList);

      // 4. Fetch Payments
      const paymentsSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'payments'));
      const payList = paymentsSnap.docs.map((d) => ({ ...(d.data() as PaymentRecord), id: d.id }));
      payList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(payList);
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  // Handle open Record Payment modal
  const openPaymentForInvoice = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setPaymentAmount(inv.balance);
    setReferenceNo('');
    setIsRecordPaymentModalOpen(true);
  };

  // Submit Payment Record
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    const invoice = invoices.find((inv) => inv.id === selectedInvoiceId);
    if (!invoice) {
      showToast('Please select a valid invoice', 'error');
      return;
    }

    if (paymentAmount <= 0) {
      showToast('Payment amount must be greater than zero', 'error');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const paymentId = 'pay_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const nowIso = new Date().toISOString();
      const todayDate = nowIso.split('T')[0];

      // 1. Calculate new invoice amounts
      const newPaidAmount = invoice.paidAmount + paymentAmount;
      const newBalance = Math.max(invoice.amount - newPaidAmount, 0);
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      // 2. Create Payment Record
      const newPayment: PaymentRecord = {
        id: paymentId,
        businessId: currentBusiness.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        memberId: invoice.memberId,
        memberName: invoice.memberName,
        amount: paymentAmount,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        date: todayDate,
        notes: paymentNotes.trim() || undefined,
        createdAt: nowIso,
      };

      await setDoc(doc(db, 'businesses', currentBusiness.id, 'payments', paymentId), newPayment);

      // 3. Update Invoice in Firestore
      await updateDoc(doc(db, 'businesses', currentBusiness.id, 'invoices', invoice.id), {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      });

      // Update local state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id
            ? { ...inv, paidAmount: newPaidAmount, balance: newBalance, status: newStatus }
            : inv
        )
      );
      setPayments((prev) => [newPayment, ...prev]);

      showToast(`Recorded payment of ${currentBusiness.currency} ${paymentAmount.toLocaleString()}!`, 'success');
      setIsRecordPaymentModalOpen(false);

      // Open receipt preview
      setReceiptRecord({ invoice, payment: newPayment });
    } catch (err: unknown) {
      console.error('Failed to record payment:', err);
      const e = err as Error;
      showToast(e.message || 'Payment recording failed', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Metrics
  const totalInvoiced = invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalPending = invoices.reduce((s, inv) => s + inv.balance, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Billing, Plans &amp; Fee Payments</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track invoices, collect partial or full cash/UPI payments, issue digital receipts, and manage membership packages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              if (invoices.length > 0) {
                openPaymentForInvoice(invoices[0]);
              } else {
                showToast(`Add a ${labels.memberSingular.toLowerCase()} first to generate invoices.`, 'info');
              }
            }}
            icon={<DollarSign className="w-3.5 h-3.5" />}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Collected"
          value={`${currentBusiness?.currency} ${totalCollected.toLocaleString()}`}
          change={`${collectionRate}% collected`}
          isPositive={collectionRate >= 70}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Pending / Outstanding"
          value={`${currentBusiness?.currency} ${totalPending.toLocaleString()}`}
          subtitle={`${invoices.filter((i) => i.balance > 0).length} pending invoices`}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Total Invoiced"
          value={`${currentBusiness?.currency} ${totalInvoiced.toLocaleString()}`}
          subtitle="All-time billing"
          icon={<Receipt className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Active Plans"
          value={plans.length}
          subtitle={`Packages configured`}
          icon={<CreditCard className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'plans'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {labels.planPlural} ({plans.length})
        </button>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <Card className="overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by invoice # or member name..."
              className="w-full sm:max-w-xs"
            />

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              {(['all', 'unpaid', 'partial', 'paid'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-6 h-6" />}
              title="No invoices found"
              description="Invoices are created automatically when members enroll in a plan."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Invoice #</th>
                    <th className="px-6 py-3.5">Member Name</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Paid Amount</th>
                    <th className="px-6 py-3.5">Outstanding Balance</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {inv.memberName}
                        <div className="text-[11px] font-normal text-slate-400">{inv.planName}</div>
                      </td>
                      <td className="px-6 py-4 tabular-nums font-semibold text-slate-900 dark:text-white">
                        {currentBusiness?.currency} {inv.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                        {currentBusiness?.currency} {inv.paidAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 tabular-nums font-bold text-rose-600 dark:text-rose-400">
                        {currentBusiness?.currency} {inv.balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.balance > 0 ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openPaymentForInvoice(inv)}
                          >
                            Collect Fee
                          </Button>
                        ) : (
                          <button
                            onClick={() => setReceiptRecord({ invoice: inv })}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-end ml-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: PAYMENTS HISTORY */}
      {activeTab === 'payments' && (
        <Card className="overflow-hidden">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-6 h-6" />}
              title="No payments collected yet"
              description="Collected payments will appear here with verification reference numbers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Member Name</th>
                    <th className="px-6 py-3.5">Invoice #</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Amount Paid</th>
                    <th className="px-6 py-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 tabular-nums text-slate-500 dark:text-slate-400">
                        {p.date}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {p.memberName}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{p.invoiceNumber}</td>
                      <td className="px-6 py-4">
                        <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {p.paymentMethod}
                        </span>
                        {p.referenceNo && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {p.referenceNo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {currentBusiness?.currency} {p.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReceiptRecord({ payment: p })}
                          icon={<Printer className="w-3.5 h-3.5" />}
                        >
                          View Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: MEMBERSHIP PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {plan.durationMonths} Month(s)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {plan.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {plan.description || `Standard ${plan.durationMonths} months package`}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {currentBusiness?.currency} {plan.price.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Avg {currentBusiness?.currency} {Math.round(plan.price / plan.durationMonths).toLocaleString()}/month
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        title="Record Fee Payment"
        description="Enter payment details to update member invoice balance and record the transaction."
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Invoice to Settle
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const inv = invoices.find((i) => i.id === e.target.value);
                if (inv) setPaymentAmount(inv.balance);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
            >
              {invoices
                .filter((inv) => inv.balance > 0)
                .map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.memberName} (Bal: {currentBusiness?.currency} {inv.balance.toLocaleString()})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount ({currentBusiness?.currency}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={paymentAmount || ''}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              placeholder="e.g. 4000"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold tabular-nums"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              >
                <option value="upi">UPI / QR Code</option>
                <option value="cash">Cash in Hand</option>
                <option value="card">Debit / Credit Card</option>
                <option value="online">Net Banking / Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reference / Receipt #
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. UPI UTR or Cash No."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingPayment}
              onClick={() => setIsRecordPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSubmittingPayment}>
              Confirm &amp; Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Receipt Preview Modal */}
      {receiptRecord && (
        <Modal
          isOpen={!!receiptRecord}
          onClose={() => setReceiptRecord(null)}
          title="Official Payment Receipt"
          description="Verified transaction receipt for member billing records."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs font-sans">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {currentBusiness?.name}
                  </h4>
                  <div className="text-slate-500 text-[11px]">{currentBusiness?.address || 'Main Center'}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {receiptRecord.payment?.invoiceNumber || receiptRecord.invoice?.invoiceNumber}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Date: {receiptRecord.payment?.date || new Date().toISOString().split('T')[0]}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <div>
                  <strong>Issued To:</strong> {receiptRecord.payment?.memberName || receiptRecord.invoice?.memberName}
                </div>
                <div>
                  <strong>Payment Mode:</strong> <span className="uppercase">{receiptRecord.payment?.paymentMethod || 'Paid'}</span>
                </div>
                {receiptRecord.payment?.referenceNo && (
                  <div>
                    <strong>Reference:</strong> {receiptRecord.payment.referenceNo}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">Amount Collected:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {currentBusiness?.currency} {(receiptRecord.payment?.amount || receiptRecord.invoice?.paidAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Receipt
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReceiptRecord(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
