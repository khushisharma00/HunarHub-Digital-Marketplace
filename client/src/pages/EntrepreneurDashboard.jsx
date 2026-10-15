import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  CalendarCheck, 
  ShoppingBag, 
  Package, 
  Wrench, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  IndianRupee,
  User,
  Save
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EntrepreneurDashboard() {
  const { user, entrepreneur, refreshUser } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeTab, setActiveTab] = useState('overview'); 
  // 'overview', 'requests', 'orders', 'services', 'products', 'slots', 'profile'

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Service form state
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({ id: null, title: '', description: '', price: '', duration_mins: 60 });

  // Product form state
  const [productModal, setProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ id: null, name: '', description: '', price: '', stock: 10, image_url: '' });

  // Slot form state
  const [slotModal, setSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ day_of_week: 'Monday', start_time: '10:00', end_time: '11:00' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    skill_type: '',
    experience_years: 5,
    bio: '',
    city: 'Jaipur',
    area: '',
    address: ''
  });

  const loadAllData = async () => {
    try {
      const [dashRes, reqRes, ordRes] = await Promise.all([
        api.getEntrepreneurDashboard(),
        api.getServiceRequests(),
        api.getOrders()
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes);
        const ent = dashRes.entrepreneur;
        setProfileForm({
          business_name: ent.business_name || '',
          skill_type: ent.skill_type || '',
          experience_years: ent.experience_years || 0,
          bio: ent.bio || '',
          city: ent.city || 'Jaipur',
          area: ent.area || '',
          address: ent.address || ''
        });

        // Load services & products
        const [sRes, pRes, slRes] = await Promise.all([
          api.getServices(`entrepreneur_id=${ent.id}`),
          api.getProducts(`entrepreneur_id=${ent.id}`),
          api.getAvailabilitySlots(ent.id)
        ]);

        if (sRes.success) setServices(sRes.services || []);
        if (pRes.success) setProducts(pRes.products || []);
        if (slRes.success) setSlots(slRes.slots || []);
      }

      if (reqRes.success) setRequests(reqRes.requests || []);
      if (ordRes.success) setOrders(ordRes.orders || []);
    } catch (err) {
      console.error('Failed to load entrepreneur dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Status handlers
  const handleUpdateReqStatus = async (id, status) => {
    try {
      const res = await api.updateServiceRequestStatus(id, status);
      if (res.success) {
        showToast(`Request #${id} marked as "${status}"`);
        loadAllData();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleUpdateOrdStatus = async (id, status) => {
    try {
      const res = await api.updateOrderStatus(id, status);
      if (res.success) {
        showToast(`Order #${id} marked as "${status}"`);
        loadAllData();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  // Service CRUD
  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (serviceForm.id) {
        await api.updateService(serviceForm.id, serviceForm);
        showToast('Service updated successfully');
      } else {
        await api.createService(serviceForm);
        showToast('New service created successfully');
      }
      setServiceModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error saving service');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.deleteService(id);
      showToast('Service deleted');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error deleting service');
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (productForm.id) {
        await api.updateProduct(productForm.id, productForm);
        showToast('Product updated successfully');
      } else {
        await api.createProduct(productForm);
        showToast('Product created successfully');
      }
      setProductModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      showToast('Product deleted');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error deleting product');
    }
  };

  // Slot CRUD
  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await api.addSlot(slotForm);
      showToast('Availability slot added');
      setSlotModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error adding slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await api.deleteSlot(id);
      showToast('Slot removed');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error removing slot');
    }
  };

  // Profile save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile(profileForm);
      showToast('Profile updated successfully');
      refreshUser();
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error updating profile');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-3 font-semibold">Loading artisan dashboard...</p>
      </div>
    );
  }

  const ent = dashboardData?.entrepreneur;
  const earnings = dashboardData?.earnings || { totalEarnings: 0, serviceEarnings: 0, productEarnings: 0, monthlyBreakdown: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-orange-500/40 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Verification Status Banner */}
      {ent?.status === 'pending' && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-amber-900 dark:text-amber-300 text-xs font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong className="font-bold">Profile Pending Admin Verification:</strong> Your profile is currently hidden from public search until reviewed by our verification team. You can still set up services and products.
            </span>
          </div>
        </div>
      )}

      {ent?.status === 'suspended' && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-red-900 dark:text-red-300 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span>Your entrepreneur profile has been suspended by the platform administrator.</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Artisan Portal</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              ent?.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            }`}>
              {ent?.status || 'Pending'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {ent?.business_name || 'My Artisan Store'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {ent?.skill_type} • {ent?.area}, {ent?.city}
          </p>
        </div>

        <Link
          to={`/entrepreneur/${ent?.id}`}
          className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:hover:bg-orange-900/60 dark:text-orange-300 rounded-xl text-xs font-bold border border-orange-200 dark:border-orange-800/80 transition-colors"
        >
          View Public Storefront
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-2 sm:space-x-4 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Earnings', icon: TrendingUp },
          { id: 'requests', label: `Service Bookings (${requests.length})`, icon: CalendarCheck },
          { id: 'orders', label: `Product Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'services', label: `My Services (${services.length})`, icon: Wrench },
          { id: 'products', label: `My Products (${products.length})`, icon: Package },
          { id: 'slots', label: `Availability Slots (${slots.length})`, icon: Clock },
          { id: 'profile', label: 'Store Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`tab-ent-${tab.id}`}
              className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: OVERVIEW & EARNINGS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Earnings Cards (COMPLETED ONLY!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total Completed Earnings</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">₹{Number(earnings.totalEarnings).toFixed(2)}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Strictly from completed orders & jobs</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Service Bookings Earnings</span>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">₹{Number(earnings.serviceEarnings).toFixed(2)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{earnings.completedServicesCount} completed services</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Product Sales Revenue</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">₹{Number(earnings.productEarnings).toFixed(2)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{earnings.completedProductsUnits} units delivered</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Pending Attention</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {(dashboardData?.counts?.pendingRequestsCount || 0) + (dashboardData?.counts?.activeOrdersCount || 0)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Active requests & orders</p>
            </div>
          </div>

          {/* Monthly Earnings Table / Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Monthly Earnings Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Earnings recorded only upon service completion or delivery confirmation.</p>

            {earnings.monthlyBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4">No completed orders yet this period.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {earnings.monthlyBreakdown.map((m) => (
                  <div key={m.month} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.month}</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg">
                      ₹{m.earnings.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: SERVICE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Incoming Service Booking Requests</h3>
          {requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              No booking requests received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white text-sm">Booking #{r.id}</span>
                      <span className="ml-2 font-bold text-orange-600 dark:text-orange-400 text-xs">{r.service_title}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      Status: {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Customer:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{r.customer_name}</p>
                      <p className="text-slate-500 dark:text-slate-400">{r.customer_phone || r.customer_email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Scheduled:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{r.booking_date}</p>
                      <p className="text-slate-500 dark:text-slate-400">{r.time_slot}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Service Fee:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">₹{Number(r.total_price).toFixed(0)}</p>
                      <p className={`text-[11px] font-bold ${r.payment_status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {r.payment_method || 'Pay on completion'} ({r.payment_status || 'Pending'})
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Address:</span> {r.address}
                  </div>

                  {/* Entrepreneur Status Transitions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
                    {r.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReqStatus(r.id, 'Accepted')}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
                        >
                          Accept Booking
                        </button>
                        <button
                          onClick={() => handleUpdateReqStatus(r.id, 'Rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:text-slate-300 rounded-lg text-xs font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {r.status === 'Accepted' && (
                      <button
                        onClick={() => handleUpdateReqStatus(r.id, 'In progress')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                      >
                        Start Service (In Progress)
                      </button>
                    )}

                    {r.status === 'In progress' && (
                      <button
                        onClick={() => handleUpdateReqStatus(r.id, 'Completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Mark as Completed (Collect Cash/UPI)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: PRODUCT ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Orders Containing Your Handmade Products</h3>
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              No product orders received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">Order #{o.id}</span>
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {o.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {o.items?.map((it) => (
                      <div key={it.id} className="flex justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300">{it.quantity}x {it.product_name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{it.total_price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center text-xs gap-2">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Payment: </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        o.payment_status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {o.payment_method || 'Pay on Delivery'} ({o.payment_status || 'Pending'})
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      <span className="font-semibold text-slate-400 dark:text-slate-500">Deliver to: </span>
                      <span>{o.delivery_address}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
                    {o.status === 'Placed' && (
                      <button
                        onClick={() => handleUpdateOrdStatus(o.id, 'Confirmed')}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
                      >
                        Confirm Order
                      </button>
                    )}

                    {o.status === 'Confirmed' && (
                      <button
                        onClick={() => handleUpdateOrdStatus(o.id, 'Ready')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                      >
                        Mark Package Ready
                      </button>
                    )}

                    {o.status === 'Ready' && (
                      <button
                        onClick={() => handleUpdateOrdStatus(o.id, 'Completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Mark Delivered & Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: MY SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Skill & Service Listings</h3>
            <button
              onClick={() => {
                setServiceForm({ id: null, title: '', description: '', price: '', duration_mins: 60 });
                setServiceModal(true);
              }}
              id="add-new-service-btn"
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <div key={svc.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{svc.title}</h4>
                    <span className="font-black text-slate-900 dark:text-white text-base">₹{Number(svc.price).toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{svc.description}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Duration: ~{svc.duration_mins} mins</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setServiceForm(svc);
                      setServiceModal(true);
                    }}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(svc.id)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: MY PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Handmade Products Store</h3>
            <button
              onClick={() => {
                setProductForm({ id: null, name: '', description: '', price: '', stock: 10, image_url: '' });
                setProductModal(true);
              }}
              id="add-new-product-btn"
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div key={prod.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex space-x-3">
                  <img
                    src={prod.image_url || '/images/pottery.jpg'}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-50 dark:bg-slate-800 flex-shrink-0"
                    onError={(e) => { e.target.src = '/images/pottery.jpg'; }}
                  />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{prod.name}</h4>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">₹{Number(prod.price).toFixed(0)}</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">Stock: {prod.stock} units</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setProductForm(prod);
                      setProductModal(true);
                    }}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: AVAILABILITY SLOTS */}
      {activeTab === 'slots' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Manage Weekly Availability Slots</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customers can only book service requests during these open slots.</p>
            </div>
            <button
              onClick={() => setSlotModal(true)}
              id="add-slot-btn"
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {slots.map((s) => (
              <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{s.day_of_week}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold">{s.start_time} - {s.end_time}</p>
                </div>
                <button
                  onClick={() => handleDeleteSlot(s.id)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: STORE PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Store Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Business Name</label>
              <input
                type="text"
                required
                value={profileForm.business_name}
                onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Skill Specialization</label>
                <input
                  type="text"
                  required
                  value={profileForm.skill_type}
                  onChange={(e) => setProfileForm({ ...profileForm, skill_type: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Years of Experience</label>
                <input
                  type="number"
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">City</label>
                <input
                  type="text"
                  required
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Area / Market</label>
                <input
                  type="text"
                  required
                  value={profileForm.area}
                  onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Bio / Story</label>
              <textarea
                rows={4}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Service Form */}
      {serviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {serviceForm.id ? 'Edit Service' : 'Add New Service Listing'}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Sole Resoling / Kurti Stitching"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Service details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={serviceForm.duration_mins}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_mins: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Product Form */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {productForm.id ? 'Edit Product' : 'Add New Handmade Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="/images/pottery.jpg"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Slot Form */}
      {slotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Availability Time Slot</h3>
            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Day of Week</label>
                <select
                  value={slotForm.day_of_week}
                  onChange={(e) => setSlotForm({ ...slotForm, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSlotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
