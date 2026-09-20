import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { shopService } from '../services/shopService';
import { menuService } from '../services/menuService';
import { Shop, MenuItem, ShopCategory } from '../types';
import { ShopCard } from '../components/shop/ShopCard';
import { MenuItemCard } from '../components/shop/MenuItemCard';
import { VegBadge } from '../components/common/VegBadge';
import { EmptyState } from '../components/common/EmptyState';
import { 
  Search, 
  X, 
  Store, 
  Utensils, 
  MapPin, 
  SlidersHorizontal,
  ArrowLeft,
  Flame,
  Sparkles
} from 'lucide-react';

export const SearchView: React.FC = () => {
  const { navigate, route } = useRouter();
  const initialQuery = route?.params?.q || route?.searchQuery || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'dishes' | 'shops'>('all');
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [savedShopIds, setSavedShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    shopService.getCategories().then(setCategories);
    setSavedShopIds(shopService.getSavedShopIds());
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const [foundShops, foundItems] = await Promise.all([
          shopService.searchShops(searchQuery, selectedCategory === 'all' ? undefined : selectedCategory),
          menuService.searchMenuItems(searchQuery)
        ]);
        setShops(foundShops);
        setMenuItems(foundItems);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const filteredShops = vegOnly ? shops.filter(s => s.isPureVeg) : shops;
  const filteredItems = vegOnly ? menuItems.filter(i => i.isVeg) : menuItems;

  const handleToggleSaved = (shopId: string) => {
    shopService.toggleSaveShop(shopId);
    setSavedShopIds(shopService.getSavedShopIds());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Search Bar Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative flex-1 flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3.5 mr-2" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, vada pav, chai, or food stalls..."
              autoFocus
              className="w-full py-3.5 pr-10 text-sm font-medium text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              vegOnly 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <VegBadge isVeg={true} size="sm" />
            <span>Pure Veg Only</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Quick Categories */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
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

      {/* Results Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Results ({filteredShops.length + filteredItems.length})
        </button>
        <button
          onClick={() => setActiveTab('dishes')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'dishes'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dishes ({filteredItems.length})
        </button>
        <button
          onClick={() => setActiveTab('shops')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'shops'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Food Stalls ({filteredShops.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-slate-400 animate-pulse">
          Searching stalls & dishes...
        </div>
      )}

      {/* Results Content */}
      {!loading && (
        <div className="space-y-8">
          {/* Dishes section */}
          {(activeTab === 'all' || activeTab === 'dishes') && filteredItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Dishes & Snacks ({filteredItems.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const shop = shops.find(s => s.id === item.shopId) || {
                    id: item.shopId,
                    name: 'Food Stall',
                    slug: item.shopId,
                    tagline: '',
                    description: '',
                    stallType: 'Thela / Stall',
                    image: '',
                    rating: 4.8,
                    totalRatings: 50,
                    location: { address: 'Counter', city: 'Mumbai' },
                    isOpen: true,
                    openingHours: '9am - 10pm',
                    contactPhone: '',
                    isPopular: false,
                    counterOrderEnabled: true
                  };
                  return (
                    <MenuItemCard key={item.id} item={item} shop={shop as any} />
                  );
                })}
              </div>
            </div>
          )}

          {/* Stalls section */}
          {(activeTab === 'all' || activeTab === 'shops') && filteredShops.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Food Stalls & Counters ({filteredShops.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    isSaved={savedShopIds.includes(shop.id)}
                    onToggleSaved={handleToggleSaved}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state if nothing found */}
          {filteredShops.length === 0 && filteredItems.length === 0 && (
            <EmptyState
              title="No results found"
              description={`We couldn't find any dishes or food stalls matching "${searchQuery}". Try different keywords like "Noodles", "Vada Pav", or "Chai".`}
              actionText="View All Stalls"
              onAction={() => navigate('/')}
            />
          )}
        </div>
      )}
    </div>
  );
};
