import React, { useState, useEffect } from 'react';
import { Card, Button, StatusBadge, Modal, useToast } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { BusinessCategory, Branch } from '../../types/index.ts';
import { BUSINESS_CATEGORIES } from '../../config/businessCategories.ts';
import { db } from '../../config/firebase.ts';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  Settings,
  Building,
  GitBranch,
  Sun,
  Moon,
  Layers,
  Sparkles,
  CreditCard,
  Plus,
  Save,
  Check,
} from 'lucide-react';

export const BusinessSettingsView: React.FC = () => {
  const { currentBusiness, labels, updateBusinessCategory } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(currentBusiness?.name || '');
  const [phone, setPhone] = useState(currentBusiness?.phone || '');
  const [address, setAddress] = useState(currentBusiness?.address || '');
  const [currency, setCurrency] = useState(currentBusiness?.currency || 'INR');
  const [saving, setSaving] = useState(false);

  // Branches State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [submittingBranch, setSubmittingBranch] = useState(false);

  useEffect(() => {
    if (!currentBusiness) return;
    setName(currentBusiness.name);
    setPhone(currentBusiness.phone || '');
    setAddress(currentBusiness.address || '');
    setCurrency(currentBusiness.currency || 'INR');

    const loadBranches = async () => {
      try {
        const snap = await getDocs(
          collection(db, 'businesses', currentBusiness.id, 'branches')
        );
        const list = snap.docs.map((d) => ({ ...(d.data() as Branch), id: d.id }));
        setBranches(list);
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    };
    loadBranches();
  }, [currentBusiness]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'businesses', currentBusiness.id), {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        currency,
        updatedAt: new Date().toISOString(),
      });
      showToast('Business details updated successfully!', 'success');
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    if (!branchName.trim()) {
      showToast('Branch name is required', 'error');
      return;
    }

    setSubmittingBranch(true);
    try {
      const branchId = 'br_' + Math.random().toString(36).substring(2, 9);
      const newBranch: Branch = {
        id: branchId,
        businessId: currentBusiness.id,
        name: branchName.trim(),
        isPrimary: branches.length === 0,
        address: branchAddress.trim() || undefined,
        phone: branchPhone.trim() || undefined,
      };

      await setDoc(
        doc(db, 'businesses', currentBusiness.id, 'branches', branchId),
        newBranch
      );
      setBranches((prev) => [...prev, newBranch]);
      showToast(`Branch "${branchName}" added!`, 'success');
      setIsAddBranchModalOpen(false);
      setBranchName('');
      setBranchAddress('');
      setBranchPhone('');
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to add branch', 'error');
    } finally {
      setSubmittingBranch(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Business Settings &amp; Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage business category terminology, multi-branch network, currency, and visual appearance.
        </p>
      </div>

      {/* General Settings Form */}
      <Card className="p-6">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-500" />
          Business Profile
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business / Center Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operating Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (British Pound)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Center location"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" loading={saving} icon={<Save className="w-3.5 h-3.5" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Dynamic Category Terminology Switcher */}
      <Card className="p-6">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Configurable Business Category (Universal Engine)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          The SaaS platform uses a shared software architecture. Select your business type to instantly adapt all terminology, attendance rules, and fee structures.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(BUSINESS_CATEGORIES) as BusinessCategory[]).map((cat) => {
            const isSelected = currentBusiness?.category === cat;
            const item = BUSINESS_CATEGORIES[cat];
            return (
              <button
                key={cat}
                onClick={async () => {
                  await updateBusinessCategory(cat);
                  showToast(`Switched terminology to ${item.categoryName}!`, 'success');
                }}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold">{item.categoryName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Tracks {item.memberPlural} &amp; {item.planPlural}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Multi-Branch Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-500" />
              Branches &amp; Locations Network
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-branch support for chain locations and facilities
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddBranchModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Branch
          </Button>
        </div>

        <div className="space-y-2">
          {branches.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{b.name}</span>
                  {b.isPrimary && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                      Primary Branch
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {b.address || 'Address not configured'}
                </div>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">{b.id}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Visual Theme Appearance */}
      <Card className="p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Interface Theme Appearance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between modern high-contrast Light mode and refined Linear Dark mode.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2 text-xs font-semibold"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Switch to Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Switch to Light</span>
            </>
          )}
        </button>
      </Card>

      {/* Add Branch Modal */}
      <Modal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        title="Add New Business Branch"
        description="Expand your multi-branch operations with an additional location."
        maxWidth="md"
      >
        <form onSubmit={handleAddBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Koramangala Center"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / Address
            </label>
            <input
              type="text"
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              placeholder="e.g. 5th Block, Koramangala"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value)}
              placeholder="+91 98765 00000"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddBranchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submittingBranch}>
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
