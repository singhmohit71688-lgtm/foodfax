import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { orderService } from '../services/orderService';
import { orderRealtimeService } from '../services/orderRealtimeService';
import { Order } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { 
  ReceiptText, 
  Clock, 
  Store, 
  ChevronRight, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  Volume2,
  Filter
} from 'lucide-react';

export const OrdersHistoryView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser } = useAuth();
  const { highContrast } = useAccessibility();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const data = await orderService.getCustomerOrders(currentUser?.id);
      setOrders(data);
      setLoading(false);
    };

    fetchOrders();

    // Listen to real-time events for active customer order updates
    const unsub = orderRealtimeService.subscribeToCustomer(currentUser?.id, (updatedOrders) => {
      setOrders(updatedOrders);
    });

    return () => unsub();
  }, [currentUser?.id]);

  if (loading) {
    return (
      <div 
        role="status" 
        aria-live="polite"
        className="max-w-2xl mx-auto px-4 py-6 space-y-3 animate-pulse"
      >
        <div className="h-8 w-40 bg-slate-200 rounded-xl" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <span className="sr-only">Loading orders list...</span>
      </div>
    );
  }

  const activeOrdersCount = orders.filter(
    (o) =>
      o.orderStatus === 'PENDING' ||
      o.orderStatus === 'ACCEPTED' ||
      o.orderStatus === 'PREPARING' ||
      o.orderStatus === 'READY'
  ).length;

  const filteredOrders = orders.filter((order) => {
    const isActive =
      order.orderStatus === 'PENDING' ||
      order.orderStatus === 'ACCEPTED' ||
      order.orderStatus === 'PREPARING' ||
      order.orderStatus === 'READY';

    if (filter === 'active') return isActive;
    if (filter === 'completed') return !isActive;
    return true;
  });

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <EmptyState
          type="orders"
          title="No orders yet"
          description="Your counter tokens and live order status will show up here as soon as you order."
          actionText="Explore Food Stalls"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="pb-28 max-w-2xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Order Tokens & History
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time status updates, counter tokens & collection receipts
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {orders.length} Total
        </span>
      </div>

      {/* Filter Tabs */}
      <div 
        role="tablist" 
        aria-label="Order filters"
        className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl max-w-sm"
      >
        <button
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          role="tab"
          aria-selected={filter === 'active'}
          onClick={() => setFilter('active')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            filter === 'active'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {activeOrdersCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
          )}
          <span>Active ({activeOrdersCount})</span>
        </button>
        <button
          role="tab"
          aria-selected={filter === 'completed'}
          onClick={() => setFilter('completed')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            filter === 'completed'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Orders List */}
      <div role="list" className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">No {filter} orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isActive =
              order.orderStatus === 'PENDING' ||
              order.orderStatus === 'ACCEPTED' ||
              order.orderStatus === 'PREPARING' ||
              order.orderStatus === 'READY';

            const isReady = order.orderStatus === 'READY';

            return (
              <div
                key={order.id}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/order/${order.id}`);
                  }
                }}
                onClick={() => navigate(`/order/${order.id}`)}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-orange-600 ${
                  isReady
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                    : isActive
                    ? 'border-orange-300 ring-2 ring-orange-500/15 shadow-md shadow-orange-500/5'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
                aria-label={`Order token ${order.tokenNumber} from ${order.shopName}, status ${order.orderStatus}`}
              >
                {/* Card top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-none flex-shrink-0 ${
                        isReady
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isActive
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider opacity-80">
                        Token
                      </span>
                      <span className="text-base font-mono mt-0.5">
                        {order.tokenNumber}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-orange-600 transition-colors">
                        {order.shopName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{order.orderType === 'DINE_IN' ? 'Dine-in' : 'Takeaway'}</span>
                        {order.tableNumber && <span>({order.tableNumber})</span>}
                        <span>•</span>
                        <span className="font-bold text-slate-800">₹{order.total}</span>
                        <span>•</span>
                        <span>
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg ${
                        isReady
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : order.orderStatus === 'PREPARING'
                          ? 'bg-orange-100 text-orange-800'
                          : order.orderStatus === 'ACCEPTED'
                          ? 'bg-blue-100 text-blue-800'
                          : order.orderStatus === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isReady ? '🔔 Ready for Pickup' : order.orderStatus}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="truncate max-w-[220px] sm:max-w-xs font-medium">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </span>

                  <div className="flex items-center gap-1 text-orange-600 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                    <span>{isActive ? 'Track Live' : 'View Receipt'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
