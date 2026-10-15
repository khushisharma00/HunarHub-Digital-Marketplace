import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.success) {
        login(res.token, res.user, res.entrepreneur);
        if (redirectPath) {
          navigate(redirectPath);
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'entrepreneur') {
          navigate('/entrepreneur/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click credentials autofill for testing
  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@hunarhub.com');
      setPassword('admin123');
    } else if (role === 'entrepreneur') {
      setEmail('ramprasad@hunarhub.com');
      setPassword('password123');
    } else {
      setEmail('customer@hunarhub.com');
      setPassword('password123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome Back to HunarHub
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign in to access your bookings, orders, and dashboard
        </p>
      </div>

      {/* Demo Credentials Quick Switcher Banner */}
      <div className="bg-orange-50/80 dark:bg-orange-950/40 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 text-xs space-y-2">
        <p className="font-bold text-orange-900 dark:text-orange-300 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span>Quick Demo Logins (Click to Autofill):</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            id="demo-login-customer"
            onClick={() => setDemoCredentials('customer')}
            className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold hover:bg-orange-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1 transition-colors"
          >
            <UserCheck className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            id="demo-login-artisan"
            onClick={() => setDemoCredentials('entrepreneur')}
            className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold hover:bg-orange-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1 transition-colors"
          >
            <Briefcase className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Artisan</span>
          </button>
          <button
            type="button"
            id="demo-login-admin"
            onClick={() => setDemoCredentials('admin')}
            className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold hover:bg-orange-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1 transition-colors"
          >
            <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/50 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Email Address
            </label>
            <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                id="login-email-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Password
            </label>
            <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                id="login-password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-orange-600 dark:text-orange-400 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
