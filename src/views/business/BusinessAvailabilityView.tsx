import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { menuService } from '../../services/menuService';
import { MenuItem } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { VegBadge } from '../../components/common/VegBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  Zap 
} from 'lucide-react';

export const BusinessAvailabilityView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    menuService.getShopMenu(targetShopId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [targetShopId]);

  const toggleStatus = async (item: MenuItem) => {
    const updated = await menuService.toggleAvailability(item.id, !item.isAvailable);
    if (updated) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    }
  };

  const markAll = async (available: boolean) => {
    for (const item of items) {
      if (item.isAvailable !== available) {
        await menuService.toggleAvailability(item.id, available);
      }
    }
    const updated = await menuService.getShopMenu(targetShopId);
    setItems(updated);
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <BusinessLayout
      title="Quick Dish Stock Availability"
      subtitle="1-Tap live sold-out / in-stock toggles for peak counter rush hours"
      showBackButton
      onBack={() => navigate('/business/menu')}
    >
      <div className="max-w-2xl mx-auto space-y-5 pb-24">
        {/* Bulk Actions & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dish..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll(true)}
              className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
            >
              All In Stock
            </button>
            <button
              onClick={() => markAll(false)}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors"
            >
              All Sold Out
            </button>
          </div>
        </div>

        {/* List of items */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
            Loading items...
          </div>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <VegBadge isVeg={item.isVeg} size="sm" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      {item.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500">
                      ₹{item.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleStatus(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    item.isAvailable
                      ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>IN STOCK</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>SOLD OUT</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No dishes found"
            description="No items match your filter."
            actionText="Back to Menu"
            onAction={() => navigate('/business/menu')}
          />
        )}
      </div>
    </BusinessLayout>
  );
};
