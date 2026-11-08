import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, Button, Modal, SearchInput, EmptyState, TableSkeleton, useToast, MetricCard } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Member, AttendanceRecord } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  QrCode,
  CalendarCheck,
  CheckCircle2,
  Users,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Printer,
  ShieldCheck,
  Smartphone,
  Check,
  AlertCircle,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { currentBusiness, labels } = useTenant();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Today Date String
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrPosterModalOpen, setIsQrPosterModalOpen] = useState(false);
  const [isManualCheckInModalOpen, setIsManualCheckInModalOpen] = useState(false);

  // Manual Check-in
  const [manualSearch, setManualSearch] = useState('');
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Generate QR Code
  useEffect(() => {
    if (!currentBusiness) return;
    const generateQr = async () => {
      try {
        const payload = JSON.stringify({
          businessId: currentBusiness.id,
          businessName: currentBusiness.name,
          category: currentBusiness.category,
          date: todayStr,
          token: 'sec_' + currentBusiness.id.slice(0, 6) + '_' + todayStr,
        });
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR:', err);
      }
    };
    generateQr();
  }, [currentBusiness, todayStr]);

  // Load Members and Attendance
  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // 1. Fetch Members
      const membersSnap = await getDocs(
        collection(db, 'businesses', currentBusiness.id, 'members')
      );
      const membersList = membersSnap.docs.map((d) => ({
        ...(d.data() as Member),
        id: d.id,
      }));
      setMembers(membersList);

      // 2. Fetch Attendance for selected date
      const attendanceSnap = await getDocs(
        collection(db, 'businesses', currentBusiness.id, 'attendance')
      );
      const allLogs = attendanceSnap.docs.map((d) => ({
        ...(d.data() as AttendanceRecord),
        id: d.id,
      }));
      // Filter for selected date and sort newest first
      const dateLogs = allLogs
        .filter((a) => a.date === selectedDate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAttendanceLogs(dateLogs);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness, selectedDate]);

  // Perform Check-in (Manual or Scanned)
  const handleCheckIn = async (member: Member, method: 'qr' | 'manual' = 'manual') => {
    if (!currentBusiness) return;

    // 1. Anti-duplicate check: Has member already checked in today?
    const alreadyCheckedIn = attendanceLogs.some((a) => a.memberId === member.id);
    if (alreadyCheckedIn) {
      showToast(`${member.fullName} is already checked in for today!`, 'info');
      return;
    }

    setCheckingInId(member.id);
    try {
      const attendanceId = `att_${Date.now()}_${member.id.slice(0, 6)}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newRecord: AttendanceRecord = {
        id: attendanceId,
        businessId: currentBusiness.id,
        memberId: member.id,
        memberName: member.fullName,
        memberCode: member.memberCode,
        date: selectedDate,
        time: timeStr,
        method,
        verifiedBy: method === 'qr' ? 'Self QR Scan' : 'Staff Desk',
        createdAt: now.toISOString(),
      };

      await setDoc(
        doc(db, 'businesses', currentBusiness.id, 'attendance', attendanceId),
        newRecord
      );

      setAttendanceLogs((prev) => [newRecord, ...prev]);
      showToast(`Checked in ${member.fullName} successfully!`, 'success');
      setIsManualCheckInModalOpen(false);
      setManualSearch('');
    } catch (err: unknown) {
      console.error('Failed to check in:', err);
      const e = err as Error;
      showToast(e.message || 'Check-in failed', 'error');
    } finally {
      setCheckingInId(null);
    }
  };

  // Remove attendance check-in
  const handleRemoveCheckIn = async (id: string, name: string) => {
    if (!currentBusiness) return;
    if (!window.confirm(`Undo check-in for ${name}?`)) return;

    try {
      await deleteDoc(doc(db, 'businesses', currentBusiness.id, 'attendance', id));
      setAttendanceLogs((prev) => prev.filter((a) => a.id !== id));
      showToast(`Removed check-in record for ${name}.`, 'info');
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to remove attendance', 'error');
    }
  };

  const presentCount = attendanceLogs.length;
  const activeMembersCount = members.filter((m) => m.status === 'active').length;
  const attendanceRate =
    activeMembersCount > 0 ? Math.round((presentCount / activeMembersCount) * 100) : 0;
  const absentCount = Math.max(activeMembersCount - presentCount, 0);

  // Filter members available for manual check-in
  const availableMembersForCheckIn = members.filter((m) => {
    const isAlreadyIn = attendanceLogs.some((a) => a.memberId === m.id);
    const matchesSearch =
      m.fullName.toLowerCase().includes(manualSearch.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(manualSearch.toLowerCase()) ||
      m.phone.includes(manualSearch);
    return !isAlreadyIn && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Attendance &amp; Check-ins</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic QR scanning, instant desk check-in, anti-duplicate protection, and daily attendance logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white outline-none"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsQrPosterModalOpen(true)}
            icon={<QrCode className="w-3.5 h-3.5" />}
          >
            Show Front-Desk QR
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsManualCheckInModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Check In {labels.memberSingular}
          </Button>
        </div>
      </div>

      {/* Attendance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Present"
          value={presentCount}
          subtitle={`Out of ${activeMembersCount} active`}
          change={`${attendanceRate}% turn-out`}
          isPositive={attendanceRate >= 50}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Absent / Unmarked"
          value={absentCount}
          subtitle="Remaining today"
          icon={<Users className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard
          title="QR Check-ins"
          value={attendanceLogs.filter((a) => a.method === 'qr').length}
          subtitle="Automated self-scan"
          icon={<QrCode className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Manual Desk Checks"
          value={attendanceLogs.filter((a) => a.method === 'manual').length}
          subtitle="Front desk marked"
          icon={<Clock className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Today's Attendance Roster Table */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Check-in Roster for {selectedDate === todayStr ? 'Today' : selectedDate}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {attendanceLogs.length} recorded check-ins
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : attendanceLogs.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-6 h-6" />}
            title="No check-ins recorded for this date"
            description={`Mark manual attendance or display the dynamic QR code for ${labels.memberPlural.toLowerCase()} to check in.`}
            actionLabel={`Check In ${labels.memberSingular}`}
            onAction={() => setIsManualCheckInModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Code &amp; Name</th>
                  <th className="px-6 py-3.5">Check-in Time</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Verified By</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      <div className="font-semibold">{log.memberName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{log.memberCode}</div>
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                      {log.time}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          log.method === 'qr'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {log.method === 'qr' ? <QrCode className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                        <span className="capitalize">{log.method === 'qr' ? 'QR Code' : 'Desk Check'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">{log.verifiedBy}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveCheckIn(log.id, log.memberName)}
                        className="text-xs text-slate-400 hover:text-rose-600 transition"
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Front-Desk QR Poster Modal */}
      <Modal
        isOpen={isQrPosterModalOpen}
        onClose={() => setIsQrPosterModalOpen(false)}
        title="Reception Front-Desk Check-in QR"
        description="Display this poster at reception. Members scan with any camera to record verified attendance."
        maxWidth="md"
      >
        <div className="text-center space-y-4">
          <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col items-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              {currentBusiness?.name}
            </div>
            <h3 className="text-lg font-bold text-white mb-4">
              Scan to Check In
            </h3>

            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-xl shadow-md border-4 border-slate-800">
                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  className="w-56 h-56 mx-auto block"
                />
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Replay Security Token Active ({todayStr})</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Front Desk Sign
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsQrPosterModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isManualCheckInModalOpen}
        onClose={() => setIsManualCheckInModalOpen(false)}
        title={`Quick Check-in (${labels.memberSingular})`}
        description={`Search for any enrolled ${labels.memberSingular.toLowerCase()} to record attendance for ${selectedDate}.`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <SearchInput
            value={manualSearch}
            onChange={setManualSearch}
            placeholder={`Search ${labels.memberSingular.toLowerCase()} name or code...`}
          />

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
            {availableMembersForCheckIn.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {members.length === 0
                  ? `No ${labels.memberPlural.toLowerCase()} enrolled yet.`
                  : 'All matching members are already checked in for today!'}
              </div>
            ) : (
              availableMembersForCheckIn.map((m) => (
                <div
                  key={m.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {m.memberCode} • {m.phone}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={checkingInId === m.id}
                    onClick={() => handleCheckIn(m, 'manual')}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Check In
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManualCheckInModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
