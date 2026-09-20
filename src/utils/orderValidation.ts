import { Order, OrderItem } from '../types';

export interface OrderSubmissionPayload {
  id?: string;
  shopId?: string;
  items: Array<
    OrderItem | {
      id?: string;
      menuItemId?: string;
      name: string;
      price?: number;
      unitPrice?: number;
      quantity: number;
      subtotal?: number;
      isVeg?: boolean;
    }
  >;
  subtotal?: number;
  total?: number;
  totalAmount?: number;
  [key: string]: any;
}

/**
 * Validates an order object before persisting it to Cloud Firestore or local storage.
 * Ensures items are present, prices and quantities are valid, and totals align.
 */
export function assertValidOrderSubmission(order: OrderSubmissionPayload): void {
  if (!order) {
    throw new Error('Order submission failed: Order payload is null or undefined.');
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error('Order submission failed: Order must contain at least one item.');
  }

  let calculatedSubtotal = 0;
  for (const item of order.items) {
    if (!item.name) {
      throw new Error('Order submission failed: Item missing name.');
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new Error(`Order submission failed: Invalid quantity for item "${item.name}".`);
    }
    const price = typeof (item as any).price === 'number' 
      ? (item as any).price 
      : typeof (item as any).unitPrice === 'number' 
        ? (item as any).unitPrice 
        : 0;

    if (price < 0) {
      throw new Error(`Order submission failed: Invalid price for item "${item.name}".`);
    }
    const itemSubtotal = typeof (item as any).subtotal === 'number' 
      ? (item as any).subtotal 
      : price * item.quantity;

    calculatedSubtotal += itemSubtotal;
  }

  const orderTotal = typeof order.total === 'number' 
    ? order.total 
    : typeof order.totalAmount === 'number' 
      ? order.totalAmount 
      : calculatedSubtotal;

  if (typeof orderTotal !== 'number' || orderTotal < 0) {
    throw new Error('Order submission failed: Invalid total amount.');
  }
}
