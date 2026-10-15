import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  CalendarCheck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

export default function ServiceRequestForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const preselectedEntId = searchParams.get('entrepreneur_id') || '';
  const preselectedServiceId = searchParams.get('service_id') || '';

  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [selectedEntId, setSelectedEntId] = useState(preselectedEntId);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId);

  // Tomorrow as default booking date
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(tomorrowStr);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

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

  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Load entrepreneurs list
  useEffect(() => {
    async function loadEnts() {
      try {
        const res = await api.getEntrepreneurs('limit=50');
        if (res.success) {
          setEntrepreneurs(res.entrepreneurs || []);
          if (!selectedEntId && res.entrepreneurs.length > 0) {
            setSelectedEntId(String(res.entrepreneurs[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load entrepreneurs:', err);
      }
    }
    loadEnts();
  }, []);

  // When selected entrepreneur changes, load their services and availability
  useEffect(() => {
    if (!selectedEntId) return;

    async function loadEntDetails() {
      try {
        const res = await api.getEntrepreneurById(selectedEntId);
        if (res.success) {
          setServices(res.services || []);
          if (res.services.length > 0) {
            if (!selectedServiceId || !res.services.some((s) => String(s.id) === String(selectedServiceId))) {
              setSelectedServiceId(String(res.services[0].id));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load entrepreneur services:', err);
      }
    }

    loadEntDetails();
  }, [selectedEntId]);

  // When booking date or selected entrepreneur changes, load slot availability and booked slots
  useEffect(() => {
    if (!selectedEntId || !bookingDate) return;

    async function loadSlots() {
      setSlotLoading(true);
      try {
        const res = await api.getAvailabilitySlots(selectedEntId, bookingDate);
        if (res.success) {
          // Standard slots
          const standardSlots = res.slots || [];
          setTimeSlots(standardSlots);
          setBookedSlots(res.bookedSlots || []);

          // Find first available slot
          const available = standardSlots.find((s) => {
            const slotStr = `${s.start_time} - ${s.end_time}`;
            return !(res.bookedSlots || []).includes(slotStr);
          });

          if (available) {
            setSelectedSlot(`${available.start_time} - ${available.end_time}`);
          } else {
            setSelectedSlot('');
          }
        }
      } catch (err) {
        console.error('Failed to load availability slots:', err);
      } finally {
        setSlotLoading(false);
      }
    }

    loadSlots();
  }, [selectedEntId, bookingDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/book-service?entrepreneur_id=${selectedEntId}&service_id=${selectedServiceId}`);
      return;
    }

    if (!selectedServiceId || !bookingDate || !selectedSlot || !address.trim()) {
      setError('Please select a service, date, time slot, and provide your service location address.');
      return;
    }

    // Payment validation
    if (paymentMethod === 'UPI') {
      if (paymentDetails.upiMode === 'vpa') {
        if (!paymentDetails.upiId || !paymentDetails.upiId.includes('@') || paymentDetails.upiId.length < 5) {
          setError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank) to book this service.');
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
      const res = await api.createServiceRequest({
        service_id: parseInt(selectedServiceId, 10),
        booking_date: bookingDate,
        time_slot: selectedSlot,
        address: address.trim(),
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
        setSuccessData(res.request);
      }
    } catch (err) {
      setError(err.message || 'Failed to place service request. The time slot may already be booked.');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceObj = services.find((s) => String(s.id) === String(selectedServiceId));

  if (successData) {
    const isPaid = successData.payment_status === 'Paid';

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner ${
          isPaid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-950/80 dark:text-orange-400'
        }`}>
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Service Request Confirmed!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Request ID: <span className="font-bold text-slate-900 dark:text-white font-mono">#{successData.id}</span>
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-left space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Booked Service</p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{successData.service_title}</p>
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-xl">
              ₹{Number(successData.total_price).toFixed(0)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Payment Mode</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 mt-0.5">
                {successData.payment_method?.includes('UPI') && <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                {successData.payment_method?.includes('ending') && <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                {successData.payment_method?.includes('completion') && <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                <span>{successData.payment_method}</span>
              </p>
            </div>
            
            <span className={`text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider self-start sm:self-auto ${
              isPaid ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              {isPaid ? '✓ Paid Online' : 'Pending (Pay on Completion)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-semibold">Scheduled Date:</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{successData.booking_date}</p>
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-semibold">Time Slot:</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{successData.time_slot}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 dark:text-slate-500 font-semibold">Location:</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{successData.address}</p>
            </div>
          </div>

          {isPaid ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Payment received & verified. The artisan has been notified to arrive at your scheduled date and time!
              </span>
            </div>
          ) : (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-xl text-orange-900 dark:text-orange-300 text-xs font-medium border border-orange-200 dark:border-orange-800 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <span>
                🛡️ <strong className="font-bold">Pay on Service Completion:</strong> You only pay via cash or UPI when the artisan finishes the job to your complete satisfaction.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/dashboard"
            id="request-success-dashboard-link"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
          >
            Go to Customer Dashboard
          </Link>
          <Link
            to="/browse"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-all"
          >
            Browse More Talent
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/browse" className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Browse</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-xs font-bold rounded-full uppercase mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>On-Demand Booking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Schedule a Local Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Book trusted traditional craftsmen. Payment is made only when work is completed.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Choose Micro-Entrepreneur */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Select Micro-Entrepreneur *
            </label>
            <select
              value={selectedEntId}
              onChange={(e) => setSelectedEntId(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            >
              {entrepreneurs.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.business_name} – {ent.skill_type} ({ent.city})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Service */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Select Service *
            </label>
            {services.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No active services offered by this entrepreneur.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => (
                  <label
                    key={svc.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      String(selectedServiceId) === String(svc.id)
                        ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500 dark:bg-orange-950/40 dark:border-orange-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <input
                          type="radio"
                          name="service_selection"
                          value={svc.id}
                          checked={String(selectedServiceId) === String(svc.id)}
                          onChange={() => setSelectedServiceId(String(svc.id))}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-black text-slate-900 dark:text-white text-sm">₹{Number(svc.price).toFixed(0)}</span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-2">{svc.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{svc.description}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      <span>{svc.duration_mins} mins</span>
                    </p>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 3. Date & Available Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Booking Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Available Time Slot *
              </label>
              {slotLoading ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-3">Checking availability...</div>
              ) : timeSlots.length === 0 ? (
                <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  No standard slots set for this day.
                </div>
              ) : (
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select an available slot...</option>
                  {timeSlots.map((slot) => {
                    const slotStr = `${slot.start_time} - ${slot.end_time}`;
                    const isBooked = bookedSlots.includes(slotStr);
                    return (
                      <option key={slot.id} value={slotStr} disabled={isBooked}>
                        {slotStr} {isBooked ? '(Already Booked ✕)' : '(Available ✓)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* 4. Location Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Service Location Address *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Your complete street address, apartment / door number, landmark, city"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 5. Special Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Special Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Please bring extra heavy duty thread, or call upon arrival"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 6. Payment Method Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              paymentDetails={paymentDetails}
              onDetailsChange={setPaymentDetails}
              amount={selectedServiceObj ? selectedServiceObj.price : 0}
              mode="service"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedSlot}
            id="service-request-submit-btn"
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>
              {loading
                ? 'Confirming Reservation...'
                : paymentMethod === 'COD'
                ? `Confirm Booking (Pay on Completion ₹${selectedServiceObj ? Number(selectedServiceObj.price).toFixed(0) : '0'})`
                : paymentMethod === 'UPI'
                ? `Pay via UPI (₹${selectedServiceObj ? Number(selectedServiceObj.price).toFixed(0) : '0'}) & Book`
                : `Pay with Card (₹${selectedServiceObj ? Number(selectedServiceObj.price).toFixed(0) : '0'}) & Book`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
