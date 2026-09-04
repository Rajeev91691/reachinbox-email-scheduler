import React from 'react';
import { EmailStats } from '../types';
import { Clock, Send, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StatsCardsProps {
  stats: EmailStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Scheduled in Queue',
      value: stats.scheduled,
      icon: Clock,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
      badge: 'Delayed BullMQ Jobs',
    },
    {
      label: 'Sent (Delivered)',
      value: stats.sent,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'Ethereal SMTP Verified',
    },
    {
      label: 'Rate Limit Throttled',
      value: stats.rateLimited,
      icon: ShieldAlert,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20',
      badge: 'Auto-Rescheduled',
    },
    {
      label: 'Failed Dispatches',
      value: stats.failed,
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/20',
      badge: 'Auto-Retry Backoff',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-[#111827]/80 backdrop-blur-sm border ${card.color} transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{card.label}</span>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold text-white tracking-tight">{card.value}</div>
              <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/40">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
