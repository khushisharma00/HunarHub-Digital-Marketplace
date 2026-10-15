import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Briefcase, 
  MapPin, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'entrepreneur' ? 'entrepreneur' : 'customer';

  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Entrepreneur specific fields
  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [skillType, setSkillType] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [area, setArea] = useState('');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && res.categories.length > 0) {
          setCategories(res.categories);
          setCategoryId(String(res.categories[0].id));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim()
      };

      if (role === 'entrepreneur') {
        payload.business_name = businessName.trim() || fullName.trim();
        payload.category_id = categoryId ? parseInt(categoryId, 10) : null;
        payload.skill_type = skillType.trim() || 'Traditional Craftsman';
        payload.experience_years = parseInt(experienceYears, 10) || 1;
        payload.bio = bio.trim();
        payload.city = city.trim();
        payload.area = area.trim() || 'Central Market';
      }

      const res = await api.register(payload);
      if (res.success) {
        login(res.token, res.user, res.entrepreneur);
        if (role === 'entrepreneur') {
          navigate('/entrepreneur/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Join HunarHub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Create an account to book local skilled services or showcase your craft
        </p>
      </div>

      {/* Account Type Toggle */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex max-w-sm mx-auto border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            role === 'customer'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          I am a Customer
        </button>
        <button
          type="button"
          onClick={() => setRole('entrepreneur')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            role === 'entrepreneur'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          I am a Micro-Entrepreneur
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/50 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Your Full Name *
              </label>
              <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  id="reg-fullname-input"
                  placeholder="e.g. Ramesh Prajapati"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Phone Number
              </label>
              <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
                <Phone className="w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Email Address *
            </label>
            <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                id="reg-email-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Password (min 6 chars) *
              </label>
              <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  id="reg-password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Confirm Password *
              </label>
              <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  id="reg-confirm-password-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Micro-Entrepreneur Specific Profile Fields */}
          {role === 'entrepreneur' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Admin Verification Required:</span> To maintain platform quality and trust, new entrepreneur accounts start in "Pending" status and are reviewed by our admin team before being displayed to the public.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Store / Workshop Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Clay & Terracotta Works"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Primary Trade / Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Skill Type / Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traditional Potter & Clay Sculptor"
                    value={skillType}
                    onChange={(e) => setSkillType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Jaipur" className="dark:bg-slate-800">Jaipur (Rajasthan)</option>
                    <option value="Varanasi" className="dark:bg-slate-800">Varanasi (UP)</option>
                    <option value="Lucknow" className="dark:bg-slate-800">Lucknow (UP)</option>
                    <option value="Delhi" className="dark:bg-slate-800">Delhi NCR</option>
                    <option value="Mumbai" className="dark:bg-slate-800">Mumbai (Maharashtra)</option>
                    <option value="Agra" className="dark:bg-slate-800">Agra (UP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Local Area / Market Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assi Ghat / Sanganer / Aminabad"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Artisan Bio / Introduction
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your craft heritage, services offered, and why customers should book you..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="reg-submit-btn"
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Creating Account...' : `Register as ${role === 'entrepreneur' ? 'Micro-Entrepreneur' : 'Customer'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-orange-600 dark:text-orange-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
