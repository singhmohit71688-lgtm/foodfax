import React from 'react';
import { useRouter } from '../context/RouterContext';
import { LiveOrderTracker } from '../components/order/LiveOrderTracker';

interface OrderTrackerViewProps {
  orderId: string;
}

export const OrderTrackerView: React.FC<OrderTrackerViewProps> = ({ orderId }) => {
  const { route } = useRouter();
  const effectiveOrderId = orderId || route?.params?.orderId || 'ord-1001';

  return (
    <div className="py-4 px-3 sm:px-6">
      <LiveOrderTracker orderId={effectiveOrderId} />
    </div>
  );
};
