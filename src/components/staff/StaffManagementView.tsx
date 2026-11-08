import React, { useState, useEffect } from 'react';
import { Card, Button, StatusBadge, Modal, EmptyState, useToast, MetricCard } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { StaffMember } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Shield, UserPlus, Users, Key, Trash2, Mail, Phone } from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const { currentBusiness, labels } = useTenant();
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Add staff modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'manager' | 'trainer' | 'receptionist' | 'coach'>('trainer');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'staff'));
      const list = snap.docs.map((d) => ({ ...(d.data() as StaffMember), id: d.id }));
      if (list.length === 0) {
        // Seed default owner staff record if empty
        const defaultStaff: StaffMember = {
          id: 'st_owner',
          businessId: currentBusiness.id,
          name: currentBusiness.ownerEmail.split('@')[0],
          email: currentBusiness.ownerEmail,
          phone: currentBusiness.phone || '+91 98765 00000',
          role: 'manager',
          permissions: ['all', 'manage_members', 'mark_attendance', 'record_payments'],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'businesses', currentBusiness.id, 'staff', 'st_owner'), defaultStaff);
        setStaffList([defaultStaff]);
      } else {
        setStaffList(list);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [currentBusiness]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    if (!name.trim() || !email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const id = 'st_' + Math.random().toString(36).substring(2, 9);
      const newStaff: StaffMember = {
        id,
        businessId: currentBusiness.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+91 00000 00000',
        role,
        permissions: role === 'manager' ? ['all'] : ['mark_attendance', 'view_members'],
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'businesses', currentBusiness.id, 'staff', id), newStaff);
      setStaffList((prev) => [newStaff, ...prev]);
      showToast(`Added staff member "${name}"`, 'success');
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to add staff', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (!currentBusiness) return;
    if (!window.confirm(`Remove staff access for ${staffName}?`)) return;

    try {
      await deleteDoc(doc(db, 'businesses', currentBusiness.id, 'staff', id));
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      showToast(`Removed ${staffName} from staff roster.`, 'info');
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to remove staff', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Staff &amp; Operations Team</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage front-desk attendants, coaches/trainers, managers, and operational role permissions.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          icon={<UserPlus className="w-3.5 h-3.5" />}
        >
          Add Staff Member
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Name &amp; Role</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5">Permissions</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">
                      {staff.name}
                    </div>
                    <span className="capitalize text-[11px] font-medium text-blue-600 dark:text-blue-400">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>{staff.email}</div>
                    <div className="text-[11px] text-slate-400">{staff.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.map((p) => (
                        <span key={p} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={staff.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="text-xs text-slate-400 hover:text-rose-600 transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Invite New Staff Member"
        description="Assign operational roles and permissions to front-desk attendants or instructors."
        maxWidth="md"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikram Seth"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vikram@gym.com"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 11223"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role &amp; Responsibilities
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
            >
              <option value="trainer">Trainer / Fitness Instructor</option>
              <option value="receptionist">Front Desk / Receptionist</option>
              <option value="manager">Operations Manager (Full Access)</option>
              <option value="coach">Head Coach / Specialist</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Add Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
