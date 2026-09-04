import React from 'react';
import { EmailJob } from '../types';
import { CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface SentTableProps {
  items: EmailJob[];
  loading: boolean;
  onRefresh: () => void;
}

export const SentTable: React.FC<SentTableProps> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm">Loading sent email history...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-[#111827]/40">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No sent emails recorded yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Once BullMQ workers process scheduled jobs via Ethereal SMTP, delivered emails with test web preview links will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]/70 backdrop-blur-sm">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-[#0F172A]/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
          <tr>
            <th className="px-5 py-3.5">Recipient Lead</th>
            <th className="px-5 py-3.5">Sender Account</th>
            <th className="px-5 py-3.5">Subject</th>
            <th className="px-5 py-3.5">Sent Timestamp</th>
            <th className="px-5 py-3.5">Delivery Status</th>
            <th className="px-5 py-3.5 text-right">Ethereal SMTP Preview</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-medium">
          {items.map((job) => (
            <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-5 py-3.5 font-mono text-slate-200">{job.recipientEmail}</td>
              <td className="px-5 py-3.5 text-slate-400">{job.senderEmail}</td>
              <td className="px-5 py-3.5 text-slate-300 max-w-xs truncate">{job.subject}</td>
              <td className="px-5 py-3.5 text-slate-400">
                {job.sentAt ? format(new Date(job.sentAt), 'MMM dd, yyyy HH:mm:ss') : '-'}
              </td>
              <td className="px-5 py-3.5">
                {job.status === 'SENT' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Sent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    Failed
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right">
                {job.etherealPreviewUrl ? (
                  <a
                    href={job.etherealPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all hover:scale-105"
                  >
                    <span>View in Ethereal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
