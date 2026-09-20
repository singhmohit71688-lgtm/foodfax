import React, { useState } from 'react';
import { BusinessLayout } from '../../components/business/BusinessLayout';
import { notificationService } from '../../services/notificationService';
import { 
  Bell, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  VolumeX, 
  Sparkles 
} from 'lucide-react';

export const BusinessNotificationsView: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'New Token Placed #104',
      message: 'Rohan Sharma placed an order for 2x Vada Pav & 1x Cutting Chai.',
      time: 'Just now',
      type: 'order',
    },
    {
      id: 'n2',
      title: 'Token #102 Customer Picked Up',
      message: 'Token #102 marked as completed and handed over.',
      time: '12 mins ago',
      type: 'completed',
    },
    {
      id: 'n3',
      title: 'Peak Rush Alert',
      message: 'Active counter queue reached 5 orders. Consider switching to Rush Mode.',
      time: '28 mins ago',
      type: 'alert',
    },
  ]);

  const handleTestChime = () => {
    notificationService.playReadyChime();
  };

  const handleClear = () => {
    setNotifications([]);
  };

  return (
    <BusinessLayout activeTab="more" title="Notifications & Sound Alerts">
      <div className="max-w-xl mx-auto space-y-6 pb-24">
        {/* Audio Alerts Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Audio Token Chimes</h4>
              <p className="text-[11px] text-slate-500">
                Play loud chime when new order arrives or token is ready
              </p>
            </div>
          </div>

          <button
            onClick={handleTestChime}
            className="px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Chime</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Recent Stall Alerts ({notifications.length})
            </h4>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((item) => (
                <div key={item.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              No notifications at the moment.
            </div>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
};
