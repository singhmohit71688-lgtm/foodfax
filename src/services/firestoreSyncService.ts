import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Order, 
  OrderItem, 
  Shop, 
  MenuItem, 
  ShopCategory, 
  DatabaseUser, 
  OrderStatusHistory, 
  PaymentRecord, 
  FavoriteShopRecord, 
  TokenCounterRecord,
  OrderStatus,
  PaymentStatus
} from '../types';
import { MOCK_SHOPS, MOCK_MENU_ITEMS, MOCK_CATEGORIES, INITIAL_ORDERS } from '../data/mockData';
import { assertValidOrderSubmission } from '../utils/orderValidation';

type SyncListener = (isSyncing: boolean) => void;

export const MOCK_SHOP_IDS = new Set<string>([
  'sharma-vada-pav',
  'college-canteen',
  'mumbai-snacks-corner',
  'tapri-tea-house',
  'sandwich-station',
  'fresh-juice-point',
  'punjabi-kulcha-point',
  'pune-vada-pav',
  'delhi-chaat-hub',
  'ahmedabad-farsan-stall',
  'bengaluru-filter-coffee',
]);

export function normalizeShopDoc(data: any): Shop {
  const shopId = data.id || 'shop-registered';
  let rawName = (data.name || data.shopName || data.businessName || '').trim();
  const lowerAll = JSON.stringify(data).toLowerCase();

  const isDeepak =
    shopId === 'shop-411159' ||
    lowerAll.includes('deepak') ||
    lowerAll.includes('chainees') ||
    lowerAll.includes('chinese') ||
    data.contactPhone === '+91 9321444296' ||
    data.phone === '+91 9321444296';

  let name = rawName;
  if (!name || isDeepak) {
    if (isDeepak) {
      name = 'Deepak Chinese Corner';
    } else if (data.description) {
      name = data.description.split('.')[0].trim();
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } else {
      name = 'Registered Food Stall';
    }
  }

  const desc = data.description || data.tagline || (isDeepak ? 'Special Veg Hakka Noodles, Manchurian & Schezwan fast food counter' : 'Fresh street food made to order');
  const area = data.area || (isDeepak ? 'Naigaon East' : 'Andheri West');
  const city = data.city || 'Mumbai Suburban';
  const address = data.address || data.location?.address || (isDeepak ? 'Shop No. 4, Station Road, Naigaon East, Mumbai' : 'Street Counter');
  
  // Coordinates (Naigaon East if Deepak Chinese Corner / shop-411159, or default Mumbai coords)
  let lat = Number(data.latitude || data.location?.latitude || (isDeepak ? 19.3515 : 19.1197));
  let lng = Number(data.longitude || data.location?.longitude || (isDeepak ? 72.8525 : 72.8464));

  if (!lat || isNaN(lat)) lat = isDeepak ? 19.3515 : 19.1197;
  if (!lng || isNaN(lng)) lng = isDeepak ? 72.8525 : 72.8464;

  const image =
    data.image ||
    data.bannerImage ||
    (isDeepak
      ? 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80');

  return {
    ...data,
    id: shopId,
    slug: data.slug || (isDeepak ? 'deepak-chinese-corner' : shopId),
    name,
    stallType: data.stallType || 'Thela / Food Stall',
    tagline: data.tagline || (isDeepak ? 'Authentic Wok Noodles, Crispy Manchurian & Schezwan' : desc),
    description: desc,
    image,
    bannerImage: data.bannerImage || image,
    latitude: lat,
    longitude: lng,
    contactPhone: data.contactPhone || data.phone || '+91 9321444296',
    address,
    area,
    city,
    location: {
      address,
      landmark: data.location?.landmark || `${area}, ${city}`,
      distanceKm: data.location?.distanceKm ?? 0.5,
      latitude: lat,
      longitude: lng,
    },
    isOpen: data.isOpen !== false,
    openingTime: data.openingTime || '11:00 AM',
    closingTime: data.closingTime || '11:00 PM',
    openingHours: data.openingHours || `${data.openingTime || '11:00 AM'} – ${data.closingTime || '11:00 PM'}`,
    rating: data.rating ?? 4.9,
    totalReviews: data.totalReviews ?? 18,
    categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : ['fast-food', 'snacks'],
    preparationTimeMinutes: data.preparationTimeMinutes || '5–10',
    isPureVeg: data.isPureVeg ?? true,
    tableServiceAvailable: Boolean(data.tableServiceAvailable),
    featuredItem: data.featuredItem || (isDeepak ? 'Special Veg Hakka Noodles' : `${name} Signature`),
    isDemo: false,
  };
}

class FirestoreSyncService {
  private isInitialized = false;
  private activeSyncCount = 0;
  private syncListeners = new Set<SyncListener>();

  // --- SYNC / LOADING NOTIFIER ---

  public subscribeSyncState(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.activeSyncCount > 0);
    return () => this.syncListeners.delete(listener);
  }

  private startSync() {
    this.activeSyncCount++;
    this.notifySync(true);
  }

  private endSync() {
    this.activeSyncCount = Math.max(0, this.activeSyncCount - 1);
    if (this.activeSyncCount === 0) {
      this.notifySync(false);
    }
  }

  private notifySync(isSyncing: boolean) {
    this.syncListeners.forEach((fn) => fn(isSyncing));
  }

  // --- INITIAL DATABASE SEEDING ---

  public async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.startSync();

    try {
      // Initialize categories if empty
      const catCol = collection(db, 'categories');
      const catSnap = await getDocs(catCol);
      if (catSnap.empty) {
        for (const cat of MOCK_CATEGORIES) {
          await setDoc(doc(db, 'categories', cat.id), cat);
        }
      }
      // Note: We deliberately do NOT seed mock shops or mock orders into Firestore.
      // Firestore stores real shops registered by real owners (like shop-411159)
      // and real orders placed by real customers.
    } catch (err) {
      console.warn('[Firestore] Initialization skipped/offline:', err);
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 1. USERS CRUD
  // ============================================================

  public async createUser(user: DatabaseUser): Promise<void> {
    this.startSync();
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error creating user:', err);
    } finally {
      this.endSync();
    }
  }

  public async getUser(userId: string): Promise<DatabaseUser | null> {
    this.startSync();
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? (snap.data() as DatabaseUser) : null;
    } catch (err) {
      console.warn('[Firestore] Error getting user:', err);
      return null;
    } finally {
      this.endSync();
    }
  }

  public async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<void> {
    this.startSync();
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Firestore] Error updating user:', err);
    } finally {
      this.endSync();
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    // Soft delete as per schema (isActive = false)
    await this.updateUser(userId, { isActive: false });
  }

  // ============================================================
  // 2. SHOPS CRUD
  // ============================================================

  public async createShop(shop: Shop): Promise<void> {
    this.startSync();
    try {
      await setDoc(doc(db, 'shops', shop.id), shop, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error creating shop:', err);
    } finally {
      this.endSync();
    }
  }

  public async saveShop(shop: Shop): Promise<void> {
    return this.createShop(shop);
  }

  public async getShop(shopId: string): Promise<Shop | null> {
    this.startSync();
    try {
      const snap = await getDoc(doc(db, 'shops', shopId));
      if (snap.exists()) {
        return normalizeShopDoc({ ...snap.data(), id: snap.id });
      }
      return null;
    } catch (err) {
      console.warn('[Firestore] Error getting shop:', err);
      return null;
    } finally {
      this.endSync();
    }
  }

  public async getShops(isRealUser?: boolean): Promise<Shop[]> {
    this.startSync();
    try {
      const rawShopsMap = new Map<string, Shop>();

      // 1. Fetch from 'shops' collection
      try {
        const snap = await getDocs(collection(db, 'shops'));
        if (!snap.empty) {
          snap.docs.forEach((d) => {
            const normalized = normalizeShopDoc({ ...d.data(), id: d.id });
            rawShopsMap.set(normalized.id, normalized);
          });
        }
      } catch (err) {
        console.warn('[Firestore] Error fetching shops collection:', err);
      }

      // 2. Direct fetch for known registered stall shop-411159 (Deepak Chinese Corner)
      try {
        const deepakDocSnap = await getDoc(doc(db, 'shops', 'shop-411159'));
        if (deepakDocSnap.exists()) {
          const normalized = normalizeShopDoc({ ...deepakDocSnap.data(), id: 'shop-411159' });
          rawShopsMap.set('shop-411159', normalized);
        }
      } catch (err) {
        console.warn('[Firestore] Note checking specific shop-411159 doc:', err);
      }

      // 3. Check 'users' collection for registered shop owners
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          usersSnap.docs.forEach((d) => {
            const u = d.data();
            const lowerUser = JSON.stringify(u).toLowerCase();
            const isOwner =
              u.role === 'owner' ||
              Boolean(u.shopName) ||
              Boolean(u.stallType) ||
              lowerUser.includes('deepak') ||
              lowerUser.includes('chainees') ||
              lowerUser.includes('chinese');

            if (isOwner) {
              const shopId =
                u.shopId ||
                (d.id.startsWith('shop-') ? d.id : `shop-${d.id.replace(/\D/g, '').slice(-6) || '411159'}`);

              const existing = rawShopsMap.get(shopId);
              if (!existing) {
                const synthesized = normalizeShopDoc({
                  ...u,
                  id: shopId,
                  ownerId: d.id,
                  name:
                    u.shopName ||
                    (lowerUser.includes('deepak') ? 'Deepak Chinese Corner' : `${u.fullName || 'Stall'}'s Counter`),
                  contactPhone: u.phone,
                  address: u.shopAddress || u.address || 'Shop No. 4, Station Road, Naigaon East',
                  area: u.area || 'Naigaon East',
                  city: u.city || 'Mumbai Suburban',
                  latitude: u.latitude || 19.3515,
                  longitude: u.longitude || 72.8525,
                  stallType: u.stallType || 'Thela / Food Stall',
                  isDemo: false,
                });
                rawShopsMap.set(shopId, synthesized);
              }
            }
          });
        }
      } catch (userErr) {
        console.warn('[Firestore] Note checking users for registered owners:', userErr);
      }

      const allShops = Array.from(rawShopsMap.values());

      if (isRealUser) {
        // Exclude all mock shops! Return only real registered shops from the database
        return allShops.filter((s) => !s.isDemo && !MOCK_SHOP_IDS.has(s.id));
      }

      return allShops.length > 0 ? allShops : MOCK_SHOPS;
    } catch (err) {
      console.warn('[Firestore] Error getting shops, using fallback:', err);
      return isRealUser ? [] : MOCK_SHOPS;
    } finally {
      this.endSync();
    }
  }

  public async updateShop(shopId: string, updates: Partial<Shop>): Promise<void> {
    this.startSync();
    try {
      await updateDoc(doc(db, 'shops', shopId), updates);
    } catch (err) {
      console.warn('[Firestore] Error updating shop in Firestore:', err);
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 3. CATEGORIES CRUD
  // ============================================================

  public async createCategory(cat: ShopCategory & { shopId?: string; displayOrder?: number; isActive?: boolean }): Promise<void> {
    this.startSync();
    try {
      await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error creating category:', err);
    } finally {
      this.endSync();
    }
  }

  public async getCategoriesByShop(shopId?: string): Promise<ShopCategory[]> {
    this.startSync();
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (snap.empty) return MOCK_CATEGORIES;
      const all = snap.docs.map((d) => d.data() as ShopCategory);
      return all;
    } catch (err) {
      console.warn('[Firestore] Error getting categories:', err);
      return MOCK_CATEGORIES;
    } finally {
      this.endSync();
    }
  }

  public async updateCategory(categoryId: string, updates: Partial<ShopCategory>): Promise<void> {
    this.startSync();
    try {
      await updateDoc(doc(db, 'categories', categoryId), updates);
    } catch (err) {
      console.warn('[Firestore] Error updating category:', err);
    } finally {
      this.endSync();
    }
  }

  public async deleteCategory(categoryId: string): Promise<void> {
    this.startSync();
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (err) {
      console.warn('[Firestore] Error deleting category:', err);
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 4. MENU ITEMS CRUD
  // ============================================================

  public async createMenuItem(item: MenuItem): Promise<void> {
    this.startSync();
    try {
      await setDoc(doc(db, 'menu_items', item.id), item, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error creating menu item:', err);
    } finally {
      this.endSync();
    }
  }

  public async getMenuItemsByShop(shopId: string): Promise<MenuItem[]> {
    this.startSync();
    try {
      const q = query(collection(db, 'menu_items'), where('shopId', '==', shopId));
      const snap = await getDocs(q);
      if (snap.empty) {
        return MOCK_MENU_ITEMS.filter((i) => i.shopId === shopId);
      }
      return snap.docs.map((d) => d.data() as MenuItem);
    } catch (err) {
      console.warn('[Firestore] Error fetching menu items, using fallback:', err);
      return MOCK_MENU_ITEMS.filter((i) => i.shopId === shopId);
    } finally {
      this.endSync();
    }
  }

  public async updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<void> {
    this.startSync();
    try {
      await updateDoc(doc(db, 'menu_items', itemId), updates);
    } catch (err) {
      console.warn('[Firestore] Error updating menu item in Firestore:', err);
    } finally {
      this.endSync();
    }
  }

  public async deleteMenuItem(itemId: string): Promise<void> {
    this.startSync();
    try {
      // Soft-delete by default
      await updateDoc(doc(db, 'menu_items', itemId), { isAvailable: false });
    } catch (err) {
      console.warn('[Firestore] Error deleting menu item:', err);
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 5. ORDERS CRUD (With Strict Validation & Token Generator)
  // ============================================================

  /**
   * Saves or creates an order in Cloud Firestore.
   * Runs validation to verify total_amount matches sum(items.subtotal).
   */
  public async saveOrder(order: Order): Promise<void> {
    // 1. Validation check
    assertValidOrderSubmission(order);

    this.startSync();
    try {
      // 2. Persist order header
      await setDoc(doc(db, 'orders', order.id), order, { merge: true });

      // 3. Persist order items snapshot into order_items collection
      if (order.items && order.items.length > 0) {
        await this.createOrderItems(order.id, order.items);
      }

      // 4. Record initial status history
      await this.recordOrderStatusHistory({
        id: `history-${order.id}-${Date.now()}`,
        orderId: order.id,
        oldStatus: null,
        newStatus: order.orderStatus,
        note: `Order ${order.tokenNumber} submitted (${order.orderType})`,
        createdAt: order.createdAt
      });

      // 5. Persist initial payment record
      await this.createPayment({
        id: `payment-${order.id}`,
        orderId: order.id,
        paymentMode: order.paymentMethod === 'PAY_ONLINE' ? 'upi' : 'cash',
        paymentStatus: order.paymentStatus,
        amount: order.total,
        createdAt: order.createdAt,
        updatedAt: order.createdAt
      });
    } catch (err) {
      console.warn('[Firestore] Error saving order to Firestore:', err);
      throw err;
    } finally {
      this.endSync();
    }
  }

  public async getOrder(orderId: string): Promise<Order | null> {
    this.startSync();
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      return snap.exists() ? (snap.data() as Order) : null;
    } catch (err) {
      console.warn('[Firestore] Error getting order:', err);
      return null;
    } finally {
      this.endSync();
    }
  }

  public async getOrdersByShop(shopId: string): Promise<Order[]> {
    this.startSync();
    try {
      const q = query(collection(db, 'orders'), where('shopId', '==', shopId));
      const snap = await getDocs(q);
      const orders = snap.docs.map((d) => d.data() as Order);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return orders;
    } catch (err) {
      console.warn('[Firestore] Error getting shop orders:', err);
      return [];
    } finally {
      this.endSync();
    }
  }

  public async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    this.startSync();
    try {
      const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      const orders = snap.docs.map((d) => d.data() as Order);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return orders;
    } catch (err) {
      console.warn('[Firestore] Error getting customer orders:', err);
      return [];
    } finally {
      this.endSync();
    }
  }

  public async updateOrderStatus(
    orderId: string, 
    status: Order['orderStatus'], 
    extra: Partial<Order> = {},
    changedBy?: string,
    note?: string
  ): Promise<void> {
    this.startSync();
    try {
      const orderRef = doc(db, 'orders', orderId);
      const existing = await getDoc(orderRef);
      const oldStatus = existing.exists() ? (existing.data() as Order).orderStatus : null;

      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: new Date().toISOString(),
        ...extra
      });

      // Automatically append to chronological order_status_history
      await this.recordOrderStatusHistory({
        id: `history-${orderId}-${Date.now()}`,
        orderId,
        oldStatus,
        newStatus: status,
        changedBy,
        note: note || `Status changed to ${status}`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Firestore] Error updating order status in Firestore:', err);
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 6. ORDER ITEMS SNAPSHOT CRUD
  // ============================================================

  public async createOrderItems(orderId: string, items: OrderItem[]): Promise<void> {
    this.startSync();
    try {
      for (const item of items) {
        const itemDocId = `${orderId}_${item.id || item.menuItemId}`;
        const itemRecord = {
          id: itemDocId,
          orderId,
          itemId: item.menuItemId,
          itemName: item.name,
          itemPrice: item.price,
          quantity: item.quantity,
          subtotal: Math.round(item.price * item.quantity * 100) / 100,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'order_items', itemDocId), itemRecord);
      }
    } catch (err) {
      console.warn('[Firestore] Error creating order items snapshot:', err);
    } finally {
      this.endSync();
    }
  }

  public async getOrderItemsByOrder(orderId: string): Promise<any[]> {
    this.startSync();
    try {
      const q = query(collection(db, 'order_items'), where('orderId', '==', orderId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      console.warn('[Firestore] Error getting order items:', err);
      return [];
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 7. PAYMENTS CRUD
  // ============================================================

  public async createPayment(payment: PaymentRecord): Promise<void> {
    this.startSync();
    try {
      await setDoc(doc(db, 'payments', payment.id), payment, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error creating payment:', err);
    } finally {
      this.endSync();
    }
  }

  public async getPaymentByOrder(orderId: string): Promise<PaymentRecord | null> {
    this.startSync();
    try {
      const q = query(collection(db, 'payments'), where('orderId', '==', orderId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as PaymentRecord;
    } catch (err) {
      console.warn('[Firestore] Error fetching payment:', err);
      return null;
    } finally {
      this.endSync();
    }
  }

  public async updatePaymentStatus(paymentId: string, status: PaymentStatus, transactionId?: string): Promise<void> {
    this.startSync();
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        paymentStatus: status,
        transactionId: transactionId || null,
        paidAt: status === 'PAID' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Firestore] Error updating payment status:', err);
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 8. ORDER STATUS HISTORY CRUD
  // ============================================================

  public async recordOrderStatusHistory(record: OrderStatusHistory): Promise<void> {
    try {
      await setDoc(doc(db, 'order_status_history', record.id), record);
    } catch (err) {
      console.warn('[Firestore] Error writing order status history:', err);
    }
  }

  public async getStatusHistoryByOrder(orderId: string): Promise<OrderStatusHistory[]> {
    this.startSync();
    try {
      const q = query(collection(db, 'order_status_history'), where('orderId', '==', orderId));
      const snap = await getDocs(q);
      const history = snap.docs.map((d) => d.data() as OrderStatusHistory);
      history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return history;
    } catch (err) {
      console.warn('[Firestore] Error fetching status history:', err);
      return [];
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 9. FAVORITE SHOPS CRUD
  // ============================================================

  public async addFavoriteShop(userId: string, shopId: string): Promise<void> {
    this.startSync();
    try {
      const favId = `${userId}_${shopId}`;
      await setDoc(doc(db, 'favorite_shops', favId), {
        userId,
        shopId,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Firestore] Error adding favorite shop:', err);
    } finally {
      this.endSync();
    }
  }

  public async removeFavoriteShop(userId: string, shopId: string): Promise<void> {
    this.startSync();
    try {
      const favId = `${userId}_${shopId}`;
      await deleteDoc(doc(db, 'favorite_shops', favId));
    } catch (err) {
      console.warn('[Firestore] Error removing favorite shop:', err);
    } finally {
      this.endSync();
    }
  }

  public async getFavoriteShopsByUser(userId: string): Promise<string[]> {
    this.startSync();
    try {
      const q = query(collection(db, 'favorite_shops'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => (d.data() as FavoriteShopRecord).shopId);
    } catch (err) {
      console.warn('[Firestore] Error getting favorite shops:', err);
      return [];
    } finally {
      this.endSync();
    }
  }

  // ============================================================
  // 10. TRANSACTIONAL DAILY ORDER TOKEN GENERATOR
  // (Section 19: shop_id + token_date -> atomic sequential counter)
  // ============================================================

  public async generateOrderToken(shopId: string, tokenDate?: string): Promise<number> {
    const today = tokenDate || new Date().toISOString().split('T')[0];
    const counterDocId = `${shopId}_${today}`;
    const counterRef = doc(db, 'shop_token_counters', counterDocId);

    try {
      const nextToken = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let tokenNumber = 101;

        if (!counterDoc.exists()) {
          transaction.set(counterRef, {
            shopId,
            tokenDate: today,
            lastToken: 101,
          });
          tokenNumber = 101;
        } else {
          const currentToken = counterDoc.data().lastToken || 100;
          tokenNumber = currentToken + 1;
          transaction.update(counterRef, {
            lastToken: tokenNumber,
          });
        }

        return tokenNumber;
      });

      return nextToken;
    } catch (err) {
      console.warn('[Firestore] Transactional token generator fallback:', err);
      // Fallback: LocalStorage daily counter
      const localKey = `foodflow_token_${counterDocId}`;
      const prev = parseInt(localStorage.getItem(localKey) || '100', 10);
      const next = prev + 1;
      localStorage.setItem(localKey, String(next));
      return next;
    }
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  public subscribeToShopOrders(
    shopId: string, 
    onUpdate: (orders: Order[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, 'orders'),
        where('shopId', '==', shopId)
      );

      return onSnapshot(
        q, 
        (snapshot) => {
          if (!snapshot.empty) {
            const orders = snapshot.docs.map((d) => d.data() as Order);
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            onUpdate(orders);
          }
        },
        (error) => {
          console.warn('[Firestore] Realtime shop orders subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Failed to attach subscription:', err);
      return () => {};
    }
  }

  public subscribeToSingleOrder(
    orderId: string, 
    onUpdate: (order: Order) => void
  ): () => void {
    try {
      const docRef = doc(db, 'orders', orderId);
      return onSnapshot(
        docRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            onUpdate(docSnap.data() as Order);
          }
        },
        (error) => {
          console.warn('[Firestore] Realtime single order subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Failed to attach single order subscription:', err);
      return () => {};
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
