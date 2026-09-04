import React from 'react';
import { EmailJob } from '../types';
import { Clock, Trash2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledTableProps {
  items: EmailJob[];
  loading: boolean;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({ items, loading, onCancel }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm">Loading scheduled queue dispatches...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-[#111827]/40">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No scheduled emails in queue</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Click "Compose New Email" to schedule single leads or upload CSV batches with customizable dispatch delays.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Scheduled
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Processing
          </span>
        );
      case 'RATE_LIMITED_DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3 h-3" />
            Rate-Limit Rescheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]/70 backdrop-blur-sm">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-[#0F172A]/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
          <tr>
            <th className="px-5 py-3.5">Recipient Lead</th>
            <th className="px-5 py-3.5">Sender Account</th>
            <th className="px-5 py-3.5">Subject</th>
            <th className="px-5 py-3.5">Scheduled Send Time</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-medium">
          {items.map((job) => (
            <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-5 py-3.5 font-mono text-slate-200">{job.recipientEmail}</td>
              <td className="px-5 py-3.5 text-slate-400">{job.senderEmail}</td>
              <td className="px-5 py-3.5 text-slate-300 max-w-xs truncate">{job.subject}</td>
              <td className="px-5 py-3.5 text-slate-400">
                {format(new Date(job.scheduledAt), 'MMM dd, yyyy HH:mm:ss')}
              </td>
              <td className="px-5 py-3.5">{getStatusBadge(job.status)}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => onCancel(job.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Cancel scheduled dispatch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
