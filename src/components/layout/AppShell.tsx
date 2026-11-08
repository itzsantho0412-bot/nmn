import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Button } from '../common/DesignSystem.tsx';
import { UserRole } from '../../types/index.ts';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  FileText,
  Shield,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Building,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'members'
  | 'attendance'
  | 'plans'
  | 'notifications'
  | 'reports'
  | 'staff'
  | 'settings'
  | 'superadmin';

interface AppShellProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { currentUser, profile, activeRole, simulateRole, signInWithGoogle, logout, isSuperAdmin } =
    useAuth();
  const { currentBusiness, businesses, selectBusiness, setIsRegisterModalOpen, labels } = useTenant();
  const { theme, toggleTheme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navSections = [
    {
      title: 'Core Workspace',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Executive Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'members' as ActiveTab,
          label: labels.memberPlural,
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'attendance' as ActiveTab,
          label: 'Attendance & QR',
          icon: <CalendarCheck className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Finance & Comms',
      items: [
        {
          id: 'plans' as ActiveTab,
          label: `${labels.planPlural} & Billing`,
          icon: <CreditCard className="w-4 h-4" />,
        },
        {
          id: 'notifications' as ActiveTab,
          label: 'WhatsApp Cloud',
          icon: <MessageSquare className="w-4 h-4" />,
        },
        {
          id: 'reports' as ActiveTab,
          label: 'Reports & Export',
          icon: <FileText className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          id: 'staff' as ActiveTab,
          label: 'Staff & Team',
          icon: <Shield className="w-4 h-4" />,
        },
        {
          id: 'settings' as ActiveTab,
          label: 'Business Settings',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  // If super admin, add platform tab
  if (isSuperAdmin) {
    navSections.push({
      title: 'Platform',
      items: [
        {
          id: 'superadmin' as ActiveTab,
          label: 'Super Admin Console',
          icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
        },
      ],
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Lockup */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                <Building className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    ApexBusiness
                    <span className="text-[10px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono font-medium">
                      SaaS
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentBusiness ? currentBusiness.name : 'Universal Platform'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Tenant Selection Tile */}
          {!sidebarCollapsed && currentBusiness && (
            <div className="p-3 mx-3 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Workspace
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                {currentBusiness.name}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{labels.categoryName}</span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group select-none ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
              <span className="capitalize">{activeRole.replace('_', ' ')}</span>
              <span className="font-mono text-[10px]">{currentBusiness?.currency || 'INR'}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {currentUser && (
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Mobile Toggle & Tenant Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Tenant Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBusinessDropdownOpen(!businessDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition text-left"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentBusiness?.name ? currentBusiness.name.charAt(0).toUpperCase() : 'B'}
                </div>
                <div className="max-w-[130px] sm:max-w-[180px] truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentBusiness ? currentBusiness.name : 'Choose Business'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate capitalize">
                    {currentBusiness ? labels.categoryName : 'No business'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {businessDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95"
                  onClick={() => setBusinessDropdownOpen(false)}
                >
                  <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Centers ({businesses.length})
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => selectBusiness(b)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                          currentBusiness?.id === b.id ? 'bg-blue-50/60 dark:bg-blue-950/40 font-semibold' : ''
                        }`}
                      >
                        <div className="truncate">
                          <div className="text-xs text-slate-900 dark:text-white truncate">{b.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{b.category}</div>
                        </div>
                        {currentBusiness?.id === b.id && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 px-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => setIsRegisterModalOpen(true)}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Register New Center
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Label Badge */}
            {currentBusiness && (
              <span className="hidden md:inline-flex items-center text-xs text-slate-500 dark:text-slate-400">
                Mode: <strong className="ml-1 text-slate-800 dark:text-slate-200">{labels.categoryName}</strong>
              </span>
            )}
          </div>

          {/* Right: Role Simulation, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {activeRole.replace('_', ' ')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in"
                  onClick={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Test RBAC Roles
                  </div>
                  {(['owner', 'staff', 'member', 'super_admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => simulateRole(r)}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 capitalize ${
                        activeRole === r ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{r.replace('_', ' ')}</span>
                      {activeRole === r && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
                  {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {profile?.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {profile?.email}
                  </div>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={signInWithGoogle}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Sign In with Google
              </Button>
            )}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
