import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { shopService } from '../services/shopService';
import { Shop } from '../types';
import { ShopCard } from '../components/shop/ShopCard';
import { EmptyState } from '../components/common/EmptyState';
import { Heart, ArrowLeft, Store } from 'lucide-react';

export const SavedShopsView: React.FC = () => {
  const { navigate } = useRouter();
  const [savedShops, setSavedShops] = useState<Shop[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSaved = async () => {
      setLoading(true);
      const ids = shopService.getSavedShopIds();
      setSavedIds(ids);

      const allShops = await shopService.getNearbyShops();
      const filtered = allShops.filter((s) => ids.includes(s.id));
      setSavedShops(filtered);
      setLoading(false);
    };

    loadSaved();
  }, []);

  const handleToggleSaved = (shopId: string) => {
    shopService.toggleSaveShop(shopId);
    const nextIds = shopService.getSavedShopIds();
    setSavedIds(nextIds);
    setSavedShops((prev) => prev.filter((s) => nextIds.includes(s.id)));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>Saved Stalls & Favorites</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Quick 1-tap access to your daily tea & snack counters
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : savedShops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              isSaved={true}
              onToggleSaved={handleToggleSaved}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Saved Stalls Yet"
          description="Save your favorite roadside stalls, canteens, and tea spots by tapping the heart icon on any stall card."
          actionText="Explore Nearby Stalls"
          onAction={() => navigate('/')}
        />
      )}
    </div>
  );
};
