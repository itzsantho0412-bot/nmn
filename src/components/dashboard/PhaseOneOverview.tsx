import React, { useState } from 'react';
import { Card, Button, Badge } from '../common/UIComponents.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { BusinessCategory } from '../../types/index.ts';
import { BUSINESS_CATEGORIES } from '../../config/businessCategories.ts';
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
  Sparkles,
  GitBranch,
  Calendar,
  Lock,
  Globe,
  Plus,
} from 'lucide-react';

interface PhaseOneOverviewProps {
  onGoToSecurity: () => void;
  onGoToSuperAdmin: () => void;
}

export const PhaseOneOverview: React.FC<PhaseOneOverviewProps> = ({
  onGoToSecurity,
  onGoToSuperAdmin,
}) => {
  const { currentBusiness, labels, updateBusinessCategory, setIsRegisterModalOpen, businesses } =
    useTenant();
  const { currentUser, profile, activeRole, isSuperAdmin } = useAuth();

  const [switchingCategory, setSwitchingCategory] = useState(false);

  const handleCategorySwitch = async (cat: BusinessCategory) => {
    if (!currentBusiness) return;
    setSwitchingCategory(true);
    try {
      await updateBusinessCategory(cat);
    } finally {
      setSwitchingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero / Phase 1 Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Phase 1 Foundation Operational
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Universal Business SaaS Platform
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Multi-tenant business architecture initialized with real Firestore persistence, isolated
            tenant boundaries, strict security rules, and configurable business categories.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={onGoToSecurity}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Run Security Verification Suite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              icon={<Plus className="w-4 h-4" />}
            >
              Register Another Business
            </Button>
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToSuperAdmin}
                className="bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border-purple-400/30"
              >
                Open Super Admin Console
              </Button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
      </div>

      {/* Active Business Snapshot */}
      {currentBusiness ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Business Tenant
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{currentBusiness.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tenant ID: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-blue-600">{currentBusiness.id}</code>
                </p>
              </div>
              <Badge variant="blue" size="md">
                {labels.categoryName}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">Tracking Entity</span>
                <div className="font-bold text-slate-900 mt-1">{labels.memberPlural}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">Billing Packages</span>
                <div className="font-bold text-slate-900 mt-1">{labels.planPlural}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">Currency</span>
                <div className="font-bold text-slate-900 mt-1">{currentBusiness.currency}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">Plan Status</span>
                <div className="font-bold text-emerald-600 mt-1 capitalize">
                  {currentBusiness.subscriptionPlan} (Active)
                </div>
              </div>
            </div>

            {/* Configurable Terminology Switcher Test */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Live Category &amp; Terminology Transformation Test:
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Switch category on the fly to observe how the shared architecture dynamically transforms all
                terminology, modules, and billing definitions across the SaaS platform.
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(BUSINESS_CATEGORIES) as BusinessCategory[]).map((cat) => {
                  const isCurrent = currentBusiness.category === cat;
                  return (
                    <button
                      key={cat}
                      disabled={switchingCategory}
                      onClick={() => handleCategorySwitch(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {BUSINESS_CATEGORIES[cat].categoryName}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Phase 1 Verification Checklist */}
          <Card className="p-6 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Phase 1 Deliverables
            </h4>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  ✓
                </span>
                <div>
                  <div className="font-semibold text-slate-900">Multi-Tenant Isolation</div>
                  <div className="text-slate-500 text-[11px]">
                    All collections partitioned by <code>businessId</code>.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  ✓
                </span>
                <div>
                  <div className="font-semibold text-slate-900">Firestore Rules Deployed</div>
                  <div className="text-slate-500 text-[11px]">
                    Default deny, tenant membership gates, ABAC.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  ✓
                </span>
                <div>
                  <div className="font-semibold text-slate-900">Authentication &amp; RBAC</div>
                  <div className="text-slate-500 text-[11px]">
                    Super Admin, Business Owner, Staff, Member.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  ✓
                </span>
                <div>
                  <div className="font-semibold text-slate-900">Business Registration</div>
                  <div className="text-slate-500 text-[11px]">
                    Auto-seeds primary branch, owner role, and plans.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  ✓
                </span>
                <div>
                  <div className="font-semibold text-slate-900">Shared Architecture Engine</div>
                  <div className="text-slate-500 text-[11px]">
                    Configurable Gym, Tuition, Academy, Yoga modes.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={onGoToSecurity}
              >
                View Live Security &amp; Tenant Tests
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Business Registered Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Complete the onboarding step by registering your first business (Gym, Tuition Centre, Academy, etc.)
              to initialize its isolated workspace.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsRegisterModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Business Workspace
          </Button>
        </Card>
      )}

      {/* Development Roadmap Cards */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Project Roadmap &amp; Next Phases</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-600 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Phase 1 (Completed)
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-sm text-slate-900">Project Setup &amp; Multi-Tenant</h4>
            <p className="text-xs text-slate-500 mt-1">
              Database architecture, Firebase authentication, tenant isolation, and business registration.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Phase 2 (Ready Next)
              </span>
              <span className="text-xs text-amber-600 font-semibold">Next</span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900">
              {labels.memberSingular} Management &amp; Profiles
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Add, edit, archive members, unique business IDs, photos, phone/email, search and filters.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-slate-300 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phase 3
              </span>
              <span className="text-xs text-slate-400">Upcoming</span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900">Attendance &amp; Dynamic QR Code</h4>
            <p className="text-xs text-slate-500 mt-1">
              QR check-in with tamper protection, manual attendance, daily attendance list &amp; statistics.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-slate-300 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phase 4
              </span>
              <span className="text-xs text-slate-400">Upcoming</span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900">
              {labels.planPlural} &amp; Fee Payments
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Plans, invoices, outstanding balances, cash/UPI receipts, and revenue reports.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-slate-300 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phase 5
              </span>
              <span className="text-xs text-slate-400">Upcoming</span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900">WhatsApp Cloud Notifications</h4>
            <p className="text-xs text-slate-500 mt-1">
              Official WhatsApp Business templates for expiry reminders, fee receipts, and renewal alerts.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-slate-300 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phase 6
              </span>
              <span className="text-xs text-slate-400">Upcoming</span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900">SaaS Billing &amp; Subscription</h4>
            <p className="text-xs text-slate-500 mt-1">
              Starter, Growth, Pro tiers, Razorpay payment gateway integration, and multi-tenant billing.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
