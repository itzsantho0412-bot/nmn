import React, { useState, useEffect } from 'react';
import { Card, Button, StatusBadge, SearchInput, EmptyState, useToast, MetricCard } from '../common/DesignSystem.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { Member, Invoice, NotificationTemplate } from '../../types/index.ts';
import { db } from '../../config/firebase.ts';
import { collection, getDocs } from 'firebase/firestore';
import {
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

export const WhatsAppNotificationsView: React.FC = () => {
  const { currentBusiness, labels } = useTenant();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<'expiry' | 'due' | 'receipt' | 'welcome'>('expiry');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Sent logs history (stored locally for demo/active session)
  const [sentLogs, setSentLogs] = useState<
    { id: string; memberName: string; phone: string; template: string; sentAt: string }[]
  >([
    {
      id: 'log_1',
      memberName: 'Rahul Sharma',
      phone: '+919876543210',
      template: 'Expiry Reminder',
      sentAt: 'Today at 09:15 AM',
    },
    {
      id: 'log_2',
      memberName: 'Pooja Verma',
      phone: '+919811223344',
      template: 'Fee Payment Receipt',
      sentAt: 'Yesterday at 04:30 PM',
    },
  ]);

  useEffect(() => {
    if (!currentBusiness) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const memSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'members'));
        const memList = memSnap.docs.map((d) => ({ ...(d.data() as Member), id: d.id }));
        setMembers(memList);
        if (memList.length > 0) setSelectedMemberId(memList[0].id);

        const invSnap = await getDocs(collection(db, 'businesses', currentBusiness.id, 'invoices'));
        setInvoices(invSnap.docs.map((d) => ({ ...(d.data() as Invoice), id: d.id })));
      } catch (err) {
        console.error('Error fetching members for notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentBusiness]);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const memberInvoice = invoices.find((i) => i.memberId === selectedMember?.id);

  // Generate Message Text based on template
  const getRenderedMessage = () => {
    if (!selectedMember || !currentBusiness) return '';

    const memberName = selectedMember.fullName;
    const businessName = currentBusiness.name;
    const expiryDate = selectedMember.planEndDate || 'in 7 days';
    const amount = memberInvoice ? `${currentBusiness.currency} ${memberInvoice.balance.toLocaleString()}` : `${currentBusiness.currency} 2,500`;

    if (selectedTemplateId === 'expiry') {
      return `Hello ${memberName}!\n\nYour ${labels.categoryName} membership is expiring on ${expiryDate}.\n\nYour renewal fee is ${amount}.\n\nPlease renew your membership to continue your journey uninterrupted.\n\nThank you,\n${businessName}`;
    }

    if (selectedTemplateId === 'due') {
      return `Dear ${memberName},\n\nThis is a friendly reminder that your ${labels.feeSingular} of ${amount} for ${currentBusiness.name} is currently due.\n\nYou can pay directly via UPI or visit the front desk.\n\nBest regards,\n${businessName}`;
    }

    if (selectedTemplateId === 'receipt') {
      return `Hello ${memberName}!\n\nThank you for your payment at ${businessName}. Your fee transaction has been verified and applied to your account.\n\nReceipt Reference: INV-${selectedMember.memberCode}\n\nKeep up the great work!\n${businessName}`;
    }

    return `Welcome to ${businessName}, ${memberName}!\n\nYour ${labels.memberSingular} account is now active (${selectedMember.memberCode}). You can use your mobile number to check in at our reception.\n\nSee you soon!\nTeam ${businessName}`;
  };

  const renderedText = getRenderedMessage();

  // Send WhatsApp via official wa.me direct URL
  const handleSendWhatsApp = () => {
    if (!selectedMember) return;
    const cleanPhone = selectedMember.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(renderedText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    window.open(waUrl, '_blank');

    // Add to sent log
    setSentLogs((prev) => [
      {
        id: 'log_' + Date.now(),
        memberName: selectedMember.fullName,
        phone: selectedMember.phone,
        template: selectedTemplateId.toUpperCase(),
        sentAt: 'Just now',
      },
      ...prev,
    ]);

    showToast(`WhatsApp message dispatched to ${selectedMember.fullName}!`, 'success');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(renderedText);
    showToast('Message copied to clipboard!', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp Business Notifications</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated WhatsApp reminders for membership expiry, pending fee alerts, and payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Meta WhatsApp Cloud API Ready</span>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Selector & Member Picker */}
        <Card className="p-5 lg:col-span-1 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              1. Select Approved Template
            </label>
            <div className="space-y-2">
              {[
                { id: 'expiry', label: 'Membership Expiry Reminder', desc: 'Alerts members 3-7 days prior to expiry' },
                { id: 'due', label: 'Pending Fee Alert', desc: 'Prompts members to settle outstanding balance' },
                { id: 'receipt', label: 'Payment Confirmation', desc: 'Sends immediate confirmation receipt' },
                { id: 'welcome', label: 'Welcome Onboarding', desc: 'Sent when new member registers' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id as any)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                    selectedTemplateId === t.id
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              2. Target {labels.memberSingular}
            </label>
            {members.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                No members enrolled yet. Add a member to test notifications.
              </div>
            ) : (
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode} • {m.phone})
                  </option>
                ))}
              </select>
            )}
          </div>
        </Card>

        {/* Right: Live Preview & Dispatch Phone Mockup */}
        <Card className="p-6 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live WhatsApp Message Preview
              </span>
              <span className="text-xs text-emerald-600 font-medium">Official Format</span>
            </div>

            {/* WhatsApp Chat Bubble Mockup */}
            <div className="my-5 p-5 bg-[#ECE5DD] dark:bg-slate-950 rounded-2xl shadow-inner border border-slate-200/60 dark:border-slate-800 max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/10 dark:border-white/10">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentBusiness?.name} Official
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Verified WhatsApp Business
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#005C4B] text-slate-800 dark:text-white p-3.5 rounded-lg rounded-tl-none shadow-xs text-xs whitespace-pre-wrap leading-relaxed font-sans">
                {renderedText}
                <div className="text-right text-[10px] text-slate-400 dark:text-emerald-200 mt-2">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Recipient: <strong className="text-slate-800 dark:text-slate-200">{selectedMember?.phone || 'No phone selected'}</strong>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMessage}
                icon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy Text
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendWhatsApp}
                icon={<Send className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Launch &amp; Send WhatsApp
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Dispatched Reminders History */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Recent WhatsApp Logs
          </h3>
          <span className="text-xs text-slate-400 font-medium">{sentLogs.length} messages</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {sentLogs.map((log) => (
            <div key={log.id} className="px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {log.memberName} ({log.phone})
                  </div>
                  <div className="text-[11px] text-slate-400">{log.template}</div>
                </div>
              </div>
              <div className="text-slate-400 text-right">{log.sentAt}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
