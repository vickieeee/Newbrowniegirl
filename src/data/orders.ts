import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type OrderDeliveryStatus =
  | 'received'
  | 'baking'
  | 'finishing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineStep {
  status: OrderDeliveryStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  notes?: string;
  image?: string;
}

export interface BrownieOrder {
  id: string;
  orderId: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: string;
  status: OrderDeliveryStatus;
  statusMessage: string;
  estimatedDelivery: string;
  deliveryAddress: string;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
  updatedAt: string;
  specialInstructions?: string;
}

export const SAMPLE_ORDERS: BrownieOrder[] = [];


const ORDER_STORAGE_KEY = 'browinegirl_local_orders';

/**
 * Build a 5-step delivery timeline based on the current order status
 */
export function buildOrderTimeline(order: BrownieOrder): OrderTimelineStep[] {
  const stepsMeta: { status: OrderDeliveryStatus; title: string; description: string }[] = [
    {
      status: 'received',
      title: 'Order Confirmed',
      description: 'Kitchen received order & ingredients prepared.',
    },
    {
      status: 'baking',
      title: 'Deck Oven Baking',
      description: 'Slow-baking in small batches for ultra-fudgy center.',
    },
    {
      status: 'finishing',
      title: 'Artisan Glazing & Boxed',
      description: 'Handcrafted chocolate finishes & sealed in insulated box.',
    },
    {
      status: 'out_for_delivery',
      title: 'Out for Courier Delivery',
      description: 'Courier en route with thermal bakery dispatch.',
    },
    {
      status: 'delivered',
      title: 'Warm Delivery Completed',
      description: 'Delivered fresh to your doorstep. Bon Appétit!',
    },
  ];

  const statusOrder: OrderDeliveryStatus[] = [
    'received',
    'baking',
    'finishing',
    'out_for_delivery',
    'delivered',
  ];

  const currentIndex = statusOrder.indexOf(order.status);

  return stepsMeta.map((s, idx) => {
    const isCompleted = currentIndex >= idx;
    const isCurrent = currentIndex === idx;

    let timeLabel = '';
    if (idx === 0) timeLabel = 'Received';
    else if (idx === currentIndex) timeLabel = 'In Progress';
    else if (idx < currentIndex) timeLabel = 'Completed';
    else timeLabel = 'Upcoming';

    return {
      status: s.status,
      title: s.title,
      description: s.description,
      timestamp: timeLabel,
      completed: isCompleted,
      current: isCurrent,
    };
  });
}

/**
 * Fetch an order by its ID from Firestore, with graceful local fallback & automatic seeding
 */
export async function fetchOrderById(rawId: string): Promise<BrownieOrder | null> {
  const cleanId = rawId.trim().toUpperCase();
  if (!cleanId) return null;

  // 1. Try Firestore
  try {
    const docRef = doc(db, 'orders', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as BrownieOrder;
    }
  } catch (err) {
    console.warn('Firestore order lookup warning, checking fallback:', err);
  }

  // 2. Try LocalStorage
  try {
    const cached = localStorage.getItem(ORDER_STORAGE_KEY);
    if (cached) {
      const orders = JSON.parse(cached) as BrownieOrder[];
      const found = orders.find(
        (o) => o.orderId.toUpperCase() === cleanId || o.id.toUpperCase() === cleanId
      );
      if (found) return found;
    }
  } catch (err) {
    console.warn('LocalStorage order lookup error:', err);
  }

  // 3. Fallback to sample orders
  const sample = SAMPLE_ORDERS.find(
    (o) => o.orderId.toUpperCase() === cleanId || o.id.toUpperCase() === cleanId
  );

  if (sample) {
    // Optionally seed it into Firestore so future lookups find it there
    try {
      await setDoc(doc(db, 'orders', sample.id), sample, { merge: true });
    } catch {
      // Ignored if permissions are restricted
    }
    return sample;
  }

  return null;
}

/**
 * Get all available demo / recent orders for instant user discovery
 */
export function getDemoOrders(): BrownieOrder[] {
  try {
    const cached = localStorage.getItem(ORDER_STORAGE_KEY);
    if (cached) {
      const customOrders = JSON.parse(cached) as BrownieOrder[];
      if (Array.isArray(customOrders) && customOrders.length > 0) {
        return customOrders;
      }
    }
  } catch {}
  return [];
}
