import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { shopService } from '../services/shopService';
import { Shop, ShopCategory } from '../types';
import { ShopCard } from '../components/shop/ShopCard';
import { VegBadge } from '../components/common/VegBadge';
import { EmptyState } from '../components/common/EmptyState';
import { 
  Store, 
  ArrowLeft, 
  Filter, 
  MapPin, 
  Search,
  Check
} from 'lucide-react';

export const ShopsView: React.FC = () => {
  const { navigate, route } = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(route?.params?.category || 'all');
  const [vegOnly, setVegOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [savedShopIds, setSavedShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [allShops, cats] = await Promise.all([
        shopService.getNearbyShops(),
        shopService.getCategories()
      ]);
      setShops(allShops);
      setCategories(cats);
      setSavedShopIds(shopService.getSavedShopIds());
      setLoading(false);
    };
    load();
  }, []);

  const handleToggleSaved = (shopId: string) => {
    shopService.toggleSaveShop(shopId);
    setSavedShopIds(shopService.getSavedShopIds());
  };

  let filtered = selectedCategory === 'all'
    ? shops
    : shops.filter(s => s.categories && s.categories.includes(selectedCategory));

  if (vegOnly) {
    filtered = filtered.filter(s => s.isPureVeg);
  }

  if (openOnly) {
    filtered = filtered.filter(s => s.isOpen);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              All Food Stalls & Counters
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Browse {filtered.length} verified street vendors & canteens
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-200" />

        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            vegOnly
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <VegBadge isVeg={true} size="sm" />
          <span>Veg Only</span>
        </button>

        <button
          onClick={() => setOpenOnly(!openOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            openOnly
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Open Now
        </button>
      </div>

      {/* Grid of Shops */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              isSaved={savedShopIds.includes(shop.id)}
              onToggleSaved={handleToggleSaved}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No food stalls match your filters"
          description="Try resetting the category filter or pure veg toggle to see more counters."
          actionText="Reset Filters"
          onAction={() => {
            setSelectedCategory('all');
            setVegOnly(false);
            setOpenOnly(false);
          }}
        />
      )}
    </div>
  );
};
