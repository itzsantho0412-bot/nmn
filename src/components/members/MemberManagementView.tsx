import React, { useState, useEffect } from 'react';
import { Card, Button, StatusBadge, Modal, SearchInput, EmptyState, TableSkeleton, useToast } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Member, MembershipPlan, Invoice } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  UserPlus,
  Users,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  Shield,
  CreditCard,
} from 'lucide-react';

interface MemberManagementViewProps {
  onSelectMemberForPayment?: (member: Member) => void;
}

export const MemberManagementView: React.FC<MemberManagementViewProps> = ({
  onSelectMemberForPayment,
}) => {
  const { currentBusiness, labels } = useTenant();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [joinDate, setJoinDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Members & Plans from Firestore
  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // 1. Fetch Plans
      const plansSnap = await getDocs(
        collection(db, 'businesses', currentBusiness.id, 'plans')
      );
      const plansList = plansSnap.docs.map((d) => ({
        ...(d.data() as MembershipPlan),
        id: d.id,
      }));
      setPlans(plansList);
      if (plansList.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansList[0].id);
      }

      // 2. Fetch Members
      const membersSnap = await getDocs(
        collection(db, 'businesses', currentBusiness.id, 'members')
      );
      const membersList = membersSnap.docs.map((d) => ({
        ...(d.data() as Member),
        id: d.id,
      }));
      // Sort newest first
      membersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMembers(membersList);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    if (!fullName.trim() || !phone.trim()) {
      showToast('Please provide a full name and contact phone', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const memberId = 'mem_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const prefix = currentBusiness.category.toUpperCase().slice(0, 3);
      const count = members.length + 1;
      const memberCode = `${prefix}-${String(count).padStart(3, '0')}`;

      // Calculate plan expiry date
      const assignedPlan = plans.find((p) => p.id === selectedPlanId);
      const monthsToAdd = assignedPlan ? assignedPlan.durationMonths : 1;
      const expiry = new Date(joinDate);
      expiry.setMonth(expiry.getMonth() + monthsToAdd);
      const planEndDate = expiry.toISOString().split('T')[0];

      const nowIso = new Date().toISOString();

      const newMember: Member = {
        id: memberId,
        businessId: currentBusiness.id,
        memberCode,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        status: 'active',
        joinDate,
        planId: assignedPlan?.id,
        planName: assignedPlan?.name || 'Standard Plan',
        planEndDate,
        emergencyContact: emergencyContact.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // 1. Save Member in Firestore
      await setDoc(doc(db, 'businesses', currentBusiness.id, 'members', memberId), newMember);

      // 2. Generate Initial Invoice in Firestore
      if (assignedPlan) {
        const invoiceId = 'inv_' + Math.random().toString(36).substring(2, 9);
        const invoiceNumber = `INV-${String(count).padStart(4, '0')}`;
        const newInvoice: Invoice = {
          id: invoiceId,
          businessId: currentBusiness.id,
          invoiceNumber,
          memberId,
          memberName: fullName.trim(),
          planId: assignedPlan.id,
          planName: assignedPlan.name,
          amount: assignedPlan.price,
          paidAmount: 0,
          balance: assignedPlan.price,
          status: 'unpaid',
          dueDate: planEndDate,
          description: `Initial ${assignedPlan.name} for ${fullName.trim()}`,
          createdAt: nowIso,
        };
        await setDoc(doc(db, 'businesses', currentBusiness.id, 'invoices', invoiceId), newInvoice);
      }

      setMembers((prev) => [newMember, ...prev]);
      showToast(`${labels.memberSingular} "${fullName}" registered successfully!`, 'success');
      setIsAddModalOpen(false);

      // Reset form
      setFullName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setEmergencyContact('');
    } catch (err: unknown) {
      console.error('Error adding member:', err);
      const e = err as Error;
      showToast(e.message || 'Failed to add member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (id: string, name: string) => {
    if (!currentBusiness) return;
    if (!window.confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'businesses', currentBusiness.id, 'members', id));
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (selectedMember?.id === id) setSelectedMember(null);
      showToast(`Removed ${labels.memberSingular.toLowerCase()} record.`, 'info');
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to delete member', 'error');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (members.length === 0) {
      showToast('No records to export', 'info');
      return;
    }

    const headers = ['Member Code', 'Full Name', 'Phone', 'Email', 'Status', 'Plan', 'Join Date', 'Expiry Date'];
    const rows = members.map((m) => [
      m.memberCode,
      `"${m.fullName}"`,
      m.phone,
      m.email || '',
      m.status,
      `"${m.planName || ''}"`,
      m.joinDate,
      m.planEndDate || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentBusiness?.name || 'members'}_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV roster successfully', 'success');
  };

  // Filtered List
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{labels.memberPlural} Management</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full tabular-nums">
              {members.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, enroll new {labels.memberPlural.toLowerCase()}, and track subscription validities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={exportToCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add {labels.memberSingular}
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search by name, phone, or ${labels.memberSingular.toLowerCase()} code...`}
            className="w-full md:max-w-md"
          />

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium overflow-x-auto">
            {(['all', 'active', 'expired', 'pending'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap capitalize ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {st === 'all' ? `All (${members.length})` : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title={`No ${labels.memberPlural.toLowerCase()} found`}
            description={
              searchQuery || statusFilter !== 'all'
                ? 'No records match your active search or filters. Try adjusting your parameters.'
                : `Get started by registering your first ${labels.memberSingular.toLowerCase()} into the business database.`
            }
            actionLabel={!searchQuery && statusFilter === 'all' ? `Add First ${labels.memberSingular}` : undefined}
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Code &amp; Name</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Assigned Plan</th>
                  <th className="px-6 py-3.5">Validity / Expiry</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold flex items-center justify-center shrink-0">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {member.memberCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {member.phone}
                      </div>
                      {member.email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {member.email}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {member.planName || 'Standard'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Joined: {member.joinDate}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="tabular-nums font-medium text-slate-800 dark:text-slate-200">
                        {member.planEndDate || 'Ongoing'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {member.planEndDate ? `Expires ${member.planEndDate}` : 'Open ended'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="View Details"
                          onClick={() => setSelectedMember(member)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteMember(member.id, member.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title={`Register New ${labels.memberSingular}`}
        description={`Add a new ${labels.memberSingular.toLowerCase()} to ${currentBusiness?.name}. An initial invoice will be generated automatically.`}
        maxWidth="lg"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assign {labels.planSingular} Package
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.durationMonths} Months) — {currentBusiness?.currency} {p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact (Optional)
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Parent / Spouse phone"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Staff Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Goal: Weight loss / Batch A"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
              Register {labels.memberSingular}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Member Profile Drawer Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={selectedMember.fullName}
          description={`${labels.memberSingular} Profile & Membership Record (${selectedMember.memberCode})`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Header profile badge */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedMember.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedMember.fullName}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{selectedMember.memberCode}</span>
                    <span>•</span>
                    <span>Joined {selectedMember.joinDate}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={selectedMember.status} size="md" />
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 font-medium">Assigned Plan</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {selectedMember.planName || 'Standard'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 font-medium">Valid Until</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {selectedMember.planEndDate || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 font-medium">Phone</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {selectedMember.phone}
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {selectedMember.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedMember.email}</span>
                </div>
              )}
              {selectedMember.emergencyContact && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Emergency: {selectedMember.emergencyContact}</span>
                </div>
              )}
              {selectedMember.notes && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg text-slate-700 dark:text-slate-300">
                  <strong>Notes:</strong> {selectedMember.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteMember(selectedMember.id, selectedMember.fullName)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Record
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                >
                  Close
                </Button>
                {onSelectMemberForPayment && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onSelectMemberForPayment(selectedMember);
                      setSelectedMember(null);
                    }}
                  >
                    Collect Payment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
