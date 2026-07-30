import React, { useState } from 'react';
import {
  getSupabase,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseReady,
} from '../services/supabaseClient';
import { ErpAuthModal, ErpUserSession } from './ErpAuthModal';

interface LoginLandingScreenProps {
  onLoginSuccess: (email: string, name?: string, avatarUrl?: string) => void;
  onPlayAsGuest: () => void;
}

export const LoginLandingScreen: React.FC<LoginLandingScreenProps> = ({
  onLoginSuccess,
  onPlayAsGuest,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // ERP Auth Modal State
  const [isErpModalOpen, setIsErpModalOpen] = useState(false);

  // Supabase Config State
  const initialCreds = getSupabaseCredentials();
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(initialCreds.url);
  const [customKey, setCustomKey] = useState(initialCreds.key);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMsg('Please enter both Supabase URL and Anon Key.');
      return;
    }
    const client = saveSupabaseCredentials(customUrl, customKey);
    if (client) {
      setKeySaveSuccess(true);
      setErrorMsg(null);
      setInfoMsg('Supabase API keys saved and connected successfully!');
      setTimeout(() => {
        setKeySaveSuccess(false);
        setShowKeyConfig(false);
      }, 1500);
    } else {
      setErrorMsg('Failed to initialize Supabase client with provided keys.');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const client = getSupabase();

    try {
      if (client) {
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } else {
        // Instant Google Auth sync for preview environment
        setInfoMsg('Connecting via Google Account...');
        setTimeout(() => {
          onLoginSuccess(
            'grandmaster.google@gmail.com',
            'Google Grandmaster',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuA6xTNEwFjfA7-dpbYxtGhuyRNVpjM3s7bt5AwyA06tElZEecAVhx26oEJIymkWKUGPyHZL4xu3uA2ayXLYORI-2Onlt3UmYmHbusMxjo3wNt2CtRAS5Nn1IBM18qZDBgPjHgZNdgCj32ikLQ0-ZAxPS-zHXkvbr9KrG6HigoItT6Guc70T18aZAspcgVla-k7YHbp-JWRy5jeIzgkod5HYaGpMfq_3uoOE8j5U1j9eoEveVSC7q8Qj27hi32RhtC0x50O2T_HVka5q'
          );
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Auth failed. Please check credentials.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const client = getSupabase();

    try {
      if (client) {
        if (activeTab === 'signup') {
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName || email.split('@')[0] },
            },
          });
          if (error) throw error;
          if (data?.user && !data.session) {
            setInfoMsg('Account created successfully! Check your email or click Enter Sanctum.');
            setLoading(false);
            setTimeout(() => {
              onLoginSuccess(email, fullName || email.split('@')[0]);
            }, 1200);
            return;
          }
        } else {
          const { error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
      }
      onLoginSuccess(email, fullName || email.split('@')[0]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  const isConnected = isSupabaseReady();

  return (
    <div className="min-h-screen bg-[#121411] text-[#e3e3de] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo & Branding Header with Enter Game Action */}
        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={onPlayAsGuest}
            className="inline-flex items-center justify-center p-4 bg-[#FAF9F6]/5 rounded-2xl border border-[#D4AF37]/40 shadow-2xl backdrop-blur-md hover:border-[#D4AF37] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Click Logo to Enter Game"
          >
            <span className="material-symbols-outlined text-5xl text-[#D4AF37] group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] transition-all">
              chess
            </span>
          </button>
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-[#FAF9F6] gold-shimmer">
              VPN Chess
            </h1>
            <p className="font-body text-xs text-[#c4c7c7] uppercase tracking-widest mt-1">
              Grandmaster Protocols & Online Arena
            </p>
          </div>
        </div>

        {/* Primary Instant Enter Game CTA */}
        <button
          type="button"
          onClick={onPlayAsGuest}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#f3d368] to-[#D4AF37] hover:brightness-110 text-[#121411] font-headline text-sm font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 border border-[#FAF9F6]/40"
        >
          <span className="material-symbols-outlined text-xl font-bold">sports_esports</span>
          <span>ENTER GAME NOW</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>

        {/* Main Authentication Card */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs font-body flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 text-xs font-body flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Primary Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-body text-xs font-bold tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{googleLoading ? 'CONNECTING GOOGLE...' : 'CONTINUE WITH GOOGLE'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#121411] px-3 font-body text-[10px] text-[#c4c7c7] font-bold uppercase tracking-widest shrink-0">
              OR LOGIN WITH EMAIL
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex bg-[#1e201d] p-1 rounded-xl border border-white/10 text-xs font-body font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-[#D4AF37] text-[#121411] shadow-md'
                  : 'text-[#c4c7c7] hover:text-white'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[#D4AF37] text-[#121411] shadow-md'
                  : 'text-[#c4c7c7] hover:text-white'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === 'signup' && (
              <div>
                <label className="block font-body text-[10px] font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
                  Full Name / Username
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alexander Thorne"
                  className="w-full bg-[#1e201d] border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}

            <div>
              <label className="block font-body text-[10px] font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grandmaster@chess.com"
                className="w-full bg-[#1e201d] border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block font-body text-[10px] font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1e201d] border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#FAF9F6] text-[#121411] font-body text-xs font-bold uppercase tracking-wider hover:bg-white active:scale-95 transition-all shadow cursor-pointer disabled:opacity-60"
            >
              {loading ? 'AUTHENTICATING...' : activeTab === 'signup' ? 'REGISTER & ENTER GAME' : 'LOGIN & ENTER GAME'}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center font-body text-[11px] text-[#c4c7c7]/50">
          VPN Chess Secure Engine • All Rights Reserved
        </p>
      </div>
    </div>
  );
};
