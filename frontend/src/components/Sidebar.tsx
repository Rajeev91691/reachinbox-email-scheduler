import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Send, Plus, Activity, MessageSquare, LogOut, ChevronDown } from 'lucide-react';
import { EmailStats } from '../types';

interface SidebarProps {
  currentTab: 'scheduled' | 'sent' | 'compose';
  onSelectTab: (tab: 'scheduled' | 'sent' | 'compose') => void;
  stats: EmailStats;
  onOpenSlack: () => void;
  slackConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  onOpenSlack,
  slackConnected,
}) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col justify-between p-5 select-none shrink-0 font-sans">
      <div>
        {/* Logo - Matching Figma "ONB" */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="text-2xl font-black text-gray-900 tracking-tighter">ONB</div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            ReachInbox
          </span>
        </div>

        {/* User Switcher Card - Matching Figma "Oliver Brown" dropdown */}
        <div className="flex items-center justify-between p-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-xl border border-gray-100 transition-colors mb-4 cursor-pointer">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'reachinbox'}`}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full border border-gray-200 object-cover shrink-0"
            />
            <div className="overflow-hidden text-left">
              <div className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || 'Oliver Brown'}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {user?.email || 'oliver.brown@domain.io'}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </div>

        {/* Primary Compose Button - Matching Figma Pill button */}
        <button
          onClick={() => onSelectTab('compose')}
          className="w-full py-2.5 px-4 mb-6 bg-white hover:bg-[#E8F8F0] text-[#00A34D] border-2 border-[#00A34D] rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm transform active:scale-[0.99]"
        >
          <span>Compose</span>
        </button>

        {/* CORE Section */}
        <div className="mb-2">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            CORE
          </div>

          <nav className="space-y-1">
            {/* Scheduled Nav Item */}
            <button
              onClick={() => onSelectTab('scheduled')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'scheduled'
                  ? 'bg-[#E8F8F0] text-[#00A34D]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${currentTab === 'scheduled' ? 'text-[#00A34D]' : 'text-gray-400'}`} />
                <span>Scheduled</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  currentTab === 'scheduled'
                    ? 'bg-white text-[#00A34D] shadow-xs'
                    : 'text-gray-400'
                }`}
              >
                {(stats?.scheduled ?? 0) + (stats?.rateLimited ?? 0)}
              </span>
            </button>

            {/* Sent Nav Item */}
            <button
              onClick={() => onSelectTab('sent')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'sent'
                  ? 'bg-[#E8F8F0] text-[#00A34D]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className={`w-4 h-4 ${currentTab === 'sent' ? 'text-[#00A34D]' : 'text-gray-400'}`} />
                <span>Sent</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  currentTab === 'sent'
                    ? 'bg-white text-[#00A34D] shadow-xs'
                    : 'text-gray-400'
                }`}
              >
                {stats?.sent ?? 0}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Integrations & Tools */}
      <div className="pt-4 border-t border-gray-100 space-y-1.5 text-xs">
        {/* Slack Connection */}
        <button
          onClick={onOpenSlack}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium border transition-colors ${
            slackConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{slackConnected ? 'Slack Active' : 'Connect Slack'}</span>
          </div>
          {slackConnected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
        </button>

        {/* Live BullMQ Dashboard */}
        <a
          href="http://localhost:5000/admin/queues"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>BullMQ Live Monitor</span>
          </div>
          <span className="text-[10px] text-gray-400">↗</span>
        </a>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
