import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  Filter, 
  SlidersHorizontal, 
  RotateCcw, 
  MapPin, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { api } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import { useCart } from '../context/CartContext';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [cartToast, setCartToast] = useState('');

  const categoryFilter = searchParams.get('category') || '';
  const cityFilter = searchParams.get('city') || '';
  const queryFilter = searchParams.get('q') || '';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);
  const [localQuery, setLocalQuery] = useState(queryFilter);

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
    async function loadProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (queryFilter) queryParams.set('q', queryFilter);
        if (categoryFilter) queryParams.set('category', categoryFilter);
        if (cityFilter) queryParams.set('city', cityFilter);
        queryParams.set('page', pageFilter);
        queryParams.set('limit', 12);

        const res = await api.getProducts(queryParams.toString());
        if (res.success) {
          setProducts(res.products || []);
          setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryFilter, cityFilter, queryFilter, pageFilter]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setCartToast(`Added "${product.name}" to your cart!`);
    setTimeout(() => setCartToast(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-orange-500/40 animate-fade-in text-xs font-bold">
          <ShoppingBag className="w-4 h-4 text-orange-400" />
          <span>{cartToast}</span>
          <Link to="/cart" className="text-orange-400 underline ml-2">View Cart</Link>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Handmade Products Marketplace
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Shop authentic handcrafted items directly from Indian micro-entrepreneurs. Pay on delivery!
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
          All Items
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

      {/* Product Grid & Search */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center space-x-2 w-full sm:w-80 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search handmade products..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateParam('q', localQuery)}
              className="bg-transparent text-xs w-full outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center space-x-3 text-xs w-full sm:w-auto">
            <select
              value={cityFilter}
              onChange={(e) => updateParam('city', e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="" className="dark:bg-slate-800">All Indian Cities</option>
              <option value="Jaipur" className="dark:bg-slate-800">Jaipur</option>
              <option value="Varanasi" className="dark:bg-slate-800">Varanasi</option>
              <option value="Lucknow" className="dark:bg-slate-800">Lucknow</option>
              <option value="Delhi" className="dark:bg-slate-800">Delhi</option>
              <option value="Mumbai" className="dark:bg-slate-800">Mumbai</option>
              <option value="Agra" className="dark:bg-slate-800">Agra</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-72 animate-pulse border border-slate-200/60 dark:border-slate-800 p-4 space-y-3">
                <div className="bg-slate-200 dark:bg-slate-800 h-40 rounded-xl w-full"></div>
                <div className="bg-slate-200 dark:bg-slate-800 h-4 rounded w-3/4"></div>
                <div className="bg-slate-200 dark:bg-slate-800 h-3 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">No Products Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your category or city search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden"
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
                    <CategoryBadge name={prod.category_name} slug={prod.category_slug} />
                    <Link to={`/product/${prod.id}`}>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 mt-2">
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
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{prod.stock > 0 ? 'Add' : 'Out'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
