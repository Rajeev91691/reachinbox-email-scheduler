import React from 'react';
import { EmailJob } from '../types';
import { Search, RefreshCw, Star, ExternalLink, Send } from 'lucide-react';
import { format } from 'date-fns';

interface SentListProps {
  items: EmailJob[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onSelectItem: (job: EmailJob) => void;
}

export const SentList: React.FC<SentListProps> = ({
  items = [],
  loading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onSelectItem,
}) => {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white font-sans">
      {/* Top Search & Action Bar */}
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

      {/* Email Feed - Matching Figma Screen 6 */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {loading && safeItems.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-[#00A34D] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading sent emails...</span>
          </div>
        ) : safeItems.length === 0 ? (
          <div className="py-24 text-center text-gray-400">
            <div className="w-12 h-12 rounded-full bg-[#E8F8F0] text-[#00A34D] flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800">No sent emails yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Dispatched emails processed via Ethereal SMTP will appear here with live preview links.
            </p>
          </div>
        ) : (
          safeItems.map((job) => {
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

                {/* Sent Badge - Matching Figma Neutral Pill */}
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-gray-600 border border-gray-200">
                    <span>Sent</span>
                  </span>
                </div>

                {/* Subject & Preview */}
                <div className="flex-1 truncate text-xs">
                  <span className="font-semibold text-gray-800">{job.subject}</span>
                  <span className="text-gray-400 font-normal ml-2 truncate">
                    - {job.body.replace(/\n/g, ' ')}
                  </span>
                </div>

                {/* Actions & Star */}
                <div className="flex items-center gap-3 shrink-0">
                  {job.etherealPreviewUrl && (
                    <a
                      href={job.etherealPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#E8F8F0] hover:bg-[#d5f3e2] text-[#00A34D] border border-[#A7F3D0]/60 flex items-center gap-1 transition-colors"
                      title="Open Ethereal Web Preview"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
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
