import React from 'react';
import { EmailJob } from '../types';
import { Search, Filter, RefreshCw, Star, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledListProps {
  items: EmailJob[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onCancel: (id: string) => void;
  onSelectItem: (job: EmailJob) => void;
}

export const ScheduledList: React.FC<ScheduledListProps> = ({
  items,
  loading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onCancel,
  onSelectItem,
}) => {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white font-sans">
      {/* Top Search & Action Bar - Matching Figma */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-gray-200/80 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A34D]/20 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00A34D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Email Feed - Matching Figma Screen 7 */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {loading && items.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-[#00A34D] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading scheduled emails...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center text-gray-400">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800">No scheduled emails</p>
            <p className="text-xs text-gray-400 mt-1">Click "Compose" on the sidebar to schedule your first email batch.</p>
          </div>
        ) : (
          items.map((job) => {
            const scheduledDate = new Date(job.scheduledAt);
            const formattedTime = format(scheduledDate, 'EEE h:mm:ss a');

            return (
              <div
                key={job.id}
                onClick={() => onSelectItem(job)}
                className="px-6 py-3.5 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left metadata */}
                <div className="flex items-center gap-4 min-w-[200px] shrink-0">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    To: {job.recipientEmail.split('@')[0]}
                  </span>
                </div>

                {/* Scheduled Badge - Matching Figma Amber Pill */}
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]/60">
                    <Clock className="w-3 h-3 text-[#D97706]" />
                    <span>{formattedTime}</span>
                  </span>
                </div>

                {/* Subject & Preview */}
                <div className="flex-1 truncate text-xs">
                  <span className="font-semibold text-gray-800">{job.subject}</span>
                  <span className="text-gray-400 font-normal ml-2 truncate">
                    - {job.body.replace(/\n/g, ' ')}
                  </span>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(job.id);
                    }}
                    className="p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Cancel scheduled dispatch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Star className="w-4 h-4 text-gray-300 hover:text-amber-400 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
