import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ScheduledTable } from './components/ScheduledTable';
import { SentTable } from './components/SentTable';
import { ComposeModal } from './components/ComposeModal';
import { SlackModal } from './components/SlackModal';
import { emailApi, slackApi } from './services/api';
import { EmailJob, EmailStats } from './types';
import { Search, RefreshCw, Filter, Layers, CheckCircle, Clock, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSlackOpen, setIsSlackOpen] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);

  const [stats, setStats] = useState<EmailStats>({ scheduled: 0, sent: 0, failed: 0, rateLimited: 0, total: 0 });
  const [scheduledItems, setScheduledItems] = useState<EmailJob[]>([]);
  const [sentItems, setSentItems] = useState<EmailJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmailJob[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, schedRes, sentRes, slackRes] = await Promise.all([
        emailApi.getStats(),
        emailApi.getScheduled(1, 50),
        emailApi.getSent(1, 50),
        slackApi.getStatus(),
      ]);

      setStats(statsRes);
      setScheduledItems(schedRes.items);
      setSentItems(sentRes.items);
      setSlackConnected(slackRes.connected);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 4000); // Polling every 4s for real-time responsiveness
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await emailApi.search(q);
      setSearchResults(res.results);
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  const handleCancelEmail = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    try {
      await emailApi.cancel(id);
      fetchData();
    } catch (err: any) {
      alert('Failed to cancel email: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenSlack={() => setIsSlackOpen(true)}
        slackConnected={slackConnected}
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Top Metric Cards */}
        <StatsCards stats={stats} />

        {/* Dashboard Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-[#111827] border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('scheduled'); setSearchResults(null); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Scheduled Emails</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
                {stats.scheduled + stats.rateLimited}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('sent'); setSearchResults(null); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sent'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Sent History</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
                {stats.sent}
              </span>
            </button>
          </div>

          {/* Search Bar (Elasticsearch backed) */}
          <div className="flex items-center gap-3 w-full sm:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Elasticsearch query..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-[#111827] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Table */}
        {searchResults ? (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-indigo-400">
                🔍 Elasticsearch Results for "{searchQuery}" ({searchResults.length} matches)
              </span>
              <button
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Clear Search
              </button>
            </div>
            {activeTab === 'scheduled' ? (
              <ScheduledTable
                items={searchResults}
                loading={false}
                onCancel={handleCancelEmail}
                onRefresh={fetchData}
              />
            ) : (
              <SentTable items={searchResults} loading={false} onRefresh={fetchData} />
            )}
          </div>
        ) : activeTab === 'scheduled' ? (
          <ScheduledTable
            items={scheduledItems}
            loading={loading && scheduledItems.length === 0}
            onCancel={handleCancelEmail}
            onRefresh={fetchData}
          />
        ) : (
          <SentTable
            items={sentItems}
            loading={loading && sentItems.length === 0}
            onRefresh={fetchData}
          />
        )}
      </main>

      {/* Modals */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onScheduled={fetchData}
      />

      <SlackModal
        isOpen={isSlackOpen}
        onClose={() => setIsSlackOpen(false)}
        onConnected={() => { setSlackConnected(true); fetchData(); }}
      />
    </div>
  );
};
