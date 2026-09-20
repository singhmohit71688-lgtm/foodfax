import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { menuService } from '../../services/menuService';
import { shopService } from '../../services/shopService';
import { MenuItem, ShopCategory } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { VegBadge } from '../../components/common/VegBadge';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Flame, 
  Clock, 
  IndianRupee, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const BusinessItemFormView: React.FC = () => {
  const { navigate, route } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const itemId = route?.params?.itemId;
  const isEditing = Boolean(itemId && itemId !== 'new');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('50');
  const [isVeg, setIsVeg] = useState(true);
  const [categoryId, setCategoryId] = useState('snacks');
  const [prepMinutes, setPrepMinutes] = useState('5');
  const [image, setImage] = useState('');
  const [isBestseller, setIsBestseller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    shopService.getCategories().then(setCategories);

    if (isEditing && itemId) {
      menuService.getMenuItem(itemId).then((loaded) => {
        if (loaded) {
          setName(loaded.name);
          setDescription(loaded.description || '');
          setPrice(String(loaded.price));
          setIsVeg(loaded.isVeg);
          setCategoryId(loaded.categoryId || 'snacks');
          setPrepMinutes(String(loaded.preparationTimeMin || 5));
          setImage(loaded.image || '');
          setIsBestseller(Boolean(loaded.isBestseller));
          setIsAvailable(loaded.isAvailable);
        }
        setLoading(false);
      });
    }
  }, [itemId, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter dish name.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid positive price.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const itemData = {
        shopId: targetShopId,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        isVeg,
        categoryId,
        category: categoryId,
        preparationTimeMin: Number(prepMinutes) || 5,
        preparationMinutes: `${prepMinutes} mins`,
        image: image.trim() || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
        isBestseller,
        isAvailable,
      };

      if (isEditing && itemId) {
        await menuService.updateItem(itemId, itemData);
      } else {
        await menuService.createItem(itemData);
      }

      navigate('/business/menu');
    } catch (err: any) {
      setError(err?.message || 'Failed to save menu item.');
      setSubmitting(false);
    }
  };

  return (
    <BusinessLayout
      title={isEditing ? 'Edit Dish' : 'Add New Dish'}
      subtitle={isEditing ? `Modifying item ${name}` : 'Add a new food item or snack to your counter'}
      showBackButton
      onBack={() => navigate('/business/menu')}
    >
      <div className="max-w-xl mx-auto space-y-6 pb-24">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Dish / Snack Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Masala Pav, Cutting Chai, Samosa"
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Prep Time (Minutes)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  value={prepMinutes}
                  onChange={(e) => setPrepMinutes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Veg / Non-Veg Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Food Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsVeg(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  isVeg
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <VegBadge isVeg={true} size="sm" />
                <span>Pure Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVeg(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  !isVeg
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <VegBadge isVeg={false} size="sm" />
                <span>Non-Vegetarian</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
              <option value="snacks">Snacks & Street Food</option>
              <option value="beverages">Tea & Beverages</option>
              <option value="fast-food">Fast Food</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh hot potatoes, toasted pav with red garlic chutney..."
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Toggles: Bestseller & In Stock */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-600"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Mark as Popular / Bestseller</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-700">
                Available Now (In Stock)
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Dish...' : isEditing ? 'Save Changes' : 'Add to Stall Menu'}</span>
          </button>
        </form>
      </div>
    </BusinessLayout>
  );
};
