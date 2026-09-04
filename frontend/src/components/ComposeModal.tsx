import React, { useState, useEffect } from 'react';
import { emailApi } from '../services/api';
import { SenderAccount } from '../types';
import { X, Upload, Clock, Zap, Users, AlertCircle, Sparkles, Check } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onScheduled }) => {
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [selectedSender, setSelectedSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [singleRecipient, setSingleRecipient] = useState('');
  const [uploadedEmails, setUploadedEmails] = useState<string[]>([]);
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      emailApi.getSenders().then((res) => {
        setSenders(res.senders);
        if (res.senders.length > 0) {
          setSelectedSender(res.senders[0].email);
        }
      });
      // Default scheduled time to 1 minute from now
      const d = new Date(Date.now() + 60000);
      setScheduleTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await emailApi.uploadCsv(file);
      if (res.success && res.emails.length > 0) {
        setUploadedEmails(res.emails);
      } else {
        setUploadError('No valid email addresses found in file.');
      }
    } catch (err: any) {
      setUploadError('Failed to parse file: ' + err.message);
    }
  };

  const recipientCount = uploadedEmails.length > 0 ? uploadedEmails.length : singleRecipient ? 1 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientCount === 0) {
      alert('Please provide at least one recipient email or upload a leads file.');
      return;
    }

    setIsSubmitting(true);
    try {
      await emailApi.schedule({
        senderEmail: selectedSender,
        recipients: uploadedEmails.length > 0 ? uploadedEmails : [singleRecipient.trim()],
        subject,
        body,
        scheduledAt: scheduleTime ? new Date(scheduleTime).toISOString() : new Date().toISOString(),
        delaySeconds,
        hourlyLimit,
      });

      onScheduled();
      onClose();
    } catch (err: any) {
      alert('Failed to schedule email: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compose & Schedule Email Campaign</h2>
              <p className="text-xs text-slate-400">High-throughput delayed job scheduler with rate-limit protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Sender Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Sender Account (SMTP Transport)
            </label>
            <select
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              required
            >
              {senders.map((s) => (
                <option key={s.id} value={s.email}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          {/* Recipients / File Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Recipients / Leads
              </label>
              {uploadedEmails.length > 0 && (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ✓ {uploadedEmails.length} Leads Loaded from File
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Single recipient (e.g. lead@company.com)"
                value={singleRecipient}
                disabled={uploadedEmails.length > 0}
                onChange={(e) => setSingleRecipient(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />

              <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800/40 border border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80 rounded-xl text-slate-300 text-xs font-medium cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>{uploadedEmails.length > 0 ? 'Replace CSV / TXT Leads' : 'Upload CSV / TXT Leads'}</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {uploadError && <p className="text-xs text-rose-400 mt-1.5">{uploadError}</p>}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              placeholder="e.g. Scaling outreach with ReachInbox AI workflows"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Content</label>
              <span className="text-[11px] text-slate-400">Supports variable: <code className="text-indigo-300">{"{{email}}"}</code></span>
            </div>
            <textarea
              rows={4}
              placeholder="Hi {{email}},&#10;&#10;I noticed your outreach workflows could benefit from automated scheduling..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono text-xs"
              required
            />
          </div>

          {/* Throttle & Rate Limiting Controls */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Scheduling & Rate Limiting Settings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Start Time (Schedule)</label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Min Delay (Seconds)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Hourly Limit / Sender</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(parseInt(e.target.value, 10) || 200)}
                  className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || recipientCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>{isSubmitting ? 'Scheduling Jobs...' : `Schedule ${recipientCount} Email${recipientCount === 1 ? '' : 's'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
