import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  CalendarCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Edit3, 
  BarChart3, 
  Star,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import RatingStars from '../components/RatingStars';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); 
  // 'analytics', 'approvals', 'categories', 'orders', 'requests', 'disputes'

  const [analytics, setAnalytics] = useState(null);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, name: '', description: '', icon: 'Sparkles' });

  // Dispute resolution modal
  const [disputeModal, setDisputeModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminDecision, setAdminDecision] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [anRes, entRes, catRes, ordRes, reqRes, dispRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminEntrepreneurs(),
        api.getCategories(),
        api.getOrders(),
        api.getServiceRequests(),
        api.getDisputes()
      ]);

      if (anRes.success) setAnalytics(anRes);
      if (entRes.success) setEntrepreneurs(entRes.entrepreneurs || []);
      if (catRes.success) setCategories(catRes.categories || []);
      if (ordRes.success) setOrders(ordRes.orders || []);
      if (reqRes.success) setRequests(reqRes.requests || []);
      if (dispRes.success) setDisputes(dispRes.disputes || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Verification actions
  const handleUpdateVerification = async (id, status, reason = '') => {
    try {
      const res = await api.updateEntrepreneurVerification(id, status, reason);
      if (res.success) {
        showToast(`Entrepreneur status updated to ${status}`);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Verification update failed');
    }
  };

  // Category management
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (catForm.id) {
        await api.updateCategory(catForm.id, catForm);
        showToast('Category updated');
      } else {
        await api.createCategory(catForm);
        showToast('New category created');
      }
      setCatModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.deleteCategory(id);
      showToast('Category deleted');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // Dispute resolution
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute || !adminDecision.trim()) return;

    try {
      const res = await api.resolveDispute(selectedDispute.id, adminDecision.trim());
      if (res.success) {
        showToast(`Dispute #${selectedDispute.id} marked as Resolved`);
        setDisputeModal(false);
        setSelectedDispute(null);
        setAdminDecision('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to resolve dispute');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-3 font-semibold">Loading admin console & analytics...</p>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};
  const charts = analytics?.charts || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-indigo-500/40 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administration & Verification Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            HunarHub SuperAdmin Control Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor KPIs, verify micro-entrepreneurs, resolve disputes, and maintain trades.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-2 sm:space-x-4 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'analytics', label: 'Platform Analytics & KPIs', icon: BarChart3 },
          { id: 'approvals', label: `Entrepreneur Approvals (${entrepreneurs.filter(e => e.status === 'pending').length} Pending)`, icon: Users },
          { id: 'categories', label: `Categories & Trades (${categories.length})`, icon: Layers },
          { id: 'requests', label: `Monitor Bookings (${requests.length})`, icon: CalendarCheck },
          { id: 'orders', label: `Monitor Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'disputes', label: `Disputes & Complaints (${disputes.filter(d => d.status === 'Open').length} Open)`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
              className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: PLATFORM ANALYTICS & MANDATORY KPIS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Registered Entrepreneurs */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Entrepreneurs</span>
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{kpis.totalEntrepreneurs}</p>
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">{kpis.approvedEntrepreneurs} Approved</span>
                <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">{kpis.pendingEntrepreneurs} Pending</span>
              </div>
            </div>

            {/* 2. Active Users */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Platform Active Users</span>
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{kpis.totalUsers}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {kpis.totalCustomers} registered customers exploring local skills
              </p>
            </div>

            {/* 3. Service Request Conversion Rate */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Service Conversion Rate</span>
                <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{kpis.conversionRate}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {kpis.completedRequests} completed out of {kpis.totalRequests} total requests
              </p>
            </div>

            {/* 4. Product Sales Volume */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Product Sales Volume</span>
                <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{kpis.productSalesUnits} units</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total Product Gross: ₹{Number(kpis.totalProductRevenue).toFixed(2)}
              </p>
            </div>

            {/* 5. Average Entrepreneur Earnings */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Entrepreneur Earnings</span>
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">₹{kpis.avgEntrepreneurEarnings}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                From ₹{Number(kpis.totalPlatformRevenue).toFixed(2)} total completed transactions
              </p>
            </div>

            {/* 6. Customer Satisfaction Ratings */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Customer Satisfaction</span>
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{kpis.avgSatisfactionRating} ★</p>
                <span className="text-xs text-slate-400 dark:text-slate-500">/ 5.0</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Calculated across {kpis.totalReviews} verified post-service customer reviews
              </p>
            </div>
          </div>

          {/* Visual Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Sales Volume Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Completed Sales Trend (Last 6 Months)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Revenue in ₹ from successfully delivered products.</p>

              {charts.monthlySales?.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">No sales recorded yet.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {charts.monthlySales?.map((item) => {
                    const maxRev = Math.max(...charts.monthlySales.map((x) => Number(x.revenue) || 1));
                    const pct = Math.round((Number(item.revenue) / maxRev) * 100);
                    return (
                      <div key={item.month} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>{item.month}</span>
                          <span className="font-bold text-slate-900 dark:text-white">₹{Number(item.revenue).toFixed(0)} ({item.count} orders)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(10, pct)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Breakdown Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span>Micro-Entrepreneurs by Trade / Category</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of registered local talent across crafts.</p>

              <div className="space-y-3 pt-2">
                {charts.categoryBreakdown?.map((item) => {
                  const maxCount = Math.max(...charts.categoryBreakdown.map((x) => Number(x.count) || 1));
                  const pct = Math.round((Number(item.count) / maxCount) * 100);
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{item.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.count} artisans</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(10, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ENTREPRENEUR VERIFICATION & APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Entrepreneur Approvals & Verification</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New micro-entrepreneurs are hidden from public view until approved by admin.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {entrepreneurs.map((ent) => (
              <div key={ent.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={ent.profile_photo || '/images/seller.jpg'}
                    alt={ent.business_name}
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                    onError={(e) => { e.target.src = '/images/seller.jpg'; }}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{ent.business_name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ent.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' :
                        ent.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' :
                        'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                      }`}>
                        {ent.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{ent.skill_type} • {ent.category_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Owner: {ent.owner_name} ({ent.owner_email}) • {ent.area}, {ent.city}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end md:self-auto">
                  {ent.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateVerification(ent.id, 'approved')}
                      id={`approve-btn-${ent.id}`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Verify</span>
                    </button>
                  )}

                  {ent.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateVerification(ent.id, 'rejected', 'Verification check failed')}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:text-slate-300 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-colors"
                    >
                      Reject
                    </button>
                  )}

                  {ent.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateVerification(ent.id, 'suspended', 'Policy review')}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200/60 dark:border-amber-800/60 transition-colors"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: MANAGE CATEGORIES & SKILLS */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Category & Skill Management</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure marketplace categories: Cobbler, Potter, Tailor, Artisan, Small Vendor.</p>
            </div>
            <button
              onClick={() => {
                setCatForm({ id: null, name: '', description: '', icon: 'Sparkles' });
                setCatModal(true);
              }}
              id="admin-add-category-btn"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <CategoryBadge name={c.name} slug={c.slug} />
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{c.entrepreneur_count || 0} artisans</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{c.description || 'Active craft trade category'}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setCatForm(c);
                      setCatModal(true);
                    }}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: MONITOR SERVICE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">All Platform Service Bookings</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((r) => (
              <div key={r.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 dark:text-white">#{r.id} {r.service_title}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">{r.status}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Customer: {r.customer_name} • Artisan: {r.entrepreneur_name} ({r.entrepreneur_city})
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">₹{Number(r.total_price).toFixed(0)}</span>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px]">{r.booking_date} ({r.time_slot})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: MONITOR ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">All Platform Product Orders</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((o) => (
              <div key={o.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 dark:text-white">Order #{o.id}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">{o.status}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Customer: {o.customer_name} • Delivering to: {o.delivery_address}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">₹{Number(o.total_amount).toFixed(0)}</span>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">{o.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: DISPUTES & COMPLAINTS RESOLUTION */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Dispute & Complaint Handling Panel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Read grievances raised by customers or artisans, enter decisions, and mark resolved.</p>
            </div>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              No disputes filed on the platform.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 dark:text-white">Dispute #{d.id}</span>
                      <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                        {d.reason}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      d.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                    "{d.details}"
                  </p>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
                    <span>Raised by: <strong className="text-slate-800 dark:text-slate-200">{d.raised_by_name}</strong> ({d.raised_by_email})</span>
                    {d.admin_decision ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        Admin Decision: {d.admin_decision}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setAdminDecision('');
                          setDisputeModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                      >
                        Write Decision & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Category Form */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {catForm.id ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Potter (Kumhar)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Craft description..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Dispute Resolution */}
      {disputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Resolve Dispute #{selectedDispute?.id}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grievance: "{selectedDispute?.details}"
            </p>
            <form onSubmit={handleResolveDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Admin Binding Decision *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter resolution notes, refund orders, or disciplinary findings to be emailed to both parties..."
                  value={adminDecision}
                  onChange={(e) => setAdminDecision(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Submit Decision & Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
