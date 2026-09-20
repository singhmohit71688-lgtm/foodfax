import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { Order, OrderStatus } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { VegBadge } from '../../components/common/VegBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  ArrowLeft, 
  Clock, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  Printer, 
  User, 
  Receipt,
  AlertCircle
} from 'lucide-react';

export const BusinessOrderDetailView: React.FC = () => {
  const { navigate, route } = useRouter();
  const orderId = route?.params?.orderId || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    setLoading(true);
    const loaded = await orderService.getOrder(orderId);
    setOrder(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!order) return;
    let updated: Order | null = null;
    if (nextStatus === 'PREPARING') {
      updated = await orderService.startPreparing(order.id);
    } else if (nextStatus === 'READY') {
      updated = await orderService.markReady(order.id);
      notificationService.playReadyChime();
    } else if (nextStatus === 'COMPLETED') {
      updated = await orderService.completeOrder(order.id);
    } else if (nextStatus === 'CANCELLED') {
      updated = await orderService.rejectOrder(order.id, 'Stall item unavailable');
    }

    if (updated) {
      setOrder(updated);
    }
  };

  if (loading) {
    return (
      <BusinessLayout showBackButton onBack={() => navigate('/business/orders')}>
        <div className="py-16 text-center text-slate-400 animate-pulse text-xs">
          Loading order details...
        </div>
      </BusinessLayout>
    );
  }

  if (!order) {
    return (
      <BusinessLayout showBackButton onBack={() => navigate('/business/orders')}>
        <EmptyState
          title="Order Not Found"
          description="We couldn't locate this order in the counter system."
          actionText="Back to Orders"
          onAction={() => navigate('/business/orders')}
        />
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout
      title={`Token #${order.tokenNumber || order.id.slice(-4)}`}
      subtitle={`Placed at ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
      showBackButton
      onBack={() => navigate('/business/orders')}
    >
      <div className="max-w-2xl mx-auto space-y-6 pb-24">
        {/* Token Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pickup Token Number
            </div>
            <div className="text-4xl font-black text-orange-600 tracking-tight">
              #{order.tokenNumber || order.id.slice(-4)}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1">
              {order.orderType === 'DINE_IN' ? 'Dine In / Counter Stand' : 'Takeaway / Counter Bag'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {order.orderStatus === 'PENDING' && (
              <button
                onClick={() => handleStatusUpdate('PREPARING')}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
              >
                Accept & Start Prep
              </button>
            )}

            {order.orderStatus === 'PREPARING' && (
              <button
                onClick={() => handleStatusUpdate('READY')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>Call Customer & Mark Ready</span>
              </button>
            )}

            {order.orderStatus === 'READY' && (
              <button
                onClick={() => handleStatusUpdate('COMPLETED')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Handed Over / Complete</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              aria-label="Print receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{order.customerName}</div>
              <div className="text-xs text-slate-500">{order.customerPhone}</div>
            </div>
          </div>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="px-3.5 py-2 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs flex items-center gap-1.5 hover:bg-orange-100"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Items to Prepare ({order.items.length})
          </h4>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                    {item.quantity}x
                  </span>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    <div className="text-[11px] text-slate-500">₹{item.price} each</div>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          {order.instructions && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
              <span className="font-bold">Customer Note:</span> {order.instructions}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
            <span>Total Bill</span>
            <span className="text-orange-600">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
};
