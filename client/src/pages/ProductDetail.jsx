import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft, 
  Truck, 
  Plus, 
  Minus, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { api } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await api.getProductById(id);
        if (res.success) {
          setProduct(res.product);
        }
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = (directCheckout = false) => {
    if (!product || product.stock <= 0) return;
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);

    if (directCheckout) {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-3 font-semibold">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm font-semibold">
          {error || 'Product not found'}
        </div>
        <Link to="/products" className="inline-flex items-center space-x-1 text-sm font-bold text-orange-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link to="/products" className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Handmade Crafts</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 aspect-square relative shadow-inner">
              <img
                src={product.image_url || '/images/pottery.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/images/pottery.jpg'; }}
              />
              <div className="absolute top-4 left-4">
                <CategoryBadge name={product.category_name} slug={product.category_slug} />
              </div>
            </div>
          </div>

          {/* Product Details & Actions */}
          <div className="space-y-6">
            <div>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${
                product.stock > 0 
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Currently Out of Stock'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline space-x-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  ₹{Number(product.price).toFixed(0)}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Inclusive of all handmade craftsmanship
                </span>
              </div>
            </div>

            {/* Maker Card */}
            <div className="p-4 bg-orange-50/60 dark:bg-slate-800/60 rounded-2xl border border-orange-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={product.entrepreneur_photo || '/images/seller.jpg'}
                  alt={product.entrepreneur_name}
                  className="w-12 h-12 rounded-xl object-cover border border-orange-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  onError={(e) => { e.target.src = '/images/seller.jpg'; }}
                />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Crafted with care by</p>
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm">{product.entrepreneur_name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    <span>{product.entrepreneur_area}, {product.entrepreneur_city}</span>
                  </p>
                </div>
              </div>

              <Link
                to={`/entrepreneur/${product.entrepreneur_id}`}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-orange-700 dark:text-orange-300 hover:text-white dark:hover:text-white text-xs font-bold rounded-xl border border-orange-200 dark:border-slate-700 shadow-sm transition-colors"
              >
                View Profile
              </Link>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product Description</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {product.description || 'Authentic handmade creation crafted using traditional methods and locally sourced materials.'}
              </p>
            </div>

            {/* Quantity Selector & Action Buttons */}
            {product.stock > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Quantity</span>
                  <div className="flex items-center space-x-2 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 bg-white dark:bg-slate-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-800 dark:text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleAddToCart(false)}
                    id="add-to-cart-page-btn"
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{addedNotice ? 'Added to Cart ✓' : 'Add to Cart'}</span>
                  </button>

                  <button
                    onClick={() => handleAddToCart(true)}
                    id="buy-now-btn"
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Instant Checkout (COD/UPI/Card)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-center text-sm font-semibold border border-slate-200 dark:border-slate-700">
                This item is currently sold out. Check back soon as the artisan prepares the next batch.
              </div>
            )}

            {/* Platform Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>COD, Card & UPI Accepted</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>100% Genuine Artisan Made</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
