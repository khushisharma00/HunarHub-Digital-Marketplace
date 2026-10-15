import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import DisputeModal from '../components/DisputeModal';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'orders'
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [reviewModalTarget, setReviewModalTarget] = useState(null);
  const [disputeModalTarget, setDisputeModalTarget] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, ordRes] = await Promise.all([
        api.getServiceRequests(),
        api.getOrders()
      ]);
      if (reqRes.success) setRequests(reqRes.requests || []);
      if (ordRes.success) setOrders(ordRes.orders || []);
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this service request?')) return;
    try {
      const res = await api.updateServiceRequestStatus(id, 'Cancelled', 'Cancelled by customer');
      if (res.success) {
        setActionNotice('Service request cancelled.');
        setTimeout(() => setActionNotice(''), 3000);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await api.updateOrderStatus(id, 'Cancelled', 'Cancelled by customer');
      if (res.success) {
        setActionNotice('Order cancelled. Inventory has been automatically restored.');
        setTimeout(() => setActionNotice(''), 3000);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
      case 'Accepted':
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
      case 'In progress':
      case 'Ready':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800';
      case 'Disputed':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/80 dark:text-yellow-300 dark:border-yellow-800';
    }
  };

  const filteredRequests = requests.filter((r) => 
    filterStatus === 'all' ? true : r.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const filteredOrders = orders.filter((o) =>
    filterStatus === 'all' ? true : o.status.toLowerCase() === filterStatus.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Action Notice */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-fade-in">
          {actionNotice}
        </div>
      )}

      {/* Review & Dispute Modals */}
      <ReviewModal
        isOpen={!!reviewModalTarget}
        onClose={() => setReviewModalTarget(null)}
        target={reviewModalTarget}
        onSuccess={loadData}
      />

      <DisputeModal
        isOpen={!!disputeModalTarget}
        onClose={() => setDisputeModalTarget(null)}
        target={disputeModalTarget}
        onSuccess={loadData}
      />

      {/* Greeting Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Customer Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Namaste, {user?.full_name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your service requests, handmade orders, and leave reviews for artisans.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/browse"
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Find Artisans
          </Link>
          <Link
            to="/products"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            Shop Crafts
          </Link>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
        <div className="flex space-x-6">
          <button
            onClick={() => { setActiveTab('requests'); setFilterStatus('all'); }}
            id="tab-service-requests"
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'requests'
                ? 'border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Service Requests ({requests.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setFilterStatus('all'); }}
            id="tab-product-orders"
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'orders'
                ? 'border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Product Orders ({orders.length})</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-semibold outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted / Confirmed</option>
            <option value="in progress">In Progress / Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
          Loading your dashboard activities...
        </div>
      ) : activeTab === 'requests' ? (
        // Service Requests List
        filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <CalendarCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Service Requests Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">You haven't placed any bookings matching this status.</p>
            <Link
              to="/browse"
              className="inline-block px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold"
            >
              Book an Artisan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-slate-900 dark:text-white text-sm">Request #{req.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Booked on {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 font-semibold">Service</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{req.service_title}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">₹{Number(req.total_price).toFixed(0)} • Pay on Completion</p>
                  </div>

                  <div>
                    <p className="text-slate-400 dark:text-slate-500 font-semibold">Artisan / Workshop</p>
                    <Link to={`/entrepreneur/${req.entrepreneur_id}`} className="font-bold text-orange-600 dark:text-orange-400 hover:underline">
                      {req.entrepreneur_name}
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{req.entrepreneur_area}, {req.entrepreneur_city}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 dark:text-slate-500 font-semibold">Scheduled Appointment</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{req.booking_date}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{req.time_slot}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Fee: </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">₹{Number(req.total_price).toFixed(0)}</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold inline-flex items-center space-x-1 ${
                      req.payment_status === 'Paid'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <span>{req.payment_method || 'Pay on completion'}</span>
                      <span>• {req.payment_status || 'Pending'}</span>
                    </span>
                    <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">|</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">{req.address}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Review Button if Completed */}
                    {req.status === 'Completed' && (
                      req.review_id ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>Rated ({req.review_rating}★)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewModalTarget({ id: req.id, type: 'service_request', title: req.service_title })}
                          id={`review-btn-${req.id}`}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Leave Review</span>
                        </button>
                      )
                    )}

                    {/* Cancel button if pending or accepted */}
                    {['Pending', 'Accepted'].includes(req.status) && (
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:text-slate-200 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}

                    {/* Dispute button */}
                    {!['Cancelled', 'Disputed'].includes(req.status) && (
                      <button
                        onClick={() => setDisputeModalTarget({ id: req.id, type: 'service_request' })}
                        className="px-2.5 py-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold hover:underline"
                      >
                        Raise Dispute
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Product Orders List
        filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Orders Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">You haven't ordered any handmade products yet.</p>
            <Link
              to="/products"
              className="inline-block px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold"
            >
              Shop Handmade Crafts
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-slate-900 dark:text-white text-sm">Order #{ord.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Ordered on {new Date(ord.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items?.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{it.quantity}x</span>
                        <span className="text-slate-700 dark:text-slate-300">{it.product_name}</span>
                        <span className="text-slate-400 dark:text-slate-500">(By {it.seller_name})</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₹{it.total_price}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Total: </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">₹{Number(ord.total_amount).toFixed(0)}</span>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-lg text-xs font-bold inline-flex items-center space-x-1 ${
                      ord.payment_status === 'Paid'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <span>{ord.payment_method || 'Pay on Delivery'}</span>
                      <span>• {ord.payment_status}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Review Button if Completed */}
                    {ord.status === 'Completed' && (
                      ord.review_id ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>Reviewed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewModalTarget({ id: ord.id, type: 'order' })}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Rate Product</span>
                        </button>
                      )
                    )}

                    {['Placed', 'Confirmed'].includes(ord.status) && (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:text-slate-200 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}

                    {!['Cancelled'].includes(ord.status) && (
                      <button
                        onClick={() => setDisputeModalTarget({ id: ord.id, type: 'order' })}
                        className="px-2.5 py-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold hover:underline"
                      >
                        Raise Dispute
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
