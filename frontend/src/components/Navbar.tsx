import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Send, Zap, ExternalLink, MessageSquare, ShieldCheck, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenCompose: () => void;
  onOpenSlack: () => void;
  slackConnected: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCompose,
  onOpenSlack,
  slackConnected,
  onRefresh,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg tracking-tight">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">ReachInbox</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO SCHEDULER
              </span>
            </div>
            <p className="text-xs text-slate-400">High-Throughput Distributed Email Engine</p>
          </div>
        </div>
      </div>

      {/* Center/Actions */}
      <div className="flex items-center gap-3">
        {/* Slack Connection Status */}
        <button
          onClick={onOpenSlack}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            slackConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Configure Slack Alerts for Hourly Rate Limits"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{slackConnected ? 'Slack Connected' : 'Connect Slack'}</span>
          {slackConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
        </button>

        {/* Live BullMQ Dashboard Link */}
        <a
          href="http://localhost:5000/admin/queues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-all hover:text-white"
          title="Open Live BullMQ Queue Monitor"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>BullMQ Live</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Send className="w-4 h-4" />
          <span>Compose New Email</span>
        </button>
      </div>

      {/* User Info / Logout */}
      {user && (
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-2.5">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-indigo-500/30 ring-2 ring-indigo-500/10 object-cover"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
