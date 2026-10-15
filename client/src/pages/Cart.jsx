import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'UPI' | 'CARD'
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    upiMode: 'vpa',
    cardNumber: '',
    cardBrand: 'Card',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    qrPaid: false
  });

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (!deliveryAddress.trim() || !contactPhone.trim()) {
      setError('Please provide your complete delivery address and contact phone number.');
      return;
    }

    // Payment validation
    if (paymentMethod === 'UPI') {
      if (paymentDetails.upiMode === 'vpa') {
        if (!paymentDetails.upiId || !paymentDetails.upiId.includes('@') || paymentDetails.upiId.length < 5) {
          setError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank) to complete checkout.');
          return;
        }
      }
    } else if (paymentMethod === 'CARD') {
      const cleanNum = paymentDetails.cardNumber.replace(/\D/g, '');
      if (cleanNum.length < 15) {
        setError('Please enter a valid 16-digit credit/debit card number.');
        return;
      }
      if (!paymentDetails.cardName || !paymentDetails.cardName.trim()) {
        setError('Please enter the name on the card.');
        return;
      }
      if (!paymentDetails.cardExpiry || paymentDetails.cardExpiry.length < 5) {
        setError('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (!paymentDetails.cardCvv || paymentDetails.cardCvv.length < 3) {
        setError('Please enter the 3-digit CVV from the back of your card.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const itemsPayload = cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const res = await api.createOrder({
        items: itemsPayload,
        delivery_address: deliveryAddress.trim(),
        contact_phone: contactPhone.trim(),
        notes: notes.trim(),
        payment_method: paymentMethod,
        payment_details: {
          upi_id: paymentDetails.upiMode === 'qr' ? 'Instant QR / App' : paymentDetails.upiId,
          card_number: paymentDetails.cardNumber,
          card_brand: paymentDetails.cardBrand,
          card_name: paymentDetails.cardName
        }
      });

      if (res.success) {
        clearCart();
        setOrderSuccess(res.order);
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please check item stock.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    const isPaid = orderSuccess.payment_status === 'Paid';

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner ${
          isPaid ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400'
        }`}>
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Order Successfully Placed!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Order Reference: <span className="font-bold text-slate-900 dark:text-white font-mono">#{orderSuccess.id}</span>
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-left space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Payment Mode</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 mt-0.5">
                {orderSuccess.payment_method?.includes('UPI') && <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                {orderSuccess.payment_method?.includes('ending') && <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                {orderSuccess.payment_method?.includes('Delivery') && <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                <span>{orderSuccess.payment_method}</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider ${
                isPaid ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
              }`}>
                {isPaid ? '✓ Paid Online' : 'Pending (Pay on Delivery)'}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                ₹{Number(orderSuccess.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p><span className="font-semibold text-slate-800 dark:text-white">Delivering to:</span> {orderSuccess.delivery_address}</p>
            <p><span className="font-semibold text-slate-800 dark:text-white">Contact:</span> {orderSuccess.contact_phone}</p>
            {orderSuccess.notes && (
              <p><span className="font-semibold text-slate-800 dark:text-white">Instructions:</span> {orderSuccess.notes}</p>
            )}
          </div>

          {isPaid ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Payment received & verified. The artisan has been notified to securely pack and dispatch your order.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-900 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800/60 flex items-start space-x-2">
              <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                💡 Pay with cash or scan the delivery person’s UPI QR code upon inspecting your package at delivery.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/dashboard"
            id="order-success-dashboard-link"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
          >
            Track in Customer Dashboard
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-3xl flex items-center justify-center mx-auto border border-orange-100 dark:border-orange-800/60">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Support local micro-entrepreneurs by adding authentic handmade crafts and decor to your cart.
        </p>
        <Link
          to="/products"
          id="empty-cart-browse-btn"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
        >
          <span>Explore Handmade Marketplace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Shopping Cart ({totalItems} items)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review your selected handmade items</p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-4"
            >
              <img
                src={item.image_url || '/images/pottery.jpg'}
                alt={item.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-100 dark:border-slate-800 flex-shrink-0"
                onError={(e) => { e.target.src = '/images/pottery.jpg'; }}
              />

              <div className="flex-1 min-w-0 space-y-1">
                <Link to={`/product/${item.product_id}`} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">By {item.seller_name}</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">₹{item.price}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Minus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Form */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Delivery Details & Checkout
            </h2>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/50 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isAuthenticated && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 text-xs font-medium rounded-xl border border-orange-200 dark:border-orange-900/50">
                Please <Link to="/login?redirect=/cart" className="font-bold underline text-orange-700 dark:text-orange-400">log in</Link> or register to place your order.
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Complete Delivery Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House/Flat number, Street name, Landmark, City, Pincode"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with security, call before arrival"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* Interactive Payment Method Selector */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  paymentDetails={paymentDetails}
                  onDetailsChange={setPaymentDetails}
                  amount={subtotal}
                  mode="order"
                />
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>Local Artisan Delivery</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Amount Due</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="place-order-submit-btn"
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>
                  {loading
                    ? 'Processing Order...'
                    : paymentMethod === 'COD'
                    ? `Place Order (Pay on Delivery ₹${subtotal.toFixed(0)})`
                    : paymentMethod === 'UPI'
                    ? `Pay via UPI (₹${subtotal.toFixed(0)}) & Confirm`
                    : `Pay with Card (₹${subtotal.toFixed(0)}) & Confirm`}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

