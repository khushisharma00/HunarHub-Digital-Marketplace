import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Star, 
  ShoppingBag, 
  Wrench, 
  Scissors, 
  Palette, 
  Store,
  CheckCircle2,
  Clock,
  HeartHandshake
} from 'lucide-react';
import { api } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import RatingStars from '../components/RatingStars';
import { useCart } from '../context/CartContext';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredEntrepreneurs, setFeaturedEntrepreneurs] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [searchCity, setSearchCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [cartNotice, setCartNotice] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, entRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getEntrepreneurs('limit=4'),
          api.getProducts('limit=4')
        ]);

        if (catRes.success) setCategories(catRes.categories || []);
        if (entRes.success) setFeaturedEntrepreneurs(entRes.entrepreneurs || []);
        if (prodRes.success) setFeaturedProducts(prodRes.products || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setCartNotice(`Added "${product.name}" to cart!`);
    setTimeout(() => setCartNotice(''), 3000);
  };

  const categoryIcons = {
    'cobbler': Wrench,
    'potter-kumhar': Sparkles,
    'tailor': Scissors,
    'artisan': Palette,
    'small-vendor': Store
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Toast Notification */}
      {cartNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-orange-500/40 animate-fade-in">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-semibold">{cartNotice}</span>
          <Link to="/cart" className="text-xs text-orange-400 underline font-bold ml-2">View Cart</Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/40 to-transparent dark:from-slate-900/60 dark:via-slate-950 dark:to-transparent pt-12 pb-20 border-b border-orange-100/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 text-orange-800 dark:text-orange-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Empowering Grassroots Micro-Talent Across India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Discover & Support <br />
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
                  Local Micro-Entrepreneurs
                </span>
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Connect with neighborhood cobblers, traditional potters (kumhars), master tailors, woodcraft artisans, and small vendors. Book doorstep skills and buy authentic handmade goods with zero advance risk.
              </p>

              {/* Quick Search Bar */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-xl shadow-orange-950/5 dark:shadow-black/40 border border-orange-100 dark:border-slate-800 max-w-xl mx-auto lg:mx-0">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = `/browse?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(searchCity)}`;
                  }}
                  className="flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex items-center space-x-2 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      id="hero-search-query"
                      placeholder="Skill, artisan, or service..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700">
                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <select
                      id="hero-city-select"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-white cursor-pointer"
                    >
                      <option value="" className="dark:bg-slate-800">All Cities</option>
                      <option value="Jaipur" className="dark:bg-slate-800">Jaipur</option>
                      <option value="Varanasi" className="dark:bg-slate-800">Varanasi</option>
                      <option value="Lucknow" className="dark:bg-slate-800">Lucknow</option>
                      <option value="Delhi" className="dark:bg-slate-800">Delhi</option>
                      <option value="Mumbai" className="dark:bg-slate-800">Mumbai</option>
                      <option value="Agra" className="dark:bg-slate-800">Agra</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    id="hero-search-submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Value Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Admin Verified Talent</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <HeartHandshake className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Pay on Service Completion</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Slot Booking with Zero Conflicts</span>
                </div>
              </div>
            </div>

            {/* Right Column Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl p-3 bg-gradient-to-tr from-orange-500/20 via-amber-500/10 to-transparent shadow-2xl">
                <img
                  src="/images/hero.jpg"
                  alt="Indian micro-entrepreneur crafting handmade products"
                  className="rounded-2xl w-full h-[400px] object-cover shadow-inner"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80'; }}
                />
                <div className="absolute -bottom-6 -left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-orange-100 dark:border-slate-800 flex items-center space-x-3.5 max-w-[260px]">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Verified Artisans</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">100% Genuine Local Skills</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Spotlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Browse By Traditional Craft & Skill
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Select a trade to find experienced master artisans in your neighborhood.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.slug] || Sparkles;
            return (
              <Link
                key={cat.id}
                to={`/browse?category=${cat.slug}`}
                id={`cat-card-${cat.slug}`}
                className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-orange-100/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 transition-all flex flex-col items-center text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-slate-800 group-hover:bg-orange-600 text-orange-600 dark:text-orange-400 group-hover:text-white flex items-center justify-center transition-colors shadow-inner">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-sm sm:text-base">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {cat.description || 'Verified local masters'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:underline flex items-center space-x-1">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Micro-Entrepreneurs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>Verified Masters</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Featured Local Micro-Entrepreneurs
            </h2>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center space-x-1 text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700"
          >
            <span>View All Talent</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredEntrepreneurs.map((ent) => (
            <div
              key={ent.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
            >
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={ent.profile_photo || '/images/seller.jpg'}
                  alt={ent.business_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = '/images/seller.jpg'; }}
                />
                <div className="absolute top-3 right-3">
                  <CategoryBadge name={ent.category_name} slug={ent.category_slug} />
                </div>
                <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-orange-400" />
                  <span>{ent.area}, {ent.city}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {ent.business_name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{ent.skill_type}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                    {ent.bio}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs">
                    <RatingStars rating={ent.rating_avg} size="w-3.5 h-3.5" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{ent.rating_avg}</span>
                    <span className="text-slate-400 dark:text-slate-500">({ent.rating_count})</span>
                  </div>
                  <Link
                    to={`/entrepreneur/${ent.id}`}
                    id={`view-profile-btn-${ent.id}`}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-600 text-orange-700 dark:text-orange-300 hover:text-white text-xs font-bold transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Handmade Products Marketplace */}
      <section className="bg-orange-50/50 dark:bg-slate-900/40 py-16 border-y border-orange-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Handmade Marketplace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Authentic Handcrafted Products
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center space-x-1 text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-orange-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden"
              >
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={prod.image_url || '/images/pottery.jpg'}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = '/images/pottery.jpg'; }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prod.stock > 0 ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
                    }`}>
                      {prod.stock > 0 ? `In Stock (${prod.stock})` : 'Sold Out'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                      {prod.category_name}
                    </p>
                    <Link to={`/product/${prod.id}`}>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 mt-0.5">
                        {prod.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
                      <span>By</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{prod.entrepreneur_name}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-none">Price</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">₹{Number(prod.price).toFixed(0)}</p>
                    </div>

                    <button
                      onClick={() => handleAddToCart(prod)}
                      disabled={prod.stock <= 0}
                      id={`add-cart-btn-${prod.id}`}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{prod.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            How HunarHub Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            A transparent and respectful ecosystem built specifically for micro-entrepreneurs and conscious consumers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-extrabold text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Discover Local Talent</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Search by skill, craft category, or city. Review verified portfolios, experience, customer reviews, and transparent pricing.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Book Slot or Order Crafts</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Schedule on-demand service slots with conflict-free calendar booking, or add authentic handmade crafts directly to your cart.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flexible Payment & Feedback</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Choose Cash on Delivery (COD), instant UPI, or secure Credit/Debit Card. Rate your artisan upon 100% satisfaction!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section for Entrepreneurs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              Calling All Local Artisans & Vendors
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Grow Your Business with HunarHub
            </h2>
            <p className="text-orange-100 text-sm leading-relaxed">
              Are you a cobbler, potter, tailor, artisan, or small vendor? Create your digital storefront today, showcase your services, and receive bookings from local customers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/register?role=entrepreneur"
              id="cta-join-entrepreneur"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-orange-700 hover:bg-orange-50 shadow-lg text-center transition-all"
            >
              Register as Micro-Entrepreneur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
