import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, Loader2, Github, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, signup, loginWithGoogle, firebaseUser, user, resendVerification } = useAuth();

  const SECRET_ADMIN_KEY = "ALI_VELIX_2026"; // Our secret key

  // Automatically close modal when user is logged in and verified
  useEffect(() => {
    if (firebaseUser && firebaseUser.emailVerified && user) {
      onClose();
    }
  }, [firebaseUser, user, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, name, password);
      }
      // Modal will close via useEffect once firebaseUser and user profile are ready
    } catch (err: any) {
      console.error(err);
      // Make Firebase errors more readable
      let msg = err.message || 'An error occurred';
      if (msg.includes('auth/user-not-found')) msg = 'No account found with this email. Please sign up.';
      if (msg.includes('auth/wrong-password')) msg = 'Incorrect password. Please try again.';
      if (msg.includes('auth/email-already-in-use')) msg = 'This email is already registered. Please sign in.';
      if (msg.includes('auth/invalid-credential')) msg = 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (firebaseUser && !firebaseUser.emailVerified) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card w-full max-w-md p-8 relative z-10 text-center"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-white/30">
            <X className="w-6 h-6" />
          </button>

          <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-brand-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-white/50 text-sm mb-8">
            We've sent a verification code to <span className="text-white font-medium">{firebaseUser.email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-xl bg-brand-primary text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              I've Verified My Email
            </button>
            <button 
              onClick={resendVerification}
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Resend Verification Email
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-white/50 text-sm mb-8">
          {isLogin ? 'Sign in to continue your AI journey' : 'Join Velix AI and unlock the future'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand-primary transition-colors"
                  required
                />
              </div>
              
              <div className="mt-2">
                <button 
                  type="button"
                  onClick={() => setShowAdminKey(!showAdminKey)}
                  className="text-[10px] text-white/20 uppercase tracking-widest hover:text-brand-primary transition-colors"
                >
                  {showAdminKey ? '- Hide Admin Access' : '+ Use Admin Key'}
                </button>
                {showAdminKey && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-2"
                  >
                    <input 
                      type="password" 
                      placeholder="Enter Secret Admin Key"
                      value={adminKey}
                      onChange={e => setAdminKey(e.target.value)}
                      className="w-full bg-brand-primary/5 border border-brand-primary/20 rounded-xl py-2 px-4 text-xs outline-none focus:border-brand-primary transition-colors"
                    />
                  </motion.div>
                )}
              </div>
            </>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input 
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-brand-primary text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">OR CONTINUE WITH</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mt-6">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] text-black font-bold">G</div>
            <span className="text-sm">Continue with Google</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-primary font-semibold"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
