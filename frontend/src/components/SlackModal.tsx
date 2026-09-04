import React, { useState } from 'react';
import { slackApi } from '../services/api';
import { X, MessageSquare, Check, AlertCircle, Send } from 'lucide-react';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const SlackModal: React.FC<SlackModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('#outreach-alerts');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await slackApi.connect(webhookUrl, channelName);
      setStatusMsg({ type: 'success', text: '✅ Slack Webhook verified and connected! Live rate-limit alerts active.' });
      onConnected();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: '❌ Failed to connect: ' + (err.response?.data?.error || err.message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await slackApi.testNotification(webhookUrl || undefined);
      setStatusMsg({ type: 'success', text: '🚀 Test alert delivered to your Slack channel successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: '❌ Test notification failed: ' + (err.response?.data?.error || err.message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Slack Rate-Limit Notifications</h2>
              <p className="text-xs text-slate-400">Receive live alerts the moment an hourly sender cap is hit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConnect} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Slack Incoming Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Create a webhook in your Slack App settings under <em>Incoming Webhooks</em>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Channel Name
            </label>
            <input
              type="text"
              placeholder="#alerts or #outreach-ops"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Alert</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isSubmitting ? 'Verifying...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
