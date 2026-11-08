import React from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Building,
  Settings,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';

export type NavigationTab =
  | 'overview'
  | 'security'
  | 'members'
  | 'attendance'
  | 'plans'
  | 'superadmin'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { currentBusiness, labels } = useTenant();
  const { activeRole, isSuperAdmin } = useAuth();

  const navItems = [
    {
      id: 'overview' as NavigationTab,
      label: 'Phase 1 Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: 'Active',
      phase: 'Phase 1',
    },
    {
      id: 'security' as NavigationTab,
      label: 'Security & Isolation',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: 'Verified',
      phase: 'Phase 1',
    },
    {
      id: 'superadmin' as NavigationTab,
      label: 'Super Admin Console',
      icon: <Shield className="w-4 h-4" />,
      badge: 'Platform',
      adminOnly: true,
      phase: 'Platform',
    },
    {
      id: 'members' as NavigationTab,
      label: labels.memberPlural,
      icon: <Users className="w-4 h-4" />,
      badge: 'Phase 2',
      phase: 'Next',
    },
    {
      id: 'attendance' as NavigationTab,
      label: 'Attendance & QR',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: 'Phase 3',
      phase: 'Upcoming',
    },
    {
      id: 'plans' as NavigationTab,
      label: `${labels.planPlural} & Fees`,
      icon: <CreditCard className="w-4 h-4" />,
      badge: 'Phase 4',
      phase: 'Upcoming',
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Business Settings',
      icon: <Settings className="w-4 h-4" />,
      phase: 'Config',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              ApexBusiness <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">SaaS</span>
            </div>
            <div className="text-[10px] text-slate-400">Multi-Tenant Platform</div>
          </div>
        </div>

        {/* Current Tenant Badge */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Active Tenant
          </div>
          <div className="text-xs font-semibold text-white mt-0.5 truncate">
            {currentBusiness ? currentBusiness.name : 'No business selected'}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] text-slate-400 capitalize">
              {currentBusiness ? `${labels.categoryName}` : 'Registration required'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Core Modules
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : item.badge === 'Active' || item.badge === 'Verified'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>SaaS Architecture:</span>
            <span className="text-white font-medium">Tenant Isolated</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Active Role:</span>
            <span className="text-blue-400 font-medium capitalize">{activeRole.replace('_', ' ')}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
