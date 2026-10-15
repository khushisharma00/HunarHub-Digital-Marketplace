import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  ShoppingBag, 
  Wrench, 
  Star, 
  CheckCircle, 
  ArrowLeft,
  CalendarCheck,
  Package
} from 'lucide-react';
import { api } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import RatingStars from '../components/RatingStars';
import { useCart } from '../context/CartContext';

export default function EntrepreneurProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('services'); // 'services', 'products', 'schedule', 'reviews'
  const { addToCart } = useCart();
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await api.getEntrepreneurById(id);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to load entrepreneur profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setToast(`Added "${product.name}" to your cart!`);
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-3 font-semibold">Loading entrepreneur profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm font-semibold">
          {error || 'Entrepreneur profile not found'}
        </div>
        <Link to="/browse" className="inline-flex items-center space-x-1 text-sm font-bold text-orange-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>
      </div>
    );
  }

  const { entrepreneur, services = [], products = [], availabilitySlots = [], reviews = [] } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-orange-500/40 animate-fade-in">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-semibold">{toast}</span>
          <Link to="/cart" className="text-xs text-orange-400 underline font-bold ml-2">View Cart</Link>
        </div>
      )}

      {/* Back link */}
      <Link to="/browse" className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Browse Talent</span>
      </Link>

      {/* Entrepreneur Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-44 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 relative">
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5 shadow-sm border border-transparent dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Admin Verified Profile</span>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-3 sm:space-y-0 sm:space-x-5">
              <img
                src={entrepreneur.profile_photo || '/images/seller.jpg'}
                alt={entrepreneur.business_name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-800"
                onError={(e) => { e.target.src = '/images/seller.jpg'; }}
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {entrepreneur.business_name}
                  </h1>
                  <CategoryBadge name={entrepreneur.category_name} slug={entrepreneur.category_slug} />
                </div>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{entrepreneur.skill_type}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>{entrepreneur.area}, {entrepreneur.city}</span>
                  </span>
                  <span>•</span>
                  <span>{entrepreneur.experience_years} Years Experience</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-200 font-bold">
                    <RatingStars rating={entrepreneur.rating_avg} size="w-3.5 h-3.5" />
                    <span>{entrepreneur.rating_avg} ({entrepreneur.rating_count} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {services.length > 0 && (
              <Link
                to={`/book-service?entrepreneur_id=${entrepreneur.id}`}
                id="book-service-top-btn"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 text-center transition-all flex items-center justify-center space-x-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book Service Now</span>
              </Link>
            )}
          </div>

          {/* Bio text */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">About the Artisan</h4>
            <p>{entrepreneur.bio || 'Experienced local craftsman offering specialized repair and handmade services.'}</p>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6">
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'services'
              ? 'border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Services Offered ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'products'
              ? 'border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Handmade Store ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'schedule'
              ? 'border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Schedule ({availabilitySlots.length} slots)</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'reviews'
              ? 'border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Customer Reviews ({reviews.length})</span>
        </button>
      </div>

      {/* Tab 1: Services Offered */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Available Services</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Pay on Service Completion</span>
          </div>

          {services.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
              No services listed at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-orange-300 dark:hover:border-orange-500/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{svc.title}</h4>
                      <span className="text-lg font-black text-slate-900 dark:text-white flex-shrink-0">
                        ₹{Number(svc.price).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{svc.description}</p>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>Approx {svc.duration_mins} mins</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
                      Pay on Completion
                    </span>
                    <Link
                      to={`/book-service?entrepreneur_id=${entrepreneur.id}&service_id=${svc.id}`}
                      id={`book-service-${svc.id}`}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      Book This Service
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Handmade Products Store */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Handmade Products</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Pay on Delivery</span>
          </div>

          {products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
              No products listed at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={prod.image_url || '/images/pottery.jpg'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { e.target.src = '/images/pottery.jpg'; }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.stock > 0 ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
                      }`}>
                        {prod.stock > 0 ? `${prod.stock} in stock` : 'Sold out'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <Link to={`/product/${prod.id}`}>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                          {prod.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{prod.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">₹{Number(prod.price).toFixed(0)}</span>
                      <button
                        onClick={() => handleAddToCart(prod)}
                        disabled={prod.stock <= 0}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {prod.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Weekly Availability Schedule */}
      {activeTab === 'schedule' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Working Days & Booking Slots</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These are the recurring weekly time slots when this micro-entrepreneur is available.
              </p>
            </div>
          </div>

          {availabilitySlots.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No active booking slots set by this entrepreneur.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availabilitySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between"
                >
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{slot.day_of_week}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 rounded-lg">
                    {slot.start_time} - {slot.end_time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Customer Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Verified Customer Feedback</h3>

          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
              No reviews yet. Reviews are only left by customers after completed requests or orders.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center text-xs">
                        {rev.customer_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{rev.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={rev.rating} size="w-4 h-4" />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-10">
                    "{rev.comment || 'Great experience with this artisan.'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
