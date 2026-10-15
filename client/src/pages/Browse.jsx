import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Filter, 
  RotateCcw, 
  Star, 
  ArrowRight, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { api } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import RatingStars from '../components/RatingStars';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter states
  const categoryFilter = searchParams.get('category') || '';
  const cityFilter = searchParams.get('city') || '';
  const queryFilter = searchParams.get('q') || '';
  const minPriceFilter = searchParams.get('min_price') || '';
  const maxPriceFilter = searchParams.get('max_price') || '';
  const sortFilter = searchParams.get('sort') || 'rating_desc';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  const [localQuery, setLocalQuery] = useState(queryFilter);
  const [localMinPrice, setLocalMinPrice] = useState(minPriceFilter);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceFilter);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success) setCategories(res.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (queryFilter) queryParams.set('q', queryFilter);
        if (categoryFilter) queryParams.set('category', categoryFilter);
        if (cityFilter) queryParams.set('city', cityFilter);
        if (minPriceFilter) queryParams.set('min_price', minPriceFilter);
        if (maxPriceFilter) queryParams.set('max_price', maxPriceFilter);
        if (sortFilter) queryParams.set('sort', sortFilter);
        queryParams.set('page', pageFilter);
        queryParams.set('limit', 8);

        const res = await api.getEntrepreneurs(queryParams.toString());
        if (res.success) {
          setEntrepreneurs(res.entrepreneurs || []);
          setPagination(res.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Failed to load entrepreneurs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [categoryFilter, cityFilter, queryFilter, minPriceFilter, maxPriceFilter, sortFilter, pageFilter]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (localMinPrice) nextParams.set('min_price', localMinPrice);
    else nextParams.delete('min_price');

    if (localMaxPrice) nextParams.set('max_price', localMaxPrice);
    else nextParams.delete('max_price');

    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setLocalQuery('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', newPage);
      setSearchParams(nextParams);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Browse Local Micro-Entrepreneurs
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Connect directly with verified cobblers, potters, tailors, artisans, and small vendors in your area.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => updateParam('category', '')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            !categoryFilter
              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50'
          }`}
        >
          All Categories
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParam('category', cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              categoryFilter === cat.slug
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Filter & Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white text-sm">
              <SlidersHorizontal className="w-4 h-4 text-orange-600" />
              <span>Refine Search</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Keyword / Skill</label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Kolhapuri, Chikankari..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateParam('q', localQuery)}
                className="bg-transparent text-sm w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* City Location Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Location (City)</label>
            <select
              value={cityFilter}
              onChange={(e) => updateParam('city', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200"
            >
              <option value="" className="dark:bg-slate-800">All Indian Cities</option>
              <option value="Jaipur" className="dark:bg-slate-800">Jaipur (Rajasthan)</option>
              <option value="Varanasi" className="dark:bg-slate-800">Varanasi (UP)</option>
              <option value="Lucknow" className="dark:bg-slate-800">Lucknow (UP)</option>
              <option value="Delhi" className="dark:bg-slate-800">Delhi NCR</option>
              <option value="Mumbai" className="dark:bg-slate-800">Mumbai (Maharashtra)</option>
              <option value="Agra" className="dark:bg-slate-800">Agra (UP)</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Price Range (₹)</label>
            <form onSubmit={handlePriceApply} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-transparent dark:border-slate-700"
              >
                Apply Price Filter
              </button>
            </form>
          </div>

          {/* Trust Banner */}
          <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 rounded-xl border border-orange-100 dark:border-orange-900/50 text-xs text-orange-800 dark:text-orange-300 space-y-1.5">
            <p className="font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Admin Verified Only</span>
            </p>
            <p className="text-[11px] leading-relaxed text-orange-700 dark:text-orange-400">
              Only verified artisans with validated identity are shown here.
            </p>
          </div>
        </div>

        {/* Right Results Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Summary & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm gap-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{entrepreneurs.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{pagination.total}</span> micro-entrepreneurs
            </p>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Sort by:</span>
              <select
                value={sortFilter}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-semibold outline-none cursor-pointer"
              >
                <option value="rating_desc" className="dark:bg-slate-800">Highest Rated ⭐</option>
                <option value="experience_desc" className="dark:bg-slate-800">Most Experienced</option>
                <option value="newest" className="dark:bg-slate-800">Newly Joined</option>
              </select>
            </div>
          </div>

          {/* Loading Skeleton / Empty State / Results Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-80 animate-pulse border border-slate-200/60 dark:border-slate-800 p-4 space-y-4">
                  <div className="bg-slate-200 dark:bg-slate-800 h-40 rounded-xl w-full"></div>
                  <div className="bg-slate-200 dark:bg-slate-800 h-4 rounded w-3/4"></div>
                  <div className="bg-slate-200 dark:bg-slate-800 h-3 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : entrepreneurs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mx-auto border border-orange-100 dark:border-orange-800/60">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Micro-Entrepreneurs Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                We couldn't find any approved micro-entrepreneurs matching your filters. Try clearing some filters or searching a different city.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {entrepreneurs.map((ent) => (
                <div
                  key={ent.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col group overflow-hidden"
                >
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={ent.profile_photo || '/images/seller.jpg'}
                      alt={ent.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/images/seller.jpg'; }}
                    />
                    <div className="absolute top-3 right-3">
                      <CategoryBadge name={ent.category_name} slug={ent.category_slug} />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-orange-400" />
                      <span>{ent.area}, {ent.city}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {ent.business_name}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {ent.experience_years} yrs exp
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">{ent.skill_type}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                        {ent.bio}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-1">
                          <RatingStars rating={ent.rating_avg} size="w-3.5 h-3.5" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-1">{ent.rating_avg}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">({ent.rating_count})</span>
                        </div>
                        {ent.min_price && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Starts from <span className="font-bold text-slate-800 dark:text-white">₹{ent.min_price}</span>
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/entrepreneur/${ent.id}`}
                        id={`browse-profile-${ent.id}`}
                        className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      pagination.page === p
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
