import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Store, 
  User, 
  Lock, 
  Phone, 
  LogIn, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { navigate } = useRouter();
  const { login, loginAsDemoCustomer, loginAsDemoOwner } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setError('Please enter your phone number or email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(emailOrPhone.trim(), password);
      if (user.role === 'owner') {
        navigate('/business');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate('/')}
        className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black mx-auto shadow-md">
            FF
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome to FoodFlow
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to track orders or manage your food stall
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="e.g. 9820012345 or owner@foodflow.in"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Password (Optional for testing)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">Or Quick Demo</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={async () => {
              await loginAsDemoCustomer();
              navigate('/');
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Customer Demo</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await loginAsDemoOwner();
              navigate('/business');
            }}
            className="py-2.5 px-3 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/70 text-orange-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-orange-600" />
            <span>Stall Owner Demo</span>
          </button>
        </div>

        <div className="pt-2 text-center text-xs text-slate-500 font-medium">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-bold text-orange-600 hover:underline"
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
