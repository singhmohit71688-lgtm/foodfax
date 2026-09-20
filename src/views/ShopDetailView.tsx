import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { shopService } from '../services/shopService';
import { menuService } from '../services/menuService';
import { Shop, MenuItem, ShopCategory } from '../types';
import { MenuItemCard } from '../components/shop/MenuItemCard';
import { VegBadge } from '../components/common/VegBadge';
import { EmptyState } from '../components/common/EmptyState';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  Star, 
  Share2, 
  Heart, 
  Search,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ShopDetailViewProps {
  shopId: string;
}

export const ShopDetailView: React.FC<ShopDetailViewProps> = ({ shopId }) => {
  const { navigate } = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShopData = async () => {
      setLoading(true);
      try {
        const [loadedShop, items, cats] = await Promise.all([
          shopService.getShop(shopId),
          menuService.getShopMenu(shopId),
          shopService.getCategories()
        ]);
        if (loadedShop) {
          setShop(loadedShop);
          setIsSaved(shopService.getSavedShopIds().includes(loadedShop.id));
        }
        setMenuItems(items);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load shop:', err);
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [shopId]);

  const handleToggleSaved = () => {
    if (!shop) return;
    const nextSaved = shopService.toggleSaveShop(shop.id);
    setIsSaved(nextSaved);
  };

  const handleShare = () => {
    if (navigator.share && shop) {
      navigator.share({
        title: shop.name,
        text: `Order directly from ${shop.name} on FoodFlow!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          title="Food Stall Not Found"
          description="This stall might be temporarily closed or unlisted."
          actionText="Back to Food Stalls"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const stallCategories = categories.filter(c => shop.categories?.includes(c.id));

  let filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-28">
      {/* Top Bar with Back, Share, Save */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            aria-label="Share stall"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleSaved}
            className={`p-2.5 rounded-2xl border transition-colors shadow-xs ${
              isSaved 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
            }`}
            aria-label="Save stall"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Banner & Stall Info */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="relative h-44 sm:h-56 w-full bg-slate-900">
          <img
            src={shop.image || shop.bannerImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'}
            alt={shop.name}
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md ${
              shop.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
            }`}>
              {shop.isOpen ? 'Open for Counter Pickup' : 'Closed'}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-600/90 px-2 py-0.5 rounded-full">
                {shop.stallType || 'Food Stall'}
              </span>
              {shop.isPureVeg && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <VegBadge isVeg={true} size="sm" />
                  Pure Veg
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              {shop.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-0.5 line-clamp-1">
              {shop.tagline || shop.description}
            </p>
          </div>
        </div>

        {/* Metadata Details Bar */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="font-medium">{shop.location?.address || shop.address || 'Local Street Counter'}</span>
            {shop.location?.distanceKm !== undefined && (
              <span className="text-slate-400 font-bold">({shop.location.distanceKm.toFixed(1)} km)</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{shop.openingHours || 'Open Today'}</span>
            </div>
            {shop.rating && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-lg font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{shop.rating.toFixed(1)}</span>
              </div>
            )}
            {shop.contactPhone && (
              <a
                href={`tel:${shop.contactPhone}`}
                className="flex items-center gap-1 text-orange-600 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Stall</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Menu Filters & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search dishes at ${shop.name}...`}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto ${
              vegOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <VegBadge isVeg={true} size="sm" />
            <span>Pure Veg Only</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {stallCategories.map((cat) => (
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
        </div>
      </div>

      {/* Dishes List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Menu Dishes ({filteredItems.length})</span>
          {!shop.isOpen && (
            <span className="text-xs text-rose-600 font-semibold">
              Currently not accepting new counter orders
            </span>
          )}
        </h3>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} shop={shop} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No dishes found"
            description="No items match your search or filter selection."
            actionText="View All Items"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setVegOnly(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
