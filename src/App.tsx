import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { TenantProvider, useTenant } from './context/TenantContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider } from './components/common/DesignSystem.tsx';
import { AppShell, ActiveTab } from './components/layout/AppShell.tsx';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard.tsx';
import { MemberManagementView } from './components/members/MemberManagementView.tsx';
import { AttendanceView } from './components/attendance/AttendanceView.tsx';
import { BillingAndPaymentsView } from './components/billing/BillingAndPaymentsView.tsx';
import { WhatsAppNotificationsView } from './components/notifications/WhatsAppNotificationsView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { StaffManagementView } from './components/staff/StaffManagementView.tsx';
import { BusinessSettingsView } from './components/settings/BusinessSettingsView.tsx';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard.tsx';
import { RegisterBusinessModal } from './components/onboarding/RegisterBusinessModal.tsx';
import { Button } from './components/common/DesignSystem.tsx';
import { Member } from './types/index.ts';
import { auth } from './config/firebase.ts';
import { Dumbbell, Plus, Sparkles, Building2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, loading: authLoading, signInWithGoogle } = useAuth();
  const { currentBusiness, loadingBusinesses, setIsRegisterModalOpen, registerBusiness, labels } =
    useTenant();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [creatingSample, setCreatingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  // Quick action from dashboard to record payment for a member
  const handleSelectMemberForPayment = (member: Member) => {
    setActiveTab('plans');
  };

  const handleCreateSampleGym = async () => {
    setSampleError(null);
    setCreatingSample(true);
    try {
      if (!currentUser && !auth.currentUser) {
        await signInWithGoogle();
        if (!auth.currentUser) {
          setSampleError('Please complete Google Sign-In to create your business workspace.');
          return;
        }
      }

      await registerBusiness({
        name: 'IronPulse Fitness & Gym',
        category: 'gym',
        phone: '+91 98765 43210',
        address: '84 Indiranagar 100ft Road, Bengaluru, Karnataka',
        currency: 'INR',
        primaryBranchName: 'Main Indiranagar Center',
      });
    } catch (err: unknown) {
      console.error('Failed to create sample business:', err);
      const e = err as Error;
      setSampleError(e.message || 'Failed to create sample business');
    } finally {
      setCreatingSample(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Initializing ApexBusiness SaaS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentTab={activeTab} onSelectTab={setActiveTab}>
      {/* Onboarding Banner if no business is registered yet */}
      {!loadingBusinesses && !currentBusiness && (
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Quick Onboarding
            </div>
            <h3 className="text-lg font-bold text-white">Setup Your Business Workspace</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Initialize your Gym, Tuition Centre, or Academy with isolated Firestore collections,
              automated QR attendance, and customized terminology.
            </p>
            {sampleError && (
              <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center justify-between gap-3">
                <span>{sampleError}</span>
                <button
                  type="button"
                  onClick={() => setSampleError(null)}
                  className="text-rose-200 hover:text-white text-xs underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={creatingSample}
              onClick={handleCreateSampleGym}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-950 bg-white hover:bg-slate-100 active:scale-[0.98] rounded-xl shadow-md border border-white/60 focus:outline-none transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              {creatingSample ? (
                <span className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Dumbbell className="w-4 h-4 text-blue-700" />
              )}
              <span>{creatingSample ? 'Setting up...' : 'Create Sample Gym'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-slate-800/80 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/80 hover:border-slate-600 rounded-xl shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-300" />
              <span>Custom Setup</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Routing */}
      {activeTab === 'dashboard' && (
        <ExecutiveDashboard
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenAddMember={() => setActiveTab('members')}
          onOpenCheckIn={() => setActiveTab('attendance')}
          onOpenRecordPayment={() => setActiveTab('plans')}
        />
      )}

      {activeTab === 'members' && (
        <MemberManagementView onSelectMemberForPayment={handleSelectMemberForPayment} />
      )}

      {activeTab === 'attendance' && <AttendanceView />}

      {activeTab === 'plans' && <BillingAndPaymentsView />}

      {activeTab === 'notifications' && <WhatsAppNotificationsView />}

      {activeTab === 'reports' && <ReportsView />}

      {activeTab === 'staff' && <StaffManagementView />}

      {activeTab === 'settings' && <BusinessSettingsView />}

      {activeTab === 'superadmin' && <SuperAdminDashboard />}

      {/* Business Registration Onboarding Modal */}
      <RegisterBusinessModal />
    </AppShell>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TenantProvider>
            <AppContent />
          </TenantProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
