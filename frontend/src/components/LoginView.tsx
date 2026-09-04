import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { loginAsDev, loginWithGoogleToken, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      loginAsDev(email);
    } else {
      loginAsDev('oliver.brown@domain.io');
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 select-none font-sans">
      {/* Centered Login Card - Pixel-matched to Figma Screen 1 */}
      <div className="w-full max-w-[400px] bg-white border border-gray-100/80 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Login</h1>

        {/* Login with Google Button */}
        <button
          onClick={() => loginAsDev('oliver.brown@domain.io')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#E8F8F0] hover:bg-[#d8f2e4] text-gray-800 text-sm font-medium rounded-xl transition-all mb-5 border border-[#A7F3D0]/40"
        >
          {/* Google Multicolor SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Log in with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-gray-400 font-normal whitespace-nowrap">
            or sign up through email
          </span>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleManualLogin} className="space-y-3.5 text-left">
          <div>
            <input
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A34D]/30 transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A34D]/30 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#00A34D] hover:bg-[#008c42] text-white font-semibold text-sm rounded-xl shadow-sm transition-all transform active:scale-[0.99] mt-2"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* Quick Reviewer Presets */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-3 text-xs text-gray-400">
          <span>Reviewer Presets:</span>
          <button
            type="button"
            onClick={() => loginAsDev('mitrajit@reachinbox.ai')}
            className="text-[#00A34D] hover:underline font-medium"
          >
            Mitrajit
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => loginAsDev('yadav036@reachinbox.ai')}
            className="text-[#00A34D] hover:underline font-medium"
          >
            Yadav036
          </button>
        </div>
      </div>
    </div>
  );
};
