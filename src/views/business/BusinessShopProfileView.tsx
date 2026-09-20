import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { shopService } from '../../services/shopService';
import { Shop } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  Save, 
  CheckCircle2, 
  Image as ImageIcon,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const BusinessShopProfileView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [stallType, setStallType] = useState('Thela / Food Stall');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [image, setImage] = useState('');
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    shopService.getShop(targetShopId).then((loaded) => {
      if (loaded) {
        setShop(loaded);
        setName(loaded.name);
        setTagline(loaded.tagline || '');
        setStallType(loaded.stallType || 'Thela / Food Stall');
        setPhone(loaded.contactPhone || '');
        setAddress(loaded.location?.address || loaded.address || '');
        setOpeningHours(loaded.openingHours || '08:00 AM - 10:00 PM');
        setImage(loaded.image || '');
        setIsPureVeg(Boolean(loaded.isPureVeg));
        setIsOpen(Boolean(loaded.isOpen));
      }
      setLoading(false);
    });
  }, [targetShopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please provide stall name, phone, and address.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const updated = await shopService.updateShop(targetShopId, {
        name: name.trim(),
        tagline: tagline.trim(),
        stallType,
        contactPhone: phone.trim(),
        address: address.trim(),
        city: 'Mumbai',
        location: {
          address: address.trim(),
          landmark: 'Counter Stand',
          distanceKm: shop?.location?.distanceKm || 0.5,
          latitude: shop?.location?.latitude || 19.0178,
          longitude: shop?.location?.longitude || 72.8478,
        },
        openingHours,
        image: image.trim() || shop?.image,
        isPureVeg,
        isOpen,
      });

      if (updated) {
        setShop(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update stall profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BusinessLayout activeTab="more" title="Stall Profile">
        <div className="py-16 text-center text-slate-400 animate-pulse text-xs">
          Loading stall profile...
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout activeTab="more" title="Stall Profile & Info">
      <div className="max-w-xl mx-auto space-y-5 pb-24">
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Stall details updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Stall Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Tagline or Specialty
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Authentic Mumbai Street Snacks & Garam Cutting Chai"
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Stall Type
              </label>
              <select
                value={stallType}
                onChange={(e) => setStallType(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                <option value="Thela / Street Stall">Thela / Street Stall</option>
                <option value="College Canteen">College Canteen</option>
                <option value="Tea Tapri">Tea Tapri</option>
                <option value="Fast Food Kiosk">Fast Food Kiosk</option>
                <option value="Juice Centre">Juice Centre</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Physical Stall Address / Counter Landmark
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Daily Operating Hours
            </label>
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="08:00 AM - 10:00 PM"
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Stall Photo URL
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Pure Vegetarian Stall</span>
                <span className="text-[11px] text-slate-500">Displays 100% Pure Veg badge across all customer views</span>
              </div>
              <input
                type="checkbox"
                checked={isPureVeg}
                onChange={(e) => setIsPureVeg(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Stall Open Status</span>
                <span className="text-[11px] text-slate-500">Toggle whether your stall is currently accepting counter orders</span>
              </div>
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="w-5 h-5 rounded accent-orange-600 cursor-pointer"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Stall Details'}</span>
          </button>
        </form>
      </div>
    </BusinessLayout>
  );
};
