import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { ScheduledList } from './components/ScheduledList';
import { SentList } from './components/SentList';
import { ComposeView } from './components/ComposeView';
import { EmailDetailView } from './components/EmailDetailView';
import { SlackModal } from './components/SlackModal';
import { emailApi, slackApi } from './services/api';
import { EmailJob, EmailStats } from './types';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'scheduled' | 'sent' | 'compose'>('scheduled');
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  const [stats, setStats] = useState<EmailStats>({ scheduled: 0, sent: 0, failed: 0, rateLimited: 0, total: 0 });
  const [scheduledItems, setScheduledItems] = useState<EmailJob[]>([]);
  const [sentItems, setSentItems] = useState<EmailJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmailJob[] | null>(null);
  const [loading, setLoading] = useState(false);

  const [isSlackOpen, setIsSlackOpen] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, schedRes, sentRes, slackRes] = await Promise.all([
        emailApi.getStats().catch(() => ({ scheduled: 0, sent: 0, failed: 0, rateLimited: 0, total: 0 })),
        emailApi.getScheduled(1, 100).catch(() => ({ items: [], total: 0 })),
        emailApi.getSent(1, 100).catch(() => ({ items: [], total: 0 })),
        slackApi.getStatus().catch(() => ({ connected: false })),
      ]);

      setStats(statsRes || { scheduled: 0, sent: 0, failed: 0, rateLimited: 0, total: 0 });
      setScheduledItems(Array.isArray(schedRes?.items) ? schedRes.items : []);
      setSentItems(Array.isArray(sentRes?.items) ? sentRes.items : []);
      setSlackConnected(Boolean(slackRes?.connected));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 4000);
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
      const res = await emailApi.search(q, currentTab === 'scheduled' ? 'SCHEDULED' : 'SENT');
      setSearchResults(res.results);
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  const handleCancelEmail = async (id: string) => {
    if (!confirm('Cancel this scheduled email dispatch?')) return;
    try {
      await emailApi.cancel(id);
      fetchData();
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
    } catch (err: any) {
      alert('Failed to cancel: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!user) {
    return <LoginView />;
  }

  const displayedScheduled = searchResults ? searchResults : scheduledItems;
  const displayedSent = searchResults ? searchResults : sentItems;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-gray-900 select-none">
      {/* Sidebar - Matching Figma Screen 6 & 7 */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedEmail(null);
          setSearchResults(null);
          setSearchQuery('');
          setCurrentTab(tab);
        }}
        stats={stats}
        onOpenSlack={() => setIsSlackOpen(true)}
        slackConnected={slackConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {selectedEmail ? (
          <EmailDetailView
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onCancel={handleCancelEmail}
          />
        ) : currentTab === 'compose' ? (
          <ComposeView
            onBack={() => setCurrentTab('scheduled')}
            onScheduled={() => {
              fetchData();
              setCurrentTab('scheduled');
            }}
          />
        ) : currentTab === 'scheduled' ? (
          <ScheduledList
            items={displayedScheduled}
            loading={loading && scheduledItems.length === 0}
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            onRefresh={fetchData}
            onCancel={handleCancelEmail}
            onSelectItem={(job) => setSelectedEmail(job)}
          />
        ) : (
          <SentList
            items={displayedSent}
            loading={loading && sentItems.length === 0}
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            onRefresh={fetchData}
            onSelectItem={(job) => setSelectedEmail(job)}
          />
        )}
      </div>

      {/* Slack Integration Modal */}
      <SlackModal
        isOpen={isSlackOpen}
        onClose={() => setIsSlackOpen(false)}
        onConnected={() => {
          setSlackConnected(true);
          fetchData();
        }}
      />
    </div>
  );
};
