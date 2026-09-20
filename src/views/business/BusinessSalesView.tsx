import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const BusinessSalesView: React.FC = () => {
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'all'>('today');

  useEffect(() => {
    orderService.getShopOrders(targetShopId).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, [targetShopId]);

  const completed = orders.filter((o) => o.orderStatus === 'COMPLETED');
  const totalRevenue = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const avgOrderValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

  // Calculate top items
  const itemCounts: { [name: string]: { count: number; revenue: number } } = {};
  completed.forEach((o) => {
    o.items?.forEach((item) => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { count: 0, revenue: 0 };
      }
      itemCounts[item.name].count += item.quantity || 1;
      itemCounts[item.name].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const topItems = Object.entries(itemCounts)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <BusinessLayout activeTab="more" title="Sales Analytics & Revenue">
      <div className="space-y-6 pb-24 max-w-4xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Total Sales</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">₹{totalRevenue}</div>
            <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Real-time counter earnings</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Tokens Cleared</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{completed.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Orders fulfilled</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Avg. Token Value</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">₹{avgOrderValue}</div>
            <div className="text-[11px] text-slate-400 font-medium">Per pickup customer</div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top Selling Counter Dishes</h3>
              <p className="text-xs text-slate-500">Your stall's most ordered items</p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          {topItems.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {topItems.map((item, idx) => (
                <div key={item.name} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.count} portions sold</div>
                    </div>
                  </div>
                  <div className="font-black text-xs text-slate-900">
                    ₹{item.revenue}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No sales data accumulated yet.
            </div>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
};
