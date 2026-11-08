import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Button, Badge } from '../common/UIComponents.tsx';
import { UserRole } from '../../types/index.ts';
import {
  Building2,
  ChevronDown,
  Plus,
  LogOut,
  User,
  Shield,
  Layers,
  Sparkles,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { currentUser, profile, activeRole, simulateRole, signInWithGoogle, logout, isSuperAdmin } =
    useAuth();
  const { currentBusiness, businesses, selectBusiness, setIsRegisterModalOpen, labels } = useTenant();

  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Tenant Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Tenant Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBusinessDropdownOpen(!businessDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left"
          >
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentBusiness ? currentBusiness.name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div className="max-w-[140px] sm:max-w-[200px] truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {currentBusiness ? currentBusiness.name : 'Select Business'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                {currentBusiness ? `${labels.categoryName}` : 'No Business'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {businessDropdownOpen && (
            <div
              className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95"
              onClick={() => setBusinessDropdownOpen(false)}
            >
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Your Registered Businesses ({businesses.length})
              </div>

              {businesses.length === 0 ? (
                <div className="px-3.5 py-3 text-xs text-slate-500 text-center">
                  No businesses found. Create your first center!
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => selectBusiness(b)}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition ${
                        currentBusiness?.id === b.id ? 'bg-blue-50/70 border-l-3 border-blue-600' : ''
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-semibold text-slate-900 truncate">{b.name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {b.category} • {b.subscriptionPlan}
                        </div>
                      </div>
                      {currentBusiness?.id === b.id && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  Register New Business
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Category Badge */}
        {currentBusiness && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Tracking: <strong className="text-slate-800">{labels.memberPlural}</strong> &{' '}
              <strong className="text-slate-800">{labels.planPlural}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right: Role Simulation, User Profile & Sign-In */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentUser ? (
          <>
            {/* Role Simulation Switcher (Essential for Phase 1 testing) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {activeRole.replace('_', ' ')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in"
                  onClick={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Test RBAC Roles
                  </div>
                  {(['owner', 'staff', 'member', 'super_admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => simulateRole(r)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                        activeRole === r ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span className="capitalize">{r.replace('_', ' ')}</span>
                      {activeRole === r && <span className="text-[10px] text-blue-600">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
                {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {profile?.displayName}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {profile?.email}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={signInWithGoogle}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Sign In with Google
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
