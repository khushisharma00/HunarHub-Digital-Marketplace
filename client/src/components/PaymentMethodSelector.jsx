import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Truck, 
  Banknote, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  paymentDetails,
  onDetailsChange,
  amount = 0,
  mode = 'order' // 'order' or 'service'
}) {
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer for QR

  // Format amount
  const displayAmount = Number(amount || 0).toFixed(2);

  // QR Timer countdown
  useEffect(() => {
    if (selectedMethod === 'UPI' && paymentDetails.upiMode === 'qr') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedMethod, paymentDetails.upiMode]);

  // Handle Card input formatting
  const handleCardNumberChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Detect brand
    let brand = 'Card';
    if (raw.startsWith('4')) brand = 'Visa';
    else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(raw)) brand = 'Mastercard';
    else if (/^(60|65|81|82|508)/.test(raw)) brand = 'RuPay';
    else if (/^3[47]/.test(raw)) brand = 'Amex';

    // Format with spaces every 4 digits
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    onDetailsChange({
      ...paymentDetails,
      cardNumber: formatted,
      cardBrand: brand
    });
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      let month = parseInt(raw.slice(0, 2), 10);
      if (month > 12) month = 12;
      if (month === 0) month = 1;
      const formattedMonth = month < 10 ? `0${month}` : `${month}`;
      raw = formattedMonth + (raw.length > 2 ? `/${raw.slice(2, 4)}` : '');
    }
    onDetailsChange({ ...paymentDetails, cardExpiry: raw });
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    onDetailsChange({ ...paymentDetails, cardCvv: raw });
  };

  const handleCardNameChange = (e) => {
    onDetailsChange({ ...paymentDetails, cardName: e.target.value.toUpperCase() });
  };

  const handleUpiIdChange = (e) => {
    onDetailsChange({ ...paymentDetails, upiId: e.target.value.trim().toLowerCase() });
  };

  const handleQuickUpiSuffix = (suffix) => {
    const current = paymentDetails.upiId || '';
    const prefix = current.includes('@') ? current.split('@')[0] : current;
    onDetailsChange({
      ...paymentDetails,
      upiId: prefix ? `${prefix}${suffix}` : `user${suffix}`
    });
  };

  const copyMerchantVpa = () => {
    navigator.clipboard?.writeText('hunarhub.pay@icici');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleSimulateQrSuccess = () => {
    setQrVerified(true);
    onDetailsChange({
      ...paymentDetails,
      upiId: 'QR-Verified (Scan & Pay)',
      qrPaid: true
    });
  };

  // Check validity of UPI ID
  const isUpiValid = paymentDetails.upiId && paymentDetails.upiId.includes('@') && paymentDetails.upiId.length >= 5;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Payment Method *
        </label>
        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Secure Checkout</span>
        </span>
      </div>

      {/* 3 Main Method Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* COD Option */}
        <button
          type="button"
          onClick={() => onMethodChange('COD')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            selectedMethod === 'COD'
              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              selectedMethod === 'COD' ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              {mode === 'service' ? <Banknote className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/70 px-2 py-0.5 rounded-md">
              Zero Advance
            </span>
          </div>

          <div className="mt-2.5">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              {mode === 'service' ? 'Pay on Completion' : 'Cash on Delivery'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {mode === 'service' ? 'Pay after work is done' : 'Pay when parcel arrives'}
            </p>
          </div>
        </button>

        {/* UPI Option */}
        <button
          type="button"
          onClick={() => onMethodChange('UPI')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            selectedMethod === 'UPI'
              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              selectedMethod === 'UPI' ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70 px-2 py-0.5 rounded-md">
              Instant
            </span>
          </div>

          <div className="mt-2.5">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              UPI (GPay / PhonePe)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Scan QR or enter UPI ID
            </p>
          </div>
        </button>

        {/* Card Option */}
        <button
          type="button"
          onClick={() => onMethodChange('CARD')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            selectedMethod === 'CARD'
              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              selectedMethod === 'CARD' ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-2 py-0.5 rounded-md">
              Cards
            </span>
          </div>

          <div className="mt-2.5">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Debit / Credit Card
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Visa, RuPay, Mastercard
            </p>
          </div>
        </button>
      </div>

      {/* Selected Payment Option Content Body */}

      {/* 1. COD / Pay on Completion Details */}
      {selectedMethod === 'COD' && (
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-2 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
          <div className="flex items-center space-x-2 font-bold text-amber-950 dark:text-amber-100">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              {mode === 'service' ? 'Pay When Satisfied' : 'Pay on Delivery Inspection'}
            </span>
          </div>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            {mode === 'service'
              ? 'No advance payment needed. Hand over cash or scan the artisan’s UPI QR code only after the service is fully completed.'
              : 'Pay in cash or scan the delivery person’s UPI QR when your handcrafted parcel arrives at your doorstep. Inspect your artisan items with total peace of mind.'}
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
            <span className="inline-flex items-center bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
              ✓ Zero Advance Fees
            </span>
            <span className="inline-flex items-center bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
              ✓ Cash or UPI at Doorstep
            </span>
            <span className="inline-flex items-center bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
              ✓ Direct Artisan Support
            </span>
          </div>
        </div>
      )}

      {/* 2. UPI Details (ID & QR Code tabs) */}
      {selectedMethod === 'UPI' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
          {/* Sub-mode switch */}
          <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => onDetailsChange({ ...paymentDetails, upiMode: 'vpa' })}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center space-x-1.5 ${
                paymentDetails.upiMode !== 'qr'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Enter UPI ID / VPA</span>
            </button>
            <button
              type="button"
              onClick={() => onDetailsChange({ ...paymentDetails, upiMode: 'qr' })}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center space-x-1.5 ${
                paymentDetails.upiMode === 'qr'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Scan Dynamic QR</span>
            </button>
          </div>

          {paymentDetails.upiMode !== 'qr' ? (
            /* Mode A: UPI VPA Input */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Virtual Payment Address (UPI ID) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. mobile@okaxis or name@upi"
                    value={paymentDetails.upiId || ''}
                    onChange={handleUpiIdChange}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  />
                  {isUpiValid && (
                    <div className="absolute right-3 top-2.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Handle Chips */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Quick handles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['@okaxis', '@okhdfcbank', '@okicici', '@paytm', '@ybl'].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => handleQuickUpiSuffix(handle)}
                      className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-500 text-slate-600 dark:text-slate-300 hover:text-orange-700 dark:hover:text-orange-400 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supported Apps */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Supported apps:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Google Pay • PhonePe • Paytm • BHIM • CRED</span>
              </div>
            </div>
          ) : (
            /* Mode B: Dynamic QR Code */
            <div className="space-y-4 text-center">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block shadow-sm">
                {/* Dynamic SVG QR Pattern */}
                <div className="relative w-44 h-44 mx-auto flex flex-col items-center justify-center p-2 bg-white rounded-xl">
                  {/* Stylized QR Code Graphic */}
                  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
                    {/* Corner Position Targets */}
                    <rect x="5" y="5" width="30" height="30" rx="4" stroke="#0f172a" strokeWidth="4" />
                    <rect x="12" y="12" width="16" height="16" fill="#ea580c" rx="2" />
                    <rect x="85" y="5" width="30" height="30" rx="4" stroke="#0f172a" strokeWidth="4" />
                    <rect x="92" y="12" width="16" height="16" fill="#ea580c" rx="2" />
                    <rect x="5" y="85" width="30" height="30" rx="4" stroke="#0f172a" strokeWidth="4" />
                    <rect x="12" y="92" width="16" height="16" fill="#ea580c" rx="2" />

                    {/* QR Code Pixel Matrix Dots */}
                    <rect x="42" y="8" width="6" height="6" fill="#0f172a" />
                    <rect x="54" y="8" width="6" height="6" fill="#0f172a" />
                    <rect x="66" y="8" width="6" height="6" fill="#ea580c" />
                    <rect x="42" y="20" width="6" height="6" fill="#0f172a" />
                    <rect x="60" y="20" width="6" height="6" fill="#0f172a" />
                    <rect x="72" y="20" width="6" height="6" fill="#0f172a" />
                    
                    <rect x="8" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="20" y="42" width="6" height="6" fill="#ea580c" />
                    <rect x="32" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="44" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="56" y="42" width="6" height="6" fill="#ea580c" />
                    <rect x="68" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="80" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="92" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="104" y="42" width="6" height="6" fill="#ea580c" />

                    <rect x="8" y="54" width="6" height="6" fill="#0f172a" />
                    <rect x="26" y="54" width="6" height="6" fill="#0f172a" />
                    <rect x="38" y="54" width="6" height="6" fill="#0f172a" />
                    <rect x="62" y="54" width="6" height="6" fill="#0f172a" />
                    <rect x="86" y="54" width="6" height="6" fill="#ea580c" />
                    <rect x="104" y="54" width="6" height="6" fill="#0f172a" />

                    <rect x="42" y="66" width="6" height="6" fill="#ea580c" />
                    <rect x="54" y="66" width="6" height="6" fill="#0f172a" />
                    <rect x="66" y="66" width="6" height="6" fill="#0f172a" />
                    <rect x="78" y="66" width="6" height="6" fill="#0f172a" />
                    <rect x="96" y="66" width="6" height="6" fill="#0f172a" />

                    <rect x="42" y="78" width="6" height="6" fill="#0f172a" />
                    <rect x="60" y="78" width="6" height="6" fill="#0f172a" />
                    <rect x="72" y="78" width="6" height="6" fill="#ea580c" />
                    <rect x="90" y="78" width="6" height="6" fill="#0f172a" />
                    <rect x="104" y="78" width="6" height="6" fill="#0f172a" />

                    <rect x="42" y="90" width="6" height="6" fill="#0f172a" />
                    <rect x="54" y="90" width="6" height="6" fill="#ea580c" />
                    <rect x="66" y="90" width="6" height="6" fill="#0f172a" />
                    <rect x="84" y="90" width="6" height="6" fill="#0f172a" />
                    <rect x="102" y="90" width="6" height="6" fill="#0f172a" />

                    <rect x="42" y="102" width="6" height="6" fill="#0f172a" />
                    <rect x="60" y="102" width="6" height="6" fill="#0f172a" />
                    <rect x="78" y="102" width="6" height="6" fill="#0f172a" />
                    <rect x="96" y="102" width="6" height="6" fill="#ea580c" />

                    {/* Center HunarHub Logo Badge */}
                    <circle cx="60" cy="60" r="14" fill="#ffffff" stroke="#ea580c" strokeWidth="2" />
                    <text x="60" y="64" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#ea580c">HH</text>
                  </svg>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">₹{displayAmount}</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">hunarhub.pay@icici</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 animate-pulse" />
                <span>QR valid for: <strong className="text-slate-800 dark:text-slate-200 font-mono">{timerDisplay}</strong></span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={copyMerchantVpa}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl inline-flex items-center justify-center space-x-1.5 transition-colors"
                >
                  {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVpa ? 'UPI ID Copied' : 'Copy Merchant UPI'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateQrSuccess}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl inline-flex items-center justify-center space-x-1.5 transition-all ${
                    qrVerified || paymentDetails.qrPaid
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{qrVerified || paymentDetails.qrPaid ? 'QR Payment Verified ✓' : 'I Have Paid via QR'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Card Details Form */}
      {selectedMethod === 'CARD' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
          {/* Card Preview Chip */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-md space-y-3 relative overflow-hidden border border-slate-700">
            <div className="absolute right-3 -bottom-6 w-28 h-28 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold tracking-wider text-slate-300 text-[10px]">HUNARHUB SECURE CARD</span>
              <span className="font-black px-2 py-0.5 bg-white/10 rounded text-xs tracking-wider text-orange-400">
                {paymentDetails.cardBrand || 'Card'}
              </span>
            </div>

            <div className="font-mono text-base tracking-widest text-slate-100 py-1 font-bold">
              {paymentDetails.cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end text-[10px] text-slate-300">
              <div>
                <span className="block text-[8px] text-slate-400 uppercase tracking-widest">Cardholder</span>
                <span className="font-bold tracking-wider">{paymentDetails.cardName || 'YOUR NAME'}</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-400 uppercase tracking-widest">Expires</span>
                <span className="font-bold tracking-wider font-mono">{paymentDetails.cardExpiry || 'MM/YY'}</span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Card Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="4111 2222 3333 4444"
                  maxLength={19}
                  value={paymentDetails.cardNumber || ''}
                  onChange={handleCardNumberChange}
                  className="w-full px-3.5 py-2.5 pl-9 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {paymentDetails.cardBrand || 'Card'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                required
                placeholder="Name as printed on card"
                value={paymentDetails.cardName || ''}
                onChange={handleCardNameChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Valid Thru (MM/YY) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  value={paymentDetails.cardExpiry || ''}
                  onChange={handleExpiryChange}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CVV / Security Code *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    maxLength={4}
                    value={paymentDetails.cardCvv || ''}
                    onChange={handleCvvChange}
                    className="w-full px-3.5 py-2 pr-8 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-center"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>256-Bit SSL Encrypted • We never store your CVV or card PIN.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
