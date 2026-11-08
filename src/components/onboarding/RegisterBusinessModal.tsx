import React, { useState } from 'react';
import { Modal, Button } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { auth } from '../../config/firebase.ts';
import { BusinessCategory } from '../../types/index.ts';
import { BUSINESS_CATEGORIES } from '../../config/businessCategories.ts';
import { Dumbbell, GraduationCap, BookOpen, Activity, Music, Trophy, Sparkles, AlertCircle } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  gym: <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  tuition: <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
  academy: <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
  yoga: <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  dance: <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  sports: <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
};

export const RegisterBusinessModal: React.FC = () => {
  const { isRegisterModalOpen, setIsRegisterModalOpen, registerBusiness } = useTenant();
  const { currentUser, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('gym');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [primaryBranchName, setPrimaryBranchName] = useState('Main Center');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a business name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!currentUser && !auth.currentUser) {
        await signInWithGoogle();
        if (!auth.currentUser) {
          setError('Google Sign-In is required to associate and secure your business workspace.');
          return;
        }
      }

      await registerBusiness({
        name: name.trim(),
        category,
        phone: phone.trim(),
        address: address.trim(),
        currency,
        primaryBranchName: primaryBranchName.trim() || 'Main Center',
      });

      // reset
      setName('');
      setPhone('');
      setAddress('');
      setIsRegisterModalOpen(false);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to register business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isRegisterModalOpen}
      onClose={() => !loading && setIsRegisterModalOpen(false)}
      title="Register New Business Center"
      description="Configure your business category, default pricing plans, and multi-tenant workspace."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {!currentUser && !auth.currentUser && (
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                        setError(null);
                      } catch (err) {
                        console.error('Google Sign-In failed:', err);
                      }
                    }}
                  >
                    Sign in with Google
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(BUSINESS_CATEGORIES).map(([catKey, catData]) => {
              const isSelected = category === catKey;
              return (
                <button
                  type="button"
                  key={catKey}
                  onClick={() => setCategory(catKey as BusinessCategory)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 text-blue-950 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 shadow-2xs border border-slate-100 dark:border-slate-700">
                      {categoryIcons[catKey]}
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold leading-snug">
                      {catData.categoryName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tracks {catData.memberPlural.toLowerCase()} &amp; {catData.planPlural.toLowerCase()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Business / Academy Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IronPulse Fitness Gym"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Branch Name
            </label>
            <input
              type="text"
              value={primaryBranchName}
              onChange={(e) => setPrimaryBranchName(e.target.value)}
              placeholder="e.g. Downtown Center"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Center Address / Location
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 42 MG Road, Koramangala, Bengaluru"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Includes an instant <strong>14-day full feature trial</strong> with pre-configured plans and
            automated multi-tenant isolation.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsRegisterModalOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Create Business Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
