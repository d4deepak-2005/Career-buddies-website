import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (userEmail: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [userRole, setUserRole] = useState<'mentee' | 'mentor'>('mentee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess(email || 'user@careerbuddies.in');
      onClose();
    }, 600);
  };

  const handleForgotPassword = () => {
    if (!email) {
      setMessage('Please enter your work email above to receive a password reset link.');
    } else {
      setMessage(`A password reset link has been dispatched to ${email}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#cbdaff] max-h-[92vh] flex flex-col">
        
        {/* Header with Official Master Logo */}
        <div className="px-6 py-5 bg-[#002869] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo
              size="sm"
              variant="white"
              showTagline={false}
              className="brightness-200"
            />
            <h3 className="font-black text-sm tracking-tight">
              {mode === 'login' ? 'Account Sign In' : 'Create New Account'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#dae2ff] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Log In vs Sign Up) */}
        <div className="grid grid-cols-2 p-1.5 bg-[#f1f3ff] border-b border-[#cbdaff]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setMessage(null);
            }}
            className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-[#002869] text-white shadow-xs' 
                : 'text-[#434652] hover:text-[#061b3b]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setMessage(null);
            }}
            className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'signup' 
                ? 'bg-[#002869] text-white shadow-xs' 
                : 'text-[#434652] hover:text-[#061b3b]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          
          {/* Role selector */}
          <div className="flex bg-[#f1f3ff] p-1 rounded-2xl border border-[#cbdaff]/70">
            <button
              type="button"
              onClick={() => setUserRole('mentee')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                userRole === 'mentee' ? 'bg-[#002869] text-white shadow-xs' : 'text-[#434652] hover:text-[#061b3b]'
              }`}
            >
              I am a Candidate / Learner
            </button>
            <button
              type="button"
              onClick={() => setUserRole('mentor')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                userRole === 'mentor' ? 'bg-[#002869] text-white shadow-xs' : 'text-[#434652] hover:text-[#061b3b]'
              }`}
            >
              I am an Advisor / Expert
            </button>
          </div>

          {message && (
            <div className="p-3 bg-[#e8f5e9] border border-[#a5d6a7] text-[#1b5e20] text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-1">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-black text-[#061b3b] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs text-[#061b3b] focus:outline-none focus:border-[#002869]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-[#061b3b] mb-1">
                Work / Personal Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.sharma@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs text-[#061b3b] focus:outline-none focus:border-[#002869]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-[#061b3b]">
                  Password
                </label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-[#002869] hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs text-[#061b3b] focus:outline-none focus:border-[#002869]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747783] hover:text-[#061b3b]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-1"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In with Email' : 'Create CareerBuddies Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
                </>
              )}
            </button>

            {/* Social Authentication Options */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-[#cbdaff]" />
              <span className="text-[10px] font-black uppercase text-[#747783] tracking-wider">
                Or Continue With
              </span>
              <div className="flex-1 h-px bg-[#cbdaff]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Google */}
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    onSuccess('google.user@gmail.com');
                    onClose();
                  }, 500);
                }}
                className="py-2 px-2.5 rounded-xl border border-[#cbdaff] bg-white hover:bg-[#f1f3ff] text-xs font-bold text-[#061b3b] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    onSuccess('linkedin.candidate@linkedin.com');
                    onClose();
                  }, 500);
                }}
                className="py-2 px-2.5 rounded-xl border border-[#cbdaff] bg-white hover:bg-[#f1f3ff] text-xs font-bold text-[#061b3b] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>LinkedIn</span>
              </button>

              {/* Outlook / Microsoft */}
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    onSuccess('outlook.user@outlook.com');
                    onClose();
                  }, 500);
                }}
                className="py-2 px-2.5 rounded-xl border border-[#cbdaff] bg-white hover:bg-[#f1f3ff] text-xs font-bold text-[#061b3b] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                <span>Outlook</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    onSuccess('facebook.user@facebook.com');
                    onClose();
                  }, 500);
                }}
                className="py-2 px-2.5 rounded-xl border border-[#cbdaff] bg-white hover:bg-[#f1f3ff] text-xs font-bold text-[#061b3b] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </form>

          {/* Switch Mode Toggle */}
          <div className="text-center pt-3 border-t border-[#cbdaff]/70 text-xs text-[#434652]">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#002869] font-black hover:underline cursor-pointer"
                >
                  Sign Up Here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-[#002869] font-black hover:underline cursor-pointer"
                >
                  Log In Here
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthModal;
