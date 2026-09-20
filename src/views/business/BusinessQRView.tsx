import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { shopService } from '../../services/shopService';
import { Shop } from '../../types';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  Store, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const BusinessQRView: React.FC = () => {
  const { navigate } = useRouter();
  const { currentBusiness, activeShopId } = useAuth();
  const targetShopId = activeShopId || currentBusiness?.id || 'sharma-vada-pav';

  const [shop, setShop] = useState<Shop | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    shopService.getShop(targetShopId).then(setShop);
  }, [targetShopId]);

  const stallUrl = `${window.location.origin}/shops/${targetShopId}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(stallUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <BusinessLayout activeTab="more" title="Counter QR Code Standee">
      <div className="max-w-md mx-auto space-y-6 pb-24 text-center">
        {/* Printable Standee Card */}
        <div 
          id="printable-qr-standee"
          className="bg-white rounded-3xl border-2 border-orange-500/80 p-8 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-black uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              <span>Counter Ordering Standee</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {shop?.name || 'FoodFlow Stall'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {shop?.tagline || 'Scan to view menu, order, and get token'}
            </p>
          </div>

          {/* QR Code Canvas Mock/SVG */}
          <div className="relative mx-auto w-56 h-56 bg-orange-50/50 rounded-3xl border-2 border-slate-900 p-4 flex flex-col items-center justify-center shadow-inner">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(stallUrl)}&margin=10`}
              alt="Stall QR Code"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-black text-slate-900">
              ⚡ Skip The Crowded Line!
            </div>
            <p className="text-xs text-slate-500">
              Scan with phone camera or Google Lens to place order & track your token.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Powered by FoodFlow Counter Token System
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Standee</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Stall Link'}</span>
          </button>
        </div>
      </div>
    </BusinessLayout>
  );
};
