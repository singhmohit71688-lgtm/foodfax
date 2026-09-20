import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { 
  Settings, 
  Volume2, 
  Zap, 
  User, 
  Sliders, 
  LogOut, 
  ShieldCheck, 
  Store,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export const BusinessSettingsView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, currentBusiness, logout, loginAsDemoCustomer } = useAuth();
  const { openA11yModal } = useAccessibility();

  const [autoAccept, setAutoAccept] = useState(false);
  const [loudChimes, setLoudChimes] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <BusinessLayout activeTab="more" title="Stall Settings">
      <div className="max-w-xl mx-auto space-y-6 pb-24">
        {/* Stall & Account Info */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl">
            <Store className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-slate-900 truncate">
              {currentBusiness?.name || 'Stall Counter'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Owner: {currentUser?.name || 'Stall Vendor'} ({currentUser?.phone || '+91 98200 12345'})
            </p>
          </div>
        </div>

        {/* Counter Operational Settings */}
        <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block">
                Auto-Accept Incoming Orders
              </span>
              <span className="text-[11px] text-slate-500">
                Immediately assign token and move new orders to preparing queue
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoAccept}
              onChange={(e) => setAutoAccept(e.target.checked)}
              className="w-5 h-5 rounded accent-orange-600 cursor-pointer"
            />
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block">
                Loud Counter Chimes
              </span>
              <span className="text-[11px] text-slate-500">
                Play auditory alerts on token updates even when backgrounded
              </span>
            </div>
            <input
              type="checkbox"
              checked={loudChimes}
              onChange={(e) => setLoudChimes(e.target.checked)}
              className="w-5 h-5 rounded accent-orange-600 cursor-pointer"
            />
          </div>

          <button
            onClick={openA11yModal}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Accessibility & Display Settings
                </span>
                <span className="text-[11px] text-slate-500">
                  High contrast colors, text zoom, screen-reader mode
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Switch to Customer App */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-5 space-y-3">
          <h4 className="font-bold text-xs text-slate-800">Switch Experience</h4>
          <p className="text-[11px] text-slate-500">
            Want to see how your food stall appears to nearby customers or test order placement?
          </p>
          <button
            onClick={async () => {
              await loginAsDemoCustomer();
              navigate('/');
            }}
            className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-xs text-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Switch to Customer Mode</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Stall Dashboard</span>
        </button>
      </div>
    </BusinessLayout>
  );
};
