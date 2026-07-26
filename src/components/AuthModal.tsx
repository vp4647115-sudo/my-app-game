import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

interface AuthModalProps {
  onSuccess: (userEmail: string) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSupabaseConfigured && supabase) {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
      }
      onSuccess(email);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121411]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="glass-panel p-6 md:p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl space-y-6 text-[#e3e3de]">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4AF37]">lock</span>
            <h3 className="font-headline text-xl font-bold text-[#FAF9F6]">
              {isSignUp ? 'Create Sanctum Account' : 'Sign In to Master'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#c4c7c7] hover:text-[#FAF9F6] p-1 rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-300 text-xs font-body">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="grandmaster@chess.com"
              className="w-full bg-[#1e201d] border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#1e201d] border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-[#FAF9F6] text-[#121411] font-body text-xs font-bold uppercase tracking-wider hover:bg-white active:scale-95 transition-all shadow cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-body text-xs text-[#c4c7c7] hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Register Now"}
          </button>
        </div>
      </div>
    </div>
  );
};
