import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  User, 
  Phone, 
  Store, 
  ReceiptText, 
  Heart, 
  Sliders, 
  QrCode, 
  LogOut, 
  Sparkles, 
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface ProfileViewProps {
  onOpenQRScanner?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenQRScanner }) => {
  const { navigate } = useRouter();
  const { currentUser, currentBusiness, logout, loginAsDemoCustomer, loginAsDemoOwner } = useAuth();
  const { openA11yModal } = useAccessibility();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* User Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 font-black text-2xl flex items-center justify-center border border-orange-200/60 shadow-xs">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-lg text-slate-900 truncate">
              {currentUser?.name || 'FoodFlow Customer'}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {currentUser?.role === 'owner' ? 'Stall Owner' : 'Customer'}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentUser?.phone || '+91 98200 12345'}</span>
          </p>
        </div>
      </div>

      {/* Stall Owner Portal Banner (If user is owner or wants to register stall) */}
      {currentUser?.role === 'owner' ? (
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-5 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Store className="w-6 h-6" />
              <div>
                <h3 className="font-black text-base">Owner Business Dashboard</h3>
                <p className="text-xs text-orange-100">
                  {currentBusiness?.name || 'Your Stall Counter'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/business')}
            className="w-full py-3 bg-white text-orange-700 font-black text-xs rounded-xl shadow-xs hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Stall Token Management</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Do you run a food stall or canteen?</h3>
              <p className="text-xs text-slate-400">
                Digitize queue tokens and accept orders seamlessly.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/setup-shop')}
            className="w-full py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition-colors"
          >
            Register Your Counter Stall in 2 Minutes
          </button>
        </div>
      )}

      {/* Quick Navigation Links */}
      <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
        <button
          onClick={() => navigate('/orders')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 block">Orders History & Tokens</span>
              <span className="text-[11px] text-slate-500">View active calls and past receipts</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/saved')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 block">Saved Stalls</span>
              <span className="text-[11px] text-slate-500">Your favorite food corners</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {onOpenQRScanner && (
          <button
            onClick={onOpenQRScanner}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block">Scan Counter QR Code</span>
                <span className="text-[11px] text-slate-500">Open stall menu or verify pickup</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        <button
          onClick={openA11yModal}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 block">Accessibility & Audio Announcements</span>
              <span className="text-[11px] text-slate-500">High contrast, text size, and chimes</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Demo Switcher Utility */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-xs text-slate-800">Quick Testing / Demo Switcher</h4>
        </div>
        <p className="text-[11px] text-slate-500">
          Switch between customer experience and stall owner live order token management instantly:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              loginAsDemoCustomer();
              navigate('/');
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors text-center"
          >
            Demo Customer
          </button>
          <button
            onClick={() => {
              loginAsDemoOwner();
              navigate('/business');
            }}
            className="py-2.5 px-3 rounded-xl border border-orange-200 bg-orange-50 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors text-center"
          >
            Demo Stall Owner
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Account</span>
      </button>
    </div>
  );
};
