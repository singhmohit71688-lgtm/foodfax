import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { shopService } from '../../services/shopService';
import { menuService } from '../../services/menuService';
import { orderRealtimeService } from '../../services/orderRealtimeService';
import { Order, Shop, MenuItem } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { OrderCard } from '../../components/business/OrderCard';
import { RushModeView } from '../../components/business/RushModeView';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Receipt, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  Zap, 
  QrCode, 
  UtensilsCrossed, 
  TrendingUp, 
  ArrowRight,
  Flame,
  AlertCircle
} from 'lucide-react';

export const BusinessDashboardView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRushModeOpen, setIsRushModeOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const shopOrders = await orderService.getShopOrders(targetShopId);
    setOrders(shopOrders);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = orderRealtimeService.subscribeToShop(targetShopId, (updated) => {
      setOrders(updated);
    });
    return () => unsub();
  }, [targetShopId]);

  const activeOrders = orders.filter(
    (o) =>
      o.orderStatus === 'PENDING' ||
      o.orderStatus === 'ACCEPTED' ||
      o.orderStatus === 'PREPARING' ||
      o.orderStatus === 'READY'
  );

  const completedOrders = orders.filter((o) => o.orderStatus === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  return (
    <BusinessLayout activeTab="dashboard" title="Live Counter Overview">
      <div className="space-y-6 pb-20">
        {/* Rush Mode Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                Stall Counter Fast-Track
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Counter Peak Rush Mode</h2>
            <p className="text-xs text-orange-100 max-w-md">
              Giant single-tap token advance buttons, high-contrast audio chimes, and instant queue clearing.
            </p>
          </div>
          <button
            onClick={() => setIsRushModeOpen(true)}
            className="py-3 px-5 rounded-2xl bg-white text-orange-700 font-black text-xs hover:bg-orange-50 shadow-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Zap className="w-4 h-4 fill-orange-600 text-orange-600" />
            <span>Launch Rush Mode</span>
          </button>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold">Active Orders</span>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{activeOrders.length}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">In queue & prep</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold">Today's Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹{totalRevenue}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {completedOrders.length} paid pickups
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{completedOrders.length}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Tokens cleared</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold">Stall QR Code</span>
              <QrCode className="w-4 h-4 text-purple-600" />
            </div>
            <button
              onClick={() => navigate('/business/qr')}
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 mt-1"
            >
              <span>View & Print QR</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Print for thela stand</div>
          </div>
        </div>

        {/* Live Active Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Live Order Queue ({activeOrders.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/business/orders')}
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <span>View Full Order Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
              Loading counter tokens...
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.slice(0, 6).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={loadData}
                  onViewDetails={(id) => navigate(`/business/orders/${id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active orders in queue"
              description="New token orders placed by customers or scanned at your counter QR will appear here in real time."
              actionText="Manage Menu Items"
              onAction={() => navigate('/business/menu')}
            />
          )}
        </div>
      </div>

      {/* Rush Mode Modal */}
      {isRushModeOpen && (
        <RushModeView
          orders={orders}
          onClose={() => setIsRushModeOpen(false)}
          onRefresh={loadData}
        />
      )}
    </BusinessLayout>
  );
};
