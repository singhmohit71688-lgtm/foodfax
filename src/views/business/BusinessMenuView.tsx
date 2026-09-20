import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { menuService } from '../../services/menuService';
import { MenuItem } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { VegBadge } from '../../components/common/VegBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const BusinessMenuView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMenu = async () => {
    setLoading(true);
    const loaded = await menuService.getShopMenu(targetShopId);
    setItems(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadMenu();
  }, [targetShopId]);

  const handleToggleAvailability = async (item: MenuItem) => {
    const updated = await menuService.toggleAvailability(item.id, !item.isAvailable);
    if (updated) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this dish from your stall menu?')) return;
    await menuService.deleteItem(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const filtered = items.filter((i) => {
    if (!searchQuery.trim()) return true;
    return i.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <BusinessLayout activeTab="menu" title="Menu Management">
      <div className="space-y-5 pb-24">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter dishes..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/business/availability')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Quick Stock Toggle
            </button>
            <button
              onClick={() => navigate('/business/menu/new')}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>
        </div>

        {/* Menu Items List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
            Loading stall dishes...
          </div>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <VegBadge isVeg={item.isVeg} size="sm" />
                      <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                      {item.isBestseller && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium line-clamp-1">
                      {item.description || 'Quick counter item'}
                    </div>
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-black text-slate-900">₹{item.price}</span>
                      {item.preparationTimeMin && (
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          ~{item.preparationTimeMin}m prep
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      item.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                  </button>

                  <button
                    onClick={() => navigate(`/business/menu/${item.id}`)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    aria-label="Edit dish"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    aria-label="Delete dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No dishes on menu yet"
            description="Add dishes and snacks to your stall menu so customers can view and place orders."
            actionText="Add First Dish"
            onAction={() => navigate('/business/menu/new')}
          />
        )}
      </div>
    </BusinessLayout>
  );
};
