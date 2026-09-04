import React from 'react';
import { EmailJob } from '../types';
import { ArrowLeft, Star, Archive, Trash2, ExternalLink, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface EmailDetailViewProps {
  email: EmailJob;
  onBack: () => void;
  onCancel?: (id: string) => void;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({ email, onBack, onCancel }) => {
  const dateToDisplay = email.sentAt || email.scheduledAt;
  const formattedDate = format(new Date(dateToDisplay), 'MMM d, h:mm a');

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-white font-sans">
      {/* Header - Matching Figma Screen 5 */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-gray-900 truncate max-w-xl">
            {email.subject}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <button className="p-1.5 hover:text-amber-400"><Star className="w-4 h-4" /></button>
          <button className="p-1.5 hover:text-gray-600"><Archive className="w-4 h-4" /></button>
          <button
            onClick={() => onCancel && onCancel(email.id)}
            className="p-1.5 hover:text-rose-500"
            title="Cancel / Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Body - Matching Figma Screen 5 */}
      <div className="max-w-4xl w-full mx-auto px-8 py-6 space-y-6">
        {/* Sender Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Green Initial Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#00A34D] text-white font-bold flex items-center justify-center text-sm">
              {email.senderEmail[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">
                  {email.senderEmail.split('@')[0]}
                </span>
                <span className="text-xs text-gray-400">&lt;{email.senderEmail}&gt;</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <span>to me</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        {/* Email Content */}
        <div className="text-xs text-gray-800 leading-relaxed space-y-4">
          <p>Hey {email.recipientEmail.split('@')[0]},</p>
          <div className="whitespace-pre-line">{email.body}</div>

          {/* Highlighted Yellow Callout Banner - Matching Figma Screen 5 */}
          <div className="bg-[#FFFBEB] border-l-4 border-[#F59E0B] p-4 rounded-r-xl text-xs text-gray-800 space-y-1 my-4">
            <p className="font-bold text-[#B45309]">
              ⚡ High-Throughput Outreach Active • ReachInbox Queue Engine
            </p>
            <p className="text-gray-600">
              Dispatched with persistent delayed worker queues, per-sender rate limiting, and Ethereal SMTP verification.
            </p>
          </div>
        </div>

        {/* Ethereal SMTP Live Preview Box */}
        {email.etherealPreviewUrl && (
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Verified in fake Ethereal SMTP test inbox.
            </div>
            <a
              href={email.etherealPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E8F8F0] text-[#00A34D] hover:bg-[#d5f3e2] font-semibold text-xs border border-[#A7F3D0]/80 transition-colors"
            >
              <span>Open in Ethereal Web Viewer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
