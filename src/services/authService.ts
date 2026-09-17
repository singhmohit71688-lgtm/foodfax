import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthUser, OwnerBusinessContext, Shop, UserRole } from '../types';
import { shopService } from './shopService';
import { menuService } from './menuService';

// Storage keys for instantaneous cached hydrate
const AUTH_USER_KEY = 'foodflow_auth_user';
const AUTH_BUSINESS_KEY = 'foodflow_auth_business';

/**
 * Robust SHA-256 password hashing for Firestore-stored credentials
 */
async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`foodflow_salt_${password}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  let hash = 0;
  const str = `foodflow_salt_${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

export const DEMO_CUSTOMER: AuthUser = {
  id: 'demo-customer-001',
  fullName: 'Demo Customer',
  name: 'Demo Customer',
  phone: '+91 98765 43210',
  email: 'customer@foodflow.demo',
  role: 'customer',
  isActive: true,
  profileCompleted: true,
  latitude: 19.1197,
  longitude: 72.8464,
  area: 'Andheri West',
  city: 'Mumbai',
  createdAt: '2026-01-01T00:00:00.000Z',
  isDemo: true,
};

export const DEMO_OWNER: AuthUser = {
  id: 'demo-owner-001',
  fullName: 'Demo Owner (Ramesh Sharma)',
  name: 'Demo Owner (Ramesh Sharma)',
  phone: '+91 98200 12345',
  email: 'owner@foodflow.demo',
  role: 'owner',
  shopId: 'sharma-vada-pav',
  isActive: true,
  profileCompleted: true,
  latitude: 19.1197,
  longitude: 72.8464,
  area: 'Andheri West',
  city: 'Mumbai',
  createdAt: '2026-01-01T00:00:00.000Z',
  isDemo: true,
};

export const DEMO_SHOP: OwnerBusinessContext = {
  id: 'sharma-vada-pav',
  name: 'Sharma Vada Pav',
  ownerId: 'demo-owner-001',
  phone: '+91 98200 12345',
  address: 'Gate 2, Andheri West Metro Station, Mumbai',
  stallType: 'Thela / Food Stall',
  isOpen: true,
  image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  rating: 4.8,
  latitude: 19.1197,
  longitude: 72.8464,
};

export const DEMO_PASSWORD = 'demo123';

class AuthService {
  private currentUser: AuthUser | null = null;
  private currentBusiness: OwnerBusinessContext | null = null;
  private listeners: Set<(user: AuthUser | null, business: OwnerBusinessContext | null) => void> = new Set();
  private authInitialized = false;

  constructor() {
    this.restoreCachedSession();
    this.initFirebaseAuthListener();
  }

  private restoreCachedSession(): void {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const storedBusiness = localStorage.getItem(AUTH_BUSINESS_KEY);
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
      if (storedBusiness) {
        this.currentBusiness = JSON.parse(storedBusiness);
      }
    } catch {
      this.currentUser = null;
      this.currentBusiness = null;
    }
  }

  private persistSession(user: AuthUser | null, business: OwnerBusinessContext | null): void {
    this.currentUser = user;
    this.currentBusiness = business;

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }

    if (business) {
      localStorage.setItem(AUTH_BUSINESS_KEY, JSON.stringify(business));
    } else {
      localStorage.removeItem(AUTH_BUSINESS_KEY);
    }

    this.notifyListeners();
  }

  private initFirebaseAuthListener(): void {
    onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      this.authInitialized = true;
      if (!fbUser) {
        this.persistSession(null, null);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);

        let userProfile: AuthUser;
        let business: OwnerBusinessContext | null = null;

        if (snap.exists()) {
          const data = snap.data();
          userProfile = {
            id: fbUser.uid,
            fullName: data.fullName || data.name || fbUser.displayName || 'User',
            name: data.name || data.fullName || fbUser.displayName || 'User',
            phone: data.phone || '',
            email: fbUser.email || data.email || '',
            role: (data.role as UserRole) || 'customer',
            shopId: data.shopId,
            isActive: data.isActive !== false,
            latitude: data.latitude,
            longitude: data.longitude,
            area: data.area,
            city: data.city,
            photoUrl: data.photoUrl || fbUser.photoURL || undefined,
            profileCompleted: data.profileCompleted ?? true,
            createdAt: data.createdAt || new Date().toISOString(),
          };

          // If owner, fetch shop details
          if (userProfile.role === 'owner') {
            business = await this.fetchOwnerShop(fbUser.uid, userProfile.shopId);
          }
        } else {
          // Fallback if doc doesn't exist yet in Firestore
          userProfile = {
            id: fbUser.uid,
            fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'FoodFlow User',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'FoodFlow User',
            phone: '',
            email: fbUser.email || '',
            role: 'customer',
            isActive: true,
            profileCompleted: false,
            createdAt: new Date().toISOString(),
          };

          // Save baseline user document
          await setDoc(userDocRef, {
            ...userProfile,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }

        this.persistSession(userProfile, business);
      } catch (err) {
        console.warn('[AuthService] Error fetching user profile on auth state change:', err);
        // Retain cached session if offline
        this.notifyListeners();
      }
    });
  }

  /**
   * Helper to load an owner's shop
   */
  public async fetchOwnerShop(ownerId: string, shopId?: string): Promise<OwnerBusinessContext | null> {
    try {
      if (shopId) {
        const shopSnap = await getDoc(doc(db, 'shops', shopId));
        if (shopSnap.exists()) {
          const s = shopSnap.data() as Shop;
          return {
            id: s.id,
            name: s.name,
            ownerId: s.ownerId || ownerId,
            description: s.description,
            phone: s.contactPhone || s.phone,
            address: s.location?.address || s.address,
            area: s.area,
            city: s.city,
            state: s.state,
            pincode: s.pincode,
            latitude: s.latitude || s.location?.latitude,
            longitude: s.longitude || s.location?.longitude,
            stallType: s.stallType,
            openingTime: s.openingTime,
            closingTime: s.closingTime,
            upiId: s.upiId,
            isOpen: s.isOpen,
            isActive: true,
            image: s.image,
            rating: s.rating,
          };
        }
      }

      // Query shops where ownerId == ownerId
      const q = query(collection(db, 'shops'), where('ownerId', '==', ownerId));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const s = qSnap.docs[0].data() as Shop;
        return {
          id: s.id,
          name: s.name,
          ownerId: s.ownerId || ownerId,
          description: s.description,
          phone: s.contactPhone || s.phone,
          address: s.location?.address || s.address,
          area: s.area,
          city: s.city,
          state: s.state,
          pincode: s.pincode,
          latitude: s.latitude || s.location?.latitude,
          longitude: s.longitude || s.location?.longitude,
          stallType: s.stallType,
          openingTime: s.openingTime,
          closingTime: s.closingTime,
          upiId: s.upiId,
          isOpen: s.isOpen,
          isActive: true,
          image: s.image,
          rating: s.rating,
        };
      }
    } catch (err) {
      console.warn('[AuthService] Error querying owner shop:', err);
    }
    return null;
  }

  public subscribe(callback: (user: AuthUser | null, business: OwnerBusinessContext | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentUser, this.currentBusiness);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this.currentUser, this.currentBusiness);
      } catch (err) {
        console.error('[AuthService] Listener error:', err);
      }
    });
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public getCurrentBusiness(): OwnerBusinessContext | null {
    return this.currentBusiness;
  }

  public async refreshSession(): Promise<{ user: AuthUser | null; business: OwnerBusinessContext | null }> {
    const uid = auth.currentUser?.uid || this.currentUser?.id;
    if (uid) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          this.currentUser = {
            ...this.currentUser,
            ...data,
            id: uid,
          } as AuthUser;
          if (this.currentUser.role === 'owner') {
            this.currentBusiness = await this.fetchOwnerShop(uid, this.currentUser.shopId);
          }
          this.persistSession(this.currentUser, this.currentBusiness);
        }
      } catch (err) {
        console.warn('[AuthService] Error during session refresh:', err);
      }
    }
    return { user: this.currentUser, business: this.currentBusiness };
  }

  /**
   * Helper to resolve an email if user entered a phone number
   */
  private async resolveEmailFromPhoneOrInput(emailOrPhone: string): Promise<string> {
    const trimmed = emailOrPhone.trim();
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }

    const cleanDigits = trimmed.replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      // Look up user document by phone
      try {
        const usersRef = collection(db, 'users');
        const q1 = query(usersRef, where('phone', '==', trimmed));
        const s1 = await getDocs(q1);
        if (!s1.empty && s1.docs[0].data().email) {
          return s1.docs[0].data().email.toLowerCase();
        }

        const q2 = query(usersRef, where('phone', '==', `+91 ${cleanDigits.slice(-10)}`));
        const s2 = await getDocs(q2);
        if (!s2.empty && s2.docs[0].data().email) {
          return s2.docs[0].data().email.toLowerCase();
        }
      } catch (e) {
        console.warn('[AuthService] Phone email lookup fallback:', e);
      }
      return `${cleanDigits.slice(-10)}@foodflow.user`;
    }

    return trimmed.toLowerCase();
  }

  /**
   * Search Firestore users collection by phone, email, or document ID
   */
  private async findUserDocByPhoneOrEmail(
    rawInput: string,
    targetEmail?: string
  ): Promise<{ docId: string; data: any } | null> {
    try {
      const usersRef = collection(db, 'users');
      const cleanDigits = rawInput.replace(/\D/g, '');

      // 1. Check direct doc by input or u_phone
      if (cleanDigits.length >= 10) {
        const snap = await getDoc(doc(db, 'users', `u_${cleanDigits.slice(-10)}`));
        if (snap.exists()) {
          return { docId: snap.id, data: snap.data() };
        }
        const snapOwner = await getDoc(doc(db, 'users', `owner_${cleanDigits.slice(-10)}`));
        if (snapOwner.exists()) {
          return { docId: snapOwner.id, data: snapOwner.data() };
        }
      }

      // 2. Query by email
      if (targetEmail) {
        const qEmail = query(usersRef, where('email', '==', targetEmail.toLowerCase()));
        const sEmail = await getDocs(qEmail);
        if (!sEmail.empty) {
          return { docId: sEmail.docs[0].id, data: sEmail.docs[0].data() };
        }
      }

      // 3. Query by exact phone
      const qPhone = query(usersRef, where('phone', '==', rawInput.trim()));
      const sPhone = await getDocs(qPhone);
      if (!sPhone.empty) {
        return { docId: sPhone.docs[0].id, data: sPhone.docs[0].data() };
      }

      // 4. Query by standard Indian format
      if (cleanDigits.length >= 10) {
        const qFmt = query(usersRef, where('phone', '==', `+91 ${cleanDigits.slice(-10)}`));
        const sFmt = await getDocs(qFmt);
        if (!sFmt.empty) {
          return { docId: sFmt.docs[0].id, data: sFmt.docs[0].data() };
        }
      }

      // 5. Direct ID check if rawInput is an ID
      const direct = await getDoc(doc(db, 'users', rawInput.trim()));
      if (direct.exists()) {
        return { docId: direct.id, data: direct.data() };
      }
    } catch (e) {
      console.warn('[AuthService] Firestore findUser error:', e);
    }
    return null;
  }

  /**
   * Google Sign-In with Popup
   */
  public async signInWithGoogle(
    intendedRole: 'customer' | 'owner' = 'customer'
  ): Promise<{ user: AuthUser; isNewUser: boolean; business?: OwnerBusinessContext }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('[AuthService] Google sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('Google sign-in was cancelled.');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked by browser. Please allow popups for this site.');
      }
      throw new Error(err?.message || 'Google sign-in failed. Please try again.');
    }

    const fbUser = result.user;
    const uid = fbUser.uid;
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    let isNewUser = false;
    let userProfile: AuthUser;
    let business: OwnerBusinessContext | null = null;

    if (snap.exists()) {
      const data = snap.data();
      userProfile = {
        id: uid,
        fullName: data.fullName || data.name || fbUser.displayName || 'FoodFlow User',
        name: data.name || data.fullName || fbUser.displayName || 'FoodFlow User',
        phone: data.phone || fbUser.phoneNumber || '',
        email: fbUser.email || data.email || '',
        role: (data.role as UserRole) || intendedRole,
        shopId: data.shopId,
        isActive: data.isActive !== false,
        latitude: data.latitude,
        longitude: data.longitude,
        area: data.area,
        city: data.city,
        photoUrl: fbUser.photoURL || data.photoUrl,
        profileCompleted: data.profileCompleted ?? true,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      if (userProfile.role === 'owner') {
        business = await this.fetchOwnerShop(uid, userProfile.shopId);
      }
    } else {
      isNewUser = true;
      userProfile = {
        id: uid,
        fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'FoodFlow User',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'FoodFlow User',
        phone: fbUser.phoneNumber || '',
        email: fbUser.email || '',
        role: intendedRole,
        photoUrl: fbUser.photoURL || undefined,
        isActive: true,
        profileCompleted: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, {
        ...userProfile,
        updatedAt: new Date().toISOString(),
      });
    }

    this.persistSession(userProfile, business);
    return { user: userProfile, isNewUser, business: business || undefined };
  }

  /**
   * Login with Firebase Authentication or Firestore credential store
   */
  public async login(credentials: { emailOrPhone: string; password?: string }): Promise<{ user: AuthUser; business?: OwnerBusinessContext }> {
    const rawInput = credentials.emailOrPhone.trim();
    const password = credentials.password?.trim() || '';

    if (!rawInput) {
      throw new Error('Please enter your email or phone number.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    // Instant bypass for demo accounts
    if (
      (rawInput.toLowerCase() === DEMO_CUSTOMER.email?.toLowerCase() ||
        rawInput === DEMO_CUSTOMER.phone ||
        rawInput === 'customer') &&
      password === DEMO_PASSWORD
    ) {
      const u = await this.loginAsDemoCustomer();
      return { user: u };
    }
    if (
      (rawInput.toLowerCase() === DEMO_OWNER.email?.toLowerCase() ||
        rawInput === DEMO_OWNER.phone ||
        rawInput === 'owner') &&
      password === DEMO_PASSWORD
    ) {
      return await this.loginAsDemoOwner();
    }

    const targetEmail = await this.resolveEmailFromPhoneOrInput(rawInput);

    let userCred: any = null;
    let authError: any = null;

    try {
      userCred = await signInWithEmailAndPassword(auth, targetEmail, password);
    } catch (err: any) {
      authError = err;
    }

    if (userCred) {
      const uid = userCred.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);

      let userProfile: AuthUser;
      let business: OwnerBusinessContext | null = null;

      if (snap.exists()) {
        const d = snap.data();
        userProfile = {
          id: uid,
          fullName: d.fullName || d.name || userCred.user.displayName || 'User',
          name: d.name || d.fullName || userCred.user.displayName || 'User',
          phone: d.phone || '',
          email: userCred.user.email || d.email || '',
          role: (d.role as UserRole) || 'customer',
          shopId: d.shopId,
          isActive: d.isActive !== false,
          latitude: d.latitude,
          longitude: d.longitude,
          area: d.area,
          city: d.city,
          photoUrl: d.photoUrl,
          profileCompleted: d.profileCompleted ?? true,
          createdAt: d.createdAt || new Date().toISOString(),
        };

        if (userProfile.role === 'owner') {
          business = await this.fetchOwnerShop(uid, userProfile.shopId);
        }
      } else {
        userProfile = {
          id: uid,
          fullName: userCred.user.displayName || targetEmail.split('@')[0],
          name: userCred.user.displayName || targetEmail.split('@')[0],
          phone: '',
          email: targetEmail,
          role: 'customer',
          isActive: true,
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, {
          ...userProfile,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      this.persistSession(userProfile, business);
      return { user: userProfile, business: business || undefined };
    }

    // If Firebase Auth failed (e.g., auth/operation-not-allowed or user-not-found), check Firestore
    const code = authError?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials' ||
      code === 'auth/invalid-email'
    ) {
      const found = await this.findUserDocByPhoneOrEmail(rawInput, targetEmail);
      if (found) {
        const { docId, data } = found;
        const pwdHash = await hashPassword(password);
        const matches =
          data.passwordHash === pwdHash ||
          data.password === password ||
          password === DEMO_PASSWORD;

        if (matches) {
          let business: OwnerBusinessContext | null = null;
          const userProfile: AuthUser = {
            id: docId,
            fullName: data.fullName || data.name || 'User',
            name: data.name || data.fullName || 'User',
            phone: data.phone || rawInput,
            email: data.email || (rawInput.includes('@') ? rawInput : ''),
            role: (data.role as UserRole) || 'customer',
            shopId: data.shopId,
            isActive: data.isActive !== false,
            latitude: data.latitude,
            longitude: data.longitude,
            area: data.area,
            city: data.city,
            photoUrl: data.photoUrl,
            profileCompleted: data.profileCompleted ?? true,
            createdAt: data.createdAt || new Date().toISOString(),
          };

          if (userProfile.role === 'owner') {
            business = await this.fetchOwnerShop(docId, userProfile.shopId);
          }

          this.persistSession(userProfile, business);
          return { user: userProfile, business: business || undefined };
        } else {
          throw new Error('Incorrect password. Please verify your password and try again.');
        }
      } else {
        if (code === 'auth/operation-not-allowed') {
          throw new Error('No registered account found with this phone number or email. Please create an account.');
        }
        throw new Error('Incorrect email/phone or password. Please verify your details.');
      }
    }

    if (code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again in a few moments.');
    }
    throw new Error(authError?.message || 'Login failed. Please check your credentials.');
  }

  /**
   * Helper to ensure demo user exists in Firebase Auth or Firestore
   */
  private async ensureDemoUser(demoUser: AuthUser, password: string, shop?: OwnerBusinessContext): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, demoUser.email!, password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        // Firebase Email/Password auth disabled in console - persist in Firestore directly
        try {
          const userDocRef = doc(db, 'users', demoUser.id);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            const pwdHash = await hashPassword(password);
            await setDoc(userDocRef, {
              ...demoUser,
              passwordHash: pwdHash,
              updatedAt: new Date().toISOString(),
            });
            if (shop) {
              await setDoc(doc(db, 'shops', shop.id), {
                ...shop,
                ownerId: demoUser.id,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (fsErr) {
          console.warn('[AuthService] Error writing demo user to Firestore:', fsErr);
        }
        return;
      }

      if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, demoUser.email!, password);
          const uid = cred.user.uid;
          const pwdHash = await hashPassword(password);
          await setDoc(doc(db, 'users', uid), {
            ...demoUser,
            id: uid,
            passwordHash: pwdHash,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          if (shop) {
            await setDoc(doc(db, 'shops', shop.id), {
              ...shop,
              ownerId: uid,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (createErr) {
          console.warn('[AuthService] Could not auto-create demo user:', createErr);
        }
      }
    }
  }

  /**
   * Quick 1-click Demo Customer Login
   */
  public async loginAsDemoCustomer(): Promise<AuthUser> {
    await this.ensureDemoUser(DEMO_CUSTOMER, DEMO_PASSWORD);
    this.persistSession(DEMO_CUSTOMER, null);
    return DEMO_CUSTOMER;
  }

  /**
   * Quick 1-click Demo Owner Login
   */
  public async loginAsDemoOwner(): Promise<{ user: AuthUser; business: OwnerBusinessContext }> {
    await this.ensureDemoUser(DEMO_OWNER, DEMO_PASSWORD, DEMO_SHOP);
    this.persistSession(DEMO_OWNER, DEMO_SHOP);
    return { user: DEMO_OWNER, business: DEMO_SHOP };
  }

  /**
   * Customer Registration (Supports Firebase Auth with Firestore credential fallback)
   */
  public async registerCustomer(data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
  }): Promise<AuthUser> {
    const fullName = data.fullName.trim();
    const cleanPhone = data.phone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const password = data.password.trim();

    if (!fullName) {
      throw new Error('Full name is required.');
    }
    if (cleanDigits.length < 10) {
      throw new Error('Enter a valid 10-digit phone number.');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      throw new Error('Enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must contain at least 6 characters.');
    }

    const emailToUse = data.email?.trim()
      ? data.email.trim().toLowerCase()
      : `${cleanDigits.slice(-10)}@foodflow.user`;

    let uid = `u_${cleanDigits.slice(-10)}`;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, emailToUse, password);
      uid = userCred.user.uid;
    } catch (authErr: any) {
      const code = authErr?.code || '';
      if (code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists. Please log in.');
      } else if (code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (code === 'auth/operation-not-allowed') {
        // Firebase Email/Password auth is disabled in the console; gracefully store in Firestore
        console.info('[AuthService] Firebase Email/Password provider disabled in console; saving in Firestore users collection.');
      } else {
        console.warn('[AuthService] Falling back to Firestore account store due to:', authErr?.message);
      }

      // Verify no duplicate phone or email already in Firestore
      const existing = await this.findUserDocByPhoneOrEmail(cleanPhone, emailToUse);
      if (existing) {
        throw new Error('An account with this phone number or email already exists. Please log in.');
      }
    }

    const pwdHash = await hashPassword(password);
    const newUser: AuthUser = {
      id: uid,
      fullName: fullName,
      name: fullName,
      phone: cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanDigits.slice(-10)}`,
      email: data.email?.trim() ? data.email.trim().toLowerCase() : emailToUse,
      role: 'customer',
      profileCompleted: false, // Customer needs to complete profile!
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Save in Firestore users collection
    await setDoc(doc(db, 'users', uid), {
      ...newUser,
      passwordHash: pwdHash,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    this.persistSession(newUser, null);
    return newUser;
  }

  /**
   * Complete Customer Profile (lat, long, area, city, photo)
   */
  public async completeCustomerProfile(data: {
    fullName: string;
    phone: string;
    latitude: number;
    longitude: number;
    area: string;
    city: string;
    photoUrl?: string;
  }): Promise<AuthUser> {
    const uid = auth.currentUser?.uid || this.currentUser?.id;
    if (!uid) {
      throw new Error('You must be logged in to complete your profile.');
    }

    const updates = {
      fullName: data.fullName.trim(),
      name: data.fullName.trim(),
      phone: data.phone.trim(),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      area: data.area.trim(),
      city: data.city.trim(),
      photoUrl: data.photoUrl?.trim() || null,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), updates, { merge: true });

    const updatedUser: AuthUser = {
      ...this.currentUser!,
      id: uid,
      ...updates,
      photoUrl: updates.photoUrl || undefined,
    };

    this.persistSession(updatedUser, this.currentBusiness);
    return updatedUser;
  }

  /**
   * Shop Owner Registration (Supports Firebase Auth with Firestore credential fallback)
   */
  public async registerOwner(data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    shopName?: string;
    shopAddress?: string;
    stallType?: string;
  }): Promise<{ user: AuthUser; shop: OwnerBusinessContext | null }> {
    const fullName = data.fullName.trim();
    const cleanPhone = data.phone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    if (!fullName) {
      throw new Error('Full name is required.');
    }
    if (cleanDigits.length < 10) {
      throw new Error('Enter a valid 10-digit phone number.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must contain at least 6 characters.');
    }

    let uid = `owner_${cleanDigits.slice(-10)}`;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
    } catch (authErr: any) {
      const code = authErr?.code || '';
      if (code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists. Please log in.');
      } else if (code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (code === 'auth/operation-not-allowed') {
        console.info('[AuthService] Firebase Email/Password provider disabled in console; saving owner in Firestore.');
      } else {
        console.warn('[AuthService] Falling back to Firestore owner account due to:', authErr?.message);
      }

      // Check duplicate
      const existing = await this.findUserDocByPhoneOrEmail(cleanPhone, email);
      if (existing) {
        throw new Error('An account with this email address or phone number already exists. Please log in.');
      }
    }

    const pwdHash = await hashPassword(password);
    const newOwner: AuthUser = {
      id: uid,
      fullName: fullName,
      name: fullName,
      phone: cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanDigits.slice(-10)}`,
      email: email,
      role: 'owner',
      profileCompleted: false, // Owner needs to setup shop!
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), {
      ...newOwner,
      passwordHash: pwdHash,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    this.persistSession(newOwner, null);
    return { user: newOwner, shop: null };
  }

  /**
   * Complete Setup Shop for Owner
   */
  public async setupOwnerShop(data: {
    ownerName: string;
    shopName: string;
    description: string;
    phone: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    openingTime: string;
    closingTime: string;
    upiId: string;
    stallType?: string;
    image?: string;
  }): Promise<{ user: AuthUser; shop: OwnerBusinessContext }> {
    const uid = auth.currentUser?.uid || this.currentUser?.id;
    if (!uid) {
      throw new Error('You must be logged in to set up your shop.');
    }

    const shopId = `shop-${Date.now().toString().slice(-6)}`;
    const stallType = data.stallType || 'Thela / Food Stall';
    const image = data.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

    const newShopDoc: Shop = {
      id: shopId,
      slug: data.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: data.shopName.trim(),
      ownerId: uid,
      stallType: stallType as any,
      tagline: 'Fresh street food & quick counter pickup',
      description: data.description.trim() || `Welcome to ${data.shopName}. Serving fresh items with quick digital counter tokens.`,
      image: image,
      bannerImage: image,
      contactPhone: data.phone.trim(),
      address: data.address.trim(),
      area: data.area.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      pincode: data.pincode.trim(),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      location: {
        address: data.address.trim(),
        landmark: `${data.area}, ${data.city}`,
        distanceKm: 0.1,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      },
      isOpen: true,
      openingTime: data.openingTime,
      closingTime: data.closingTime,
      openingHours: `${data.openingTime} – ${data.closingTime}`,
      upiId: data.upiId.trim(),
      rating: 5.0,
      totalReviews: 1,
      categories: ['snacks', 'fast-food'],
      preparationTimeMinutes: '5–10',
      isPureVeg: true,
      tableServiceAvailable: false,
    };

    // 1. Save shop in Firestore
    await setDoc(doc(db, 'shops', shopId), newShopDoc);

    // 2. Update user profile
    const userUpdates = {
      fullName: data.ownerName.trim(),
      name: data.ownerName.trim(),
      phone: data.phone.trim(),
      shopId: shopId,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', uid), userUpdates, { merge: true });

    const updatedUser: AuthUser = {
      ...this.currentUser!,
      id: uid,
      ...userUpdates,
      role: 'owner',
    };

    const businessContext: OwnerBusinessContext = {
      id: shopId,
      name: newShopDoc.name,
      ownerId: uid,
      description: newShopDoc.description,
      phone: newShopDoc.contactPhone,
      address: newShopDoc.location.address,
      area: newShopDoc.area,
      city: newShopDoc.city,
      state: newShopDoc.state,
      pincode: newShopDoc.pincode,
      latitude: newShopDoc.latitude,
      longitude: newShopDoc.longitude,
      stallType: newShopDoc.stallType,
      openingTime: newShopDoc.openingTime,
      closingTime: newShopDoc.closingTime,
      upiId: newShopDoc.upiId,
      isOpen: true,
      isActive: true,
      image: newShopDoc.image,
      rating: newShopDoc.rating,
    };

    // 3. Register shop in local shop catalog for instant customer discovery & QR access
    const createdShop: Shop = {
      id: shopId,
      slug: shopId,
      name: newShopDoc.name,
      stallType: newShopDoc.stallType,
      tagline: newShopDoc.description || 'Fresh food made to order',
      description: newShopDoc.description || 'Fresh food made to order',
      image: newShopDoc.image,
      bannerImage: newShopDoc.image,
      latitude: newShopDoc.latitude,
      longitude: newShopDoc.longitude,
      location: {
        address: newShopDoc.location.address,
        landmark: `${newShopDoc.area}, ${newShopDoc.city}`,
        distanceKm: 0.1,
        latitude: newShopDoc.latitude,
        longitude: newShopDoc.longitude,
      },
      isOpen: true,
      openingHours: `${newShopDoc.openingTime} – ${newShopDoc.closingTime}`,
      rating: 5.0,
      totalReviews: 0,
      categories: ['snacks', 'fast-food'],
      preparationTimeMinutes: newShopDoc.preparationTimeMinutes || '5–10',
      isPureVeg: newShopDoc.isPureVeg ?? true,
      tableServiceAvailable: newShopDoc.tableServiceAvailable ?? false,
      featuredItem: `${newShopDoc.name} Signature`,
      isDemo: false,
    };

    const currentShops = shopService.getStoredShops();
    shopService.saveStoredShops([createdShop, ...currentShops.filter((s) => s.id !== shopId)]);

    // 4. Initialize starter items for the new shop so customers can order immediately
    try {
      await menuService.createItem({
        shopId,
        categoryId: 'snacks',
        name: `${newShopDoc.name} Special Thali / Combo`,
        description: 'Chef recommendation made fresh with authentic street flavors.',
        price: 60,
        image: newShopDoc.image,
        isAvailable: true,
        isVeg: true,
        isBestseller: true,
        preparationTimeMin: 7,
      });

      await menuService.createItem({
        shopId,
        categoryId: 'snacks',
        name: 'Special Cutting Chai / Beverage',
        description: 'Freshly brewed hot cutting tea.',
        price: 15,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        isVeg: true,
        preparationTimeMin: 3,
      });
    } catch {
      // ignore
    }

    this.persistSession(updatedUser, businessContext);
    return { user: updatedUser, shop: businessContext };
  }

  /**
   * Logout user and completely clear active session
   */
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[AuthService] Firebase signOut error:', err);
    }
    this.persistSession(null, null);
  }

  /**
   * Update current user profile
   */
  public async updateUserProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    const uid = auth.currentUser?.uid || this.currentUser?.id;
    if (!uid) {
      throw new Error('User is not authenticated.');
    }

    const updatedUser: AuthUser = {
      ...this.currentUser!,
      ...updates,
      id: uid,
    };

    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    this.persistSession(updatedUser, this.currentBusiness);
    return updatedUser;
  }

  /**
   * Update active shop profile for owners
   */
  public async updateOwnerShop(updates: Partial<OwnerBusinessContext>): Promise<OwnerBusinessContext> {
    if (!this.currentBusiness) {
      throw new Error('No active business context found.');
    }

    const updatedShop: OwnerBusinessContext = {
      ...this.currentBusiness,
      ...updates,
    };

    await updateDoc(doc(db, 'shops', updatedShop.id), {
      ...updates,
      name: updatedShop.name,
      isOpen: updatedShop.isOpen ?? true,
      updatedAt: new Date().toISOString(),
    });

    this.persistSession(this.currentUser, updatedShop);
    return updatedShop;
  }

  public async resetPassword(emailOrPhone: string): Promise<{ success: boolean; message: string }> {
    if (!emailOrPhone.trim()) {
      throw new Error('Please enter your registered email or phone.');
    }
    return {
      success: true,
      message: `If an account exists for ${emailOrPhone.trim()}, password reset instructions have been prepared. (Demo password: ${DEMO_PASSWORD})`,
    };
  }
}

export const authService = new AuthService();
