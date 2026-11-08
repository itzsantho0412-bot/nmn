import React, { useState } from 'react';
import { Card, Button, Badge } from '../common/UIComponents.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Business } from '../../types/index.ts';
import { Shield, Building2, Users, DollarSign, Activity, CheckCircle, Search, ExternalLink } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { isSuperAdmin, profile } = useAuth();
  const { businesses, selectBusiness } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || b.subscriptionPlan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const totalTenants = businesses.length;
  const trialTenants = businesses.filter((b) => b.subscriptionPlan === 'trial').length;
  const activeTenants = businesses.filter((b) => b.status === 'active').length;

  // Mock platform MRR based on tier plans (Starter: 299, Growth: 599, Pro: 999)
  const estimatedMRR = businesses.reduce((acc, b) => {
    if (b.subscriptionPlan === 'starter') return acc + 299;
    if (b.subscriptionPlan === 'growth') return acc + 599;
    if (b.subscriptionPlan === 'pro') return acc + 999;
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-purple-100 text-purple-700">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Platform Super Admin Console</h2>
            <Badge variant="purple" size="sm">SUPER ADMIN ONLY</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global view across all registered multi-tenant businesses, platform subscription distribution, and tenant management.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Admin: <span className="font-semibold text-slate-800">{profile?.email || 'loqsandy@gmail.com'}</span>
        </div>
      </div>

      {/* Global SaaS Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Tenants</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalTenants}</div>
          <div className="text-xs text-slate-500 mt-1">Registered businesses</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Accounts</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeTenants}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">100% operational</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Trial Accounts</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{trialTenants}</div>
          <div className="text-xs text-slate-500 mt-1">14-day free trials</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Est. Platform MRR</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">₹{estimatedMRR.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">From active tiers</div>
        </Card>
      </div>

      {/* Tenant Directory & Management */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Registered Businesses & Tenants</h3>
            <p className="text-xs text-slate-500">Live multi-tenant accounts in Firestore</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none bg-white"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-6 py-3">Business Name & Category</th>
                <th className="px-6 py-3">Tenant ID</th>
                <th className="px-6 py-3">Owner Contact</th>
                <th className="px-6 py-3">SaaS Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Switch Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No businesses found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{b.category}</div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500 text-[11px]">{b.id}</td>
                    <td className="px-6 py-3.5">
                      <div>{b.ownerEmail}</div>
                      <div className="text-[11px] text-slate-400">{b.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        variant={
                          b.subscriptionPlan === 'pro'
                            ? 'purple'
                            : b.subscriptionPlan === 'growth'
                            ? 'blue'
                            : b.subscriptionPlan === 'starter'
                            ? 'green'
                            : 'amber'
                        }
                      >
                        {b.subscriptionPlan.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectBusiness(b)}
                        icon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Open Workspace
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
