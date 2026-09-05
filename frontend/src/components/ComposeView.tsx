import React, { useState, useEffect } from 'react';
import { emailApi } from '../services/api';
import { SenderAccount } from '../types';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Upload,
  ChevronDown,
  Calendar,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
} from 'lucide-react';

interface ComposeViewProps {
  onBack: () => void;
  onScheduled: () => void;
}

export const ComposeView: React.FC<ComposeViewProps> = ({ onBack, onScheduled }) => {
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [selectedSender, setSelectedSender] = useState('oliver.brown@domain.io');
  const [recipients, setRecipients] = useState<string[]>(['tame@jmail.com', 'lame@jmail.com', 'dame@jmail.com']);
  const [newRecipientInput, setNewRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(100);

  // Send Later Popover state (Figma Screen 4)
  const [showSendLater, setShowSendLater] = useState(false);
  const [selectedScheduleTime, setSelectedScheduleTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    emailApi.getSenders().then((res) => {
      const safeSenders = Array.isArray(res?.senders) ? res.senders : [];
      setSenders(safeSenders);
      if (safeSenders.length > 0) {
        setSelectedSender(safeSenders[0].email);
      }
    }).catch(() => {
      setSenders([{ id: 'snd_01', email: 'oliver.brown@domain.io', name: 'Oliver Brown', isActive: true }]);
    });

    // Default scheduled time: tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setSelectedScheduleTime(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, []);

  const handleAddRecipient = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && newRecipientInput.trim()) {
      e.preventDefault();
      const email = newRecipientInput.trim().replace(',', '');
      if (!recipients.includes(email)) {
        setRecipients([...recipients, email]);
      }
      setNewRecipientInput('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await emailApi.uploadCsv(file);
      if (res.success && res.emails.length > 0) {
        setRecipients(res.emails);
      } else {
        setUploadError('No valid emails found in file.');
      }
    } catch (err: any) {
      setUploadError('Failed to parse leads file: ' + err.message);
    }
  };

  const setPresetSchedule = (hoursToAdd: number, setSpecificHour?: number) => {
    const d = new Date();
    d.setDate(d.getDate() + (hoursToAdd >= 24 ? 1 : 0));
    if (setSpecificHour !== undefined) {
      d.setHours(setSpecificHour, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + hoursToAdd);
    }
    setSelectedScheduleTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  const handleSendOrSchedule = async () => {
    if (recipients.length === 0) {
      alert('Please provide at least one recipient email.');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter an email subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      await emailApi.schedule({
        senderEmail: selectedSender,
        recipients,
        subject,
        body: body || 'Hi {{email}},\n\nReaching out regarding our automated workflows.',
        scheduledAt: selectedScheduleTime ? new Date(selectedScheduleTime).toISOString() : new Date().toISOString(),
        delaySeconds,
        hourlyLimit,
      });

      onScheduled();
      onBack();
    } catch (err: any) {
      alert('Failed to schedule emails: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-white font-sans relative">
      {/* Header - Matching Figma Screen 2 */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Compose New Email</h1>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Paperclip className="w-4 h-4" />
            <span className="text-[11px] font-semibold">1</span>
          </div>

          <button
            onClick={() => setShowSendLater(!showSendLater)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
            title="Schedule Options"
          >
            <Clock className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSendLater(!showSendLater)}
            className="px-4 py-1.5 rounded-full border border-[#00A34D] text-[#00A34D] hover:bg-[#E8F8F0] font-semibold text-xs transition-colors"
          >
            Send Later
          </button>

          {/* Send Later Popover - Matching Figma Screen 4 */}
          {showSendLater && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.12)] p-5 z-40 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-xs font-bold text-gray-900 mb-3">Send Later</h3>

              <div className="relative mb-4">
                <input
                  type="datetime-local"
                  value={selectedScheduleTime}
                  onChange={(e) => setSelectedScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A34D]/30"
                />
              </div>

              {/* Preset List matching Figma Screen 4 */}
              <div className="space-y-1.5 mb-5 text-xs text-gray-600">
                <button
                  type="button"
                  onClick={() => setPresetSchedule(24, 9)}
                  className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-[#F3F4F6] text-gray-700 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSchedule(24, 10)}
                  className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-[#F3F4F6] text-gray-700 transition-colors"
                >
                  Tomorrow, 10:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSchedule(24, 11)}
                  className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-[#F3F4F6] text-gray-700 transition-colors"
                >
                  Tomorrow, 11:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSchedule(24, 15)}
                  className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-[#F3F4F6] text-gray-700 transition-colors"
                >
                  Tomorrow, 3:00 PM
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSendLater(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSendLater(false);
                    handleSendOrSchedule();
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-full border border-[#00A34D] text-[#00A34D] hover:bg-[#E8F8F0] text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="max-w-4xl w-full mx-auto px-8 py-6 space-y-4">
        {/* From Row */}
        <div className="flex items-center gap-4 text-xs">
          <span className="w-12 text-gray-400 font-medium shrink-0">From</span>
          <div className="relative">
            <select
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              className="appearance-none bg-[#F3F4F6] hover:bg-gray-200/80 px-3.5 py-1.5 pr-8 rounded-lg text-xs font-medium text-gray-800 focus:outline-none cursor-pointer"
            >
              {senders.length > 0 ? (
                senders.map((s) => (
                  <option key={s.id} value={s.email}>
                    {s.email}
                  </option>
                ))
              ) : (
                <option value="oliver.brown@domain.io">oliver.brown@domain.io</option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* To Row - Matching Figma Green Chips */}
        <div className="flex items-center gap-4 text-xs">
          <span className="w-12 text-gray-400 font-medium shrink-0">To</span>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {recipients.slice(0, 4).map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E8F8F0] text-[#00A34D] border border-[#A7F3D0]"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(email)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {recipients.length > 4 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#00A34D] border border-[#A7F3D0]">
                +{recipients.length - 4}
              </span>
            )}

            <input
              type="text"
              placeholder="Add recipient and press Enter..."
              value={newRecipientInput}
              onChange={(e) => setNewRecipientInput(e.target.value)}
              onKeyDown={handleAddRecipient}
              className="px-2 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none min-w-[160px]"
            />
          </div>

          {/* Upload List Button - Matching Figma */}
          <label className="flex items-center gap-1.5 text-[#00A34D] hover:text-[#008c42] text-xs font-semibold cursor-pointer shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload List</span>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        {uploadError && <p className="text-xs text-rose-500 pl-16">{uploadError}</p>}

        {/* Subject Row */}
        <div className="flex items-center gap-4 text-xs pt-1">
          <span className="w-12 text-gray-400 font-medium shrink-0">Subject</span>
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 py-1 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none border-b border-transparent focus:border-gray-200"
          />
        </div>

        {/* Throttle Controls Row - Matching Figma [ 00 ] [ 00 ] */}
        <div className="flex items-center gap-6 text-xs pt-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Delay between 2 emails</span>
            <input
              type="number"
              min="0"
              max="60"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
              className="w-12 py-1 px-2 text-center bg-[#F3F4F6] rounded-lg text-xs font-mono font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#00A34D]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Hourly Limit</span>
            <input
              type="number"
              min="1"
              max="5000"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(parseInt(e.target.value, 10) || 100)}
              className="w-14 py-1 px-2 text-center bg-[#F3F4F6] rounded-lg text-xs font-mono font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#00A34D]"
            />
          </div>
        </div>

        {/* Body Editor Container - Matching Figma Screen 2 & 3 */}
        <div className="mt-4 bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100 flex flex-col min-h-[380px]">
          {/* Rich Text Toolbar */}
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/60 flex items-center justify-between gap-1 text-gray-500 shadow-xs mb-4">
            <div className="flex items-center gap-3">
              <button type="button" className="hover:text-gray-800"><Undo className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><Redo className="w-3.5 h-3.5" /></button>
              <div className="h-3.5 w-px bg-gray-200 mx-1"></div>
              <span className="text-xs font-bold hover:text-gray-800 cursor-pointer">Tt</span>
              <button type="button" className="hover:text-gray-800 font-bold text-xs"><Bold className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><Italic className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><Underline className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><Strikethrough className="w-3.5 h-3.5" /></button>
              <div className="h-3.5 w-px bg-gray-200 mx-1"></div>
              <button type="button" className="hover:text-gray-800"><AlignLeft className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><ListOrdered className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><List className="w-3.5 h-3.5" /></button>
              <button type="button" className="hover:text-gray-800"><Quote className="w-3.5 h-3.5" /></button>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">{"{{email}}"} dynamic lead tag supported</span>
          </div>

          {/* Text Area */}
          <textarea
            rows={12}
            placeholder="Type Your Reply..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 w-full bg-transparent border-none text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Primary Schedule / Dispatch Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendOrSchedule}
            disabled={isSubmitting || recipients.length === 0}
            className="px-6 py-2.5 rounded-full bg-[#00A34D] hover:bg-[#008c42] text-white font-semibold text-xs shadow-sm transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : `Schedule for ${recipients.length} Recipient${recipients.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
