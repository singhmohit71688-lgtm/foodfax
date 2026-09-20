import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { VegBadge } from '../components/common/VegBadge';
import { 
  ArrowLeft, 
  Store, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  User,
  Phone
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const { navigate } = useRouter();
  const { items, activeShop, totalPrice, totalItems, note, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [customerName, setCustomerName] = useState(currentUser?.name || 'Customer');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '9876543210');
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DINE_IN'>('TAKEAWAY');
  const [tableOrTokenNote, setTableOrTokenNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_AT_COUNTER' | 'PAY_ONLINE'>('CASH_AT_COUNTER');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!activeShop || items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-500 font-medium">Your cart is empty. Please select food items first.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-2xl bg-orange-600 text-white font-bold"
        >
          Browse Food Stalls
        </button>
      </div>
    );
  }

  const subtotal = totalPrice;
  const platformFee = 2;
  const grandTotal = subtotal + platformFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter your name for counter pickup calling.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter a contact phone number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const orderItems = items.map((cartItem) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: cartItem.item.id,
        name: cartItem.item.name,
        price: cartItem.item.price,
        quantity: cartItem.quantity,
        isVeg: cartItem.item.isVeg,
      }));

      const newOrder = await orderService.createOrder({
        shopId: activeShop.id,
        shopName: activeShop.name,
        shopImage: activeShop.image,
        shopLocation: activeShop.location?.address || 'Counter Stall',
        customerId: currentUser?.id || `anon-${Date.now()}`,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        tableNumber: tableOrTokenNote.trim() || undefined,
        paymentMethod,
        items: orderItems,
        subtotal,
        total: grandTotal,
        estimatedPreparationMinutes: '10',
        instructions: note || undefined,
      });

      // Clear the customer's cart
      clearCart();

      // Navigate to live token tracker for this order
      navigate(`/orders/${newOrder.id}`);
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setErrorMsg(err?.message || 'Could not place order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cart')}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Back to cart"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Counter Checkout</h1>
          <p className="text-xs text-slate-500 font-medium">Instant Token Generation</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* Stall Details Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{activeShop.name}</h3>
              <p className="text-xs text-slate-500">{activeShop.location?.address || 'Counter Stall'}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
            Ready in ~10m
          </span>
        </div>

        {/* Order Type Toggle */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Pickup / Dining Option
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center ${
                orderType === 'TAKEAWAY'
                  ? 'bg-orange-50 border-orange-600 text-orange-700 ring-2 ring-orange-100'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Takeaway / Counter Bag
            </button>
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center ${
                orderType === 'DINE_IN'
                  ? 'bg-orange-50 border-orange-600 text-orange-700 ring-2 ring-orange-100'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Eat at Counter / Stand
            </button>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Customer Information (For Token Call)
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name for stall announcement"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">
                Mobile Number (SMS / WhatsApp token updates)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Payment Mode
          </h4>
          <div className="space-y-2">
            <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === 'CASH_AT_COUNTER'
                ? 'bg-orange-50/70 border-orange-500 text-slate-900'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-xs">Pay Cash / UPI at Counter</div>
                  <div className="text-[11px] text-slate-500">Pay the stall vendor directly when receiving food</div>
                </div>
              </div>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'CASH_AT_COUNTER'}
                onChange={() => setPaymentMethod('CASH_AT_COUNTER')}
                className="w-4 h-4 accent-orange-600"
              />
            </label>

            <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === 'PAY_ONLINE'
                ? 'bg-orange-50/70 border-orange-500 text-slate-900'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-bold text-xs">Pay Online (UPI / GPay / PhonePe)</div>
                  <div className="text-[11px] text-slate-500">Instant digital payment verification</div>
                </div>
              </div>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'PAY_ONLINE'}
                onChange={() => setPaymentMethod('PAY_ONLINE')}
                className="w-4 h-4 accent-orange-600"
              />
            </label>
          </div>
        </div>

        {/* Order Summary & Final Amount */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2 text-xs text-slate-600">
          <div className="flex justify-between font-medium">
            <span>Items Subtotal ({totalItems} items)</span>
            <span className="font-bold text-slate-900">₹{subtotal}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Counter Platform Token Fee</span>
            <span className="font-bold text-slate-900">₹{platformFee}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
            <span>Total Payable</span>
            <span className="text-orange-600">₹{grandTotal}</span>
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <span>Generating Counter Token...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Order & Get Token (₹{grandTotal})</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
