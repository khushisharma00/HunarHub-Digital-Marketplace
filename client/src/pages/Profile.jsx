import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  LayoutDashboard,
  Save,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Profile() {
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showNotice = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      showNotice('error', 'Full name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateUserProfile(formData);
      if (res.success) {
        showNotice('success', 'Profile updated successfully!');
        // Refresh local user state
        const meRes = await api.getMe();
        if (meRes.success) {
          const currentToken = localStorage.getItem('hunarhub_token');
          login(currentToken, meRes.user, meRes.entrepreneur);
        }
      }
    } catch (err) {
      showNotice('error', err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password.length < 6) {
      showNotice('error', 'New password must be at least 6 characters long.');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      showNotice('error', 'New password and confirmation do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      if (res.success) {
        showNotice('success', 'Password changed successfully!');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordSection(false);
      }
    } catch (err) {
      showNotice('error', err.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  const dashboardPath = user?.role === 'entrepreneur' 
    ? '/entrepreneur/dashboard' 
    : user?.role === 'admin' 
    ? '/admin/dashboard' 
    : '/dashboard';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Link 
          to={dashboardPath}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">
          {user?.role} Profile
        </span>
      </div>

      {/* Notice Banner */}
      {feedback.message && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center space-x-3 animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Left Identity Card, Right Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-orange-500/20">
              {user?.full_name?.charAt(0) || 'U'}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.full_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-left text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Account Role</span>
                </span>
                <span className="font-bold capitalize">{user?.role}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Member Since</span>
                </span>
                <span className="font-bold">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span>Contact Phone</span>
                </span>
                <span className="font-bold">{user?.phone || 'Not set'}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={dashboardPath}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Form: Personal Details & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Update your identity details across the HunarHub marketplace.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>{showPasswordSection ? 'Hide Password Settings' : 'Change Password'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form (Collapsible) */}
          {showPasswordSection && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <span>Security & Password</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ensure your account is protected with a secure password.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span>{passLoading ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
