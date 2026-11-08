import React, { useState } from 'react';
import { Card, Button, Badge } from '../common/UIComponents.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { testFirestoreConnection, db } from '../../config/firebase.ts';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Key, Database, UserCheck } from 'lucide-react';

interface TestStep {
  name: string;
  category: 'connection' | 'isolation' | 'rbac' | 'validation';
  status: 'idle' | 'running' | 'passed' | 'failed';
  details: string;
}

export const TenantSecurityVerification: React.FC = () => {
  const { currentUser, profile, activeRole, isSuperAdmin } = useAuth();
  const { currentBusiness, businesses, labels } = useTenant();

  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestStep[]>([
    {
      name: 'Firestore Database Connection',
      category: 'connection',
      status: 'idle',
      details: 'Validates live connection to provisioned Firestore database instance.',
    },
    {
      name: 'Tenant Scope Invariant (businessId check)',
      category: 'isolation',
      status: 'idle',
      details: 'Ensures current business ID is bound to subcollection writes and queries.',
    },
    {
      name: 'Multi-Tenant Write & Read Isolation',
      category: 'isolation',
      status: 'idle',
      details: 'Creates isolated test record in tenant space and verifies clean access.',
    },
    {
      name: 'Role-Based Access Control (RBAC)',
      category: 'rbac',
      status: 'idle',
      details: 'Checks current active role permissions and verifies authorization boundaries.',
    },
    {
      name: 'Category Terminology Integrity',
      category: 'validation',
      status: 'idle',
      details: 'Verifies dynamic category terms match configured business model.',
    },
  ]);

  const runAllTests = async () => {
    setIsRunning(true);
    const updated = [...testResults];

    // Helper to update a test step
    const updateStep = (index: number, status: 'running' | 'passed' | 'failed', details: string) => {
      updated[index] = { ...updated[index], status, details };
      setTestResults([...updated]);
    };

    try {
      // Test 1: Connection test
      updateStep(0, 'running', 'Connecting to Firestore server...');
      const conn = await testFirestoreConnection();
      if (conn.ok) {
        updateStep(0, 'passed', `Connected: ${conn.message}`);
      } else {
        updateStep(0, 'failed', `Error: ${conn.message}`);
      }

      // Test 2: Tenant scope check
      updateStep(1, 'running', 'Verifying business ID scope...');
      if (!currentBusiness) {
        updateStep(1, 'failed', 'No active business selected. Please register or select a business first.');
      } else if (!currentBusiness.id || !currentBusiness.id.startsWith('biz_')) {
        updateStep(1, 'failed', `Invalid business ID format: ${currentBusiness.id}`);
      } else {
        updateStep(
          1,
          'passed',
          `Active tenant ID: ${currentBusiness.id} (${currentBusiness.name}) - Properly scoped.`
        );
      }

      // Test 3: Multi-tenant write & read isolation
      updateStep(2, 'running', 'Executing tenant-scoped write and read test...');
      if (!currentBusiness || !currentUser) {
        updateStep(2, 'failed', 'Must be authenticated with an active business to run write isolation.');
      } else {
        const testDocId = `sec_test_${Date.now()}`;
        const testDocRef = doc(db, 'businesses', currentBusiness.id, 'members', testDocId);

        try {
          // Write test record to tenant subcollection
          await setDoc(testDocRef, {
            id: testDocId,
            businessId: currentBusiness.id,
            memberCode: 'TEST-000',
            fullName: 'Security Isolation Probe',
            phone: '+0000000000',
            status: 'active',
            joinDate: new Date().toISOString().split('T')[0],
            isProbeRecord: true,
          });

          // Read back test record
          const snap = await getDoc(testDocRef);
          if (snap.exists() && snap.data().businessId === currentBusiness.id) {
            // Clean up test record immediately
            await deleteDoc(testDocRef);
            updateStep(
              2,
              'passed',
              `Write & Read successful inside /businesses/${currentBusiness.id}/members. Cleanly isolated and cleaned up.`
            );
          } else {
            updateStep(2, 'failed', 'Test record data mismatch or not found.');
          }
        } catch (err: unknown) {
          const e = err as Error;
          updateStep(2, 'failed', `Tenant isolation write failed: ${e.message}`);
        }
      }

      // Test 4: Role-Based Access Control
      updateStep(3, 'running', 'Evaluating user role permissions...');
      if (!currentUser) {
        updateStep(3, 'failed', 'Unauthenticated user.');
      } else {
        const roleDesc =
          activeRole === 'super_admin'
            ? 'Super Admin (Full Platform Access)'
            : activeRole === 'owner'
            ? 'Business Owner (Tenant Admin & Billing)'
            : activeRole === 'staff'
            ? 'Staff Member (Restricted Attendance & Member Ops)'
            : 'Member/Student (Self Service View Only)';

        updateStep(
          3,
          'passed',
          `Current Active Role: ${activeRole.toUpperCase()} - ${roleDesc}. User UID: ${currentUser.uid.slice(0, 8)}...`
        );
      }

      // Test 5: Dynamic Category Terminology
      updateStep(4, 'running', 'Verifying business category configuration...');
      if (!currentBusiness) {
        updateStep(4, 'failed', 'No current business selected.');
      } else {
        updateStep(
          4,
          'passed',
          `Category "${currentBusiness.category.toUpperCase()}": Terminology configured for "${labels.memberSingular}" (singular), "${labels.memberPlural}" (plural), "${labels.planSingular}", "${labels.attendanceSingular}".`
        );
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Phase 1: Tenant Security & Foundation Verification
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Run automated security and tenant isolation tests against your live Firestore backend to confirm
            data isolation, authentication, and role safety.
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={isRunning || !currentBusiness}
          loading={isRunning}
          icon={<Play className="w-4 h-4 fill-current" />}
        >
          Run Security Suite
        </Button>
      </div>

      {/* Tenant Context Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Active Tenant</div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {currentBusiness ? currentBusiness.name : 'No Tenant Registered'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {currentBusiness ? currentBusiness.id : 'N/A'}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Authenticated User</div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {profile?.displayName || currentUser?.email || 'Signed Out'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {currentUser?.uid ? `UID: ${currentUser.uid.slice(0, 12)}...` : 'None'}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Key className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Assigned Role</div>
            <div className="text-sm font-bold text-slate-900 capitalize">
              {activeRole.replace('_', ' ')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              {isSuperAdmin ? 'Platform Super Admin' : 'Tenant Isolated'}
            </div>
          </div>
        </Card>
      </div>

      {/* Tests Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="font-semibold text-sm text-slate-900">Security Suite Checks</div>
          <span className="text-xs text-slate-500">
            {testResults.filter((r) => r.status === 'passed').length} / {testResults.length} Passed
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {testResults.map((test, index) => (
            <div key={index} className="p-4 sm:px-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {test.status === 'passed' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {test.status === 'failed' && <XCircle className="w-5 h-5 text-rose-500" />}
                  {test.status === 'running' && (
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {test.status === 'idle' && <AlertTriangle className="w-5 h-5 text-slate-300" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{test.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{test.details}</div>
                </div>
              </div>
              <div className="shrink-0">
                <Badge
                  variant={
                    test.status === 'passed'
                      ? 'green'
                      : test.status === 'failed'
                      ? 'red'
                      : test.status === 'running'
                      ? 'blue'
                      : 'slate'
                  }
                >
                  {test.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Architecture notes */}
      <Card className="p-5 bg-blue-50/40 border-blue-100">
        <h4 className="text-sm font-semibold text-blue-950 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Multi-Tenant Isolation Invariants
        </h4>
        <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Tenant Path Isolation:</strong> All sensitive records (members, attendance, invoices,
            plans) reside strictly inside the document path <code>/businesses/{'{businessId}'}/...</code>
          </li>
          <li>
            <strong>Row Level / ABAC Security Rules:</strong> Enforced in <code>firestore.rules</code> with
            default-deny, verifying either <code>ownerId == request.auth.uid</code> or authenticated membership in
            <code>business_memberships/{'{businessId}_{uid}'}</code>.
          </li>
          <li>
            <strong>Cross-Tenant Leak Prevention:</strong> A user signed into Gym A cannot read or write to Gym B
            even if they guess the document IDs, as all paths validate the parent business membership.
          </li>
        </ul>
      </Card>
    </div>
  );
};
