import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { VegBadge } from '../components/common/VegBadge';
import { EmptyState } from '../components/common/EmptyState';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  Store, 
  Receipt, 
  ArrowRight, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const CartView: React.FC = () => {
  const { navigate } = useRouter();
  const { items, activeShop, totalItems, totalPrice, updateQuantity, removeItem, clearCart, note, setNote } = useCart();
  const { isAuthenticated } = useAuth();
  const [cookingNote, setCookingNote] = useState(note || '');

  const handleUpdateNote = (val: string) => {
    setCookingNote(val);
    setNote(val);
  };

  if (items.length === 0 || !activeShop) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          title="Your Cart is Empty"
          description="Looks like you haven't added any snacks or dishes yet. Explore nearby street stalls and canteens!"
          actionText="Browse Food Stalls"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  // Fees calculation
  const subtotal = totalPrice;
  const platformFee = 2; // Flat ₹2 platform maintenance for quick tokens
  const grandTotal = subtotal + platformFee;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(activeShop ? `/shops/${activeShop.id}` : '/')}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Your Order Cart</h1>
            <p className="text-xs text-slate-500 font-medium">Counter Pickup</p>
          </div>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-2 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Stall Banner */}
      <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{activeShop.name}</h3>
            <p className="text-xs text-slate-600">
              {activeShop.location?.address || 'Counter Stall'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/shops/${activeShop.id}`)}
          className="text-xs font-bold text-orange-600 hover:underline"
        >
          + Add more
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs">
        {items.map((cartItem) => {
          const item = cartItem.item;
          return (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <VegBadge isVeg={item.isVeg} size="sm" />
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  ₹{item.price} each
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-orange-50 border border-orange-200/80 rounded-xl p-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-black text-xs text-slate-900">
                    {cartItem.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-16 text-right font-black text-sm text-slate-900">
                  ₹{item.price * cartItem.quantity}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cooking / Preparation Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Special Cooking or Counter Note (Optional)
        </label>
        <input
          type="text"
          value={cookingNote}
          onChange={(e) => handleUpdateNote(e.target.value)}
          placeholder="e.g. Less spicy, extra chutney, packaging separately"
          className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white"
        />
      </div>

      {/* Bill Details */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5 text-xs text-slate-600">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Receipt className="w-4 h-4 text-orange-600" />
          <span>Bill Breakdown</span>
        </h4>
        <div className="flex justify-between">
          <span>Items Subtotal ({totalItems} items)</span>
          <span className="font-bold text-slate-900">₹{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <span>Counter Platform Token Fee</span>
          </span>
          <span className="font-bold text-slate-900">₹{platformFee}</span>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
          <span>To Pay</span>
          <span className="text-orange-600">₹{grandTotal}</span>
        </div>
      </div>

      {/* Checkout CTA */}
      <button
        onClick={() => navigate('/checkout')}
        className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
      >
        <span>Proceed to Counter Checkout (₹{grandTotal})</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
