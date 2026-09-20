import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { orderRealtimeService } from '../../services/orderRealtimeService';
import { Order, OrderStatus } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { OrderCard } from '../../components/business/OrderCard';
import { RushModeView } from '../../components/business/RushModeView';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Search, 
  Zap, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Utensils 
} from 'lucide-react';

export const BusinessOrdersView: React.FC = () => {
  const { navigate, route } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRushModeOpen, setIsRushModeOpen] = useState(() => route?.searchQuery?.includes('mode=rush') || false);

  const loadOrders = async () => {
    setLoading(true);
    const data = await orderService.getShopOrders(targetShopId);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const unsub = orderRealtimeService.subscribeToShop(targetShopId, (updated) => {
      setOrders(updated);
    });
    return () => unsub();
  }, [targetShopId]);

  let filtered = orders.filter((o) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchToken = o.tokenNumber?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.toLowerCase().includes(q);
      if (!matchToken && !matchName && !matchPhone) return false;
    }

    if (activeTab === 'ACTIVE') {
      return (
        o.orderStatus === 'PENDING' ||
        o.orderStatus === 'ACCEPTED' ||
        o.orderStatus === 'PREPARING' ||
        o.orderStatus === 'READY'
      );
    }
    if (activeTab === 'PENDING') {
      return o.orderStatus === 'PENDING' || o.orderStatus === 'ACCEPTED';
    }
    if (activeTab === 'PREPARING') {
      return o.orderStatus === 'PREPARING';
    }
    if (activeTab === 'READY') {
      return o.orderStatus === 'READY';
    }
    if (activeTab === 'COMPLETED') {
      return o.orderStatus === 'COMPLETED' || o.orderStatus === 'CANCELLED';
    }
    return true;
  });

  return (
    <BusinessLayout activeTab="orders" title="Order Queue & Tokens">
      <div className="space-y-5 pb-24">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by token (e.g. #101) or customer name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRushModeOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Rush Mode</span>
            </button>
            <button
              onClick={loadOrders}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              aria-label="Refresh orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
          {[
            { key: 'ACTIVE', label: 'All Active' },
            { key: 'PENDING', label: 'New / Accepted' },
            { key: 'PREPARING', label: 'Preparing' },
            { key: 'READY', label: 'Ready for Call' },
            { key: 'COMPLETED', label: 'Past History' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-3 text-xs font-black transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
            Updating counter queue...
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={loadOrders}
                onViewDetails={(id) => navigate(`/business/orders/${id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No orders found"
            description="There are currently no orders in this status category."
            actionText="Clear Search"
            onAction={() => {
              setSearchQuery('');
              setActiveTab('ACTIVE');
            }}
          />
        )}
      </div>

      {isRushModeOpen && (
        <RushModeView
          orders={orders}
          onClose={() => setIsRushModeOpen(false)}
          onRefresh={loadOrders}
        />
      )}
    </BusinessLayout>
  );
};
