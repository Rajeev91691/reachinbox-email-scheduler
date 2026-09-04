import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, ShieldCheck, Mail, Clock, Database, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginAsDev, loginWithGoogleToken, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0B0F19]">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111827]/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 mx-auto mb-5 text-white font-black text-2xl tracking-tighter">
          R
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">ReachInbox</h1>
        <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mt-1">
          Full-Stack Email Job Scheduler
        </p>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Production-grade distributed email scheduler backed by BullMQ, Redis persistence, Ethereal SMTP, and Elasticsearch indexing.
        </p>

        {/* Feature badges */}
        <div className="grid grid-cols-2 gap-2 my-6 text-left">
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>BullMQ Delayed Jobs</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restart Persistence</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Hourly Rate Limiter</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Elasticsearch Search</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => loginAsDev('mitrajit@reachinbox.ai')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter Evaluation Dashboard</span>
          </button>

          <button
            onClick={() => loginAsDev('yadav036@reachinbox.ai')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            <span>Sign in as Yadav036 (Reviewer 2)</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 mt-6">
          ReachInbox Hiring Assignment • Developed by Damarla Rajeev Nandan
        </p>
      </div>
    </div>
  );
};
