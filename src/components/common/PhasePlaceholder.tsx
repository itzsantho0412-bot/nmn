import React from 'react';
import { Card, Button, Badge } from './UIComponents.tsx';
import { Clock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';

interface PhasePlaceholderProps {
  phaseNumber: number;
  title: string;
  description: string;
  features: string[];
  onBackToOverview: () => void;
}

export const PhasePlaceholder: React.FC<PhasePlaceholderProps> = ({
  phaseNumber,
  title,
  description,
  features,
  onBackToOverview,
}) => {
  const { labels } = useTenant();

  return (
    <Card className="p-8 text-center max-w-2xl mx-auto space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
        <Clock className="w-7 h-7" />
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2 border border-amber-200">
          Scheduled for Phase {phaseNumber}
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">{description}</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/70 text-left">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Planned Deliverables in Phase {phaseNumber}:
        </h4>
        <ul className="space-y-2 text-xs text-slate-600">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 flex justify-center">
        <Button variant="outline" size="sm" onClick={onBackToOverview}>
          Return to Phase 1 Dashboard
        </Button>
      </div>
    </Card>
  );
};
