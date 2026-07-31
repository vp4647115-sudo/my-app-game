import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import { UserProfile, MatchHistoryItem } from '../types';

const rawConfig = (firebaseConfigRaw || {}) as Record<string, string>;

// Environment variables are the primary configuration source with fallback to config json
const resolvedFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId || '(default)',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || rawConfig.measurementId || '',
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || rawConfig.oAuthClientId || '',
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || rawConfig.recaptchaSiteKey || '',
};

// Initialize Firebase App & Firestore with databaseId
const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test on boot as required by Firebase SKILL.md
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.warn('Firebase connection test info:', error instanceof Error ? error.message : error);
  }
}
testConnection();

// OperationType and FirestoreErrorInfo error handler as required by SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Google Sign-In with popup & COOP protection
export async function signInWithGoogleFirebase() {
  if (typeof window === 'undefined') return null;

  const originalOpen = window.open;
  let popupWin: Window | null = null;
  let isClosed = false;

  const handleFocus = () => {
    if (popupWin) {
      try {
        if (popupWin.closed) {
          isClosed = true;
        }
      } catch (e) {
        isClosed = true;
      }
    }
  };

  try {
    window.open = function (...args) {
      const win = originalOpen.apply(window, args);
      if (!win) return win;
      popupWin = win;
      isClosed = false;

      window.addEventListener('focus', handleFocus);

      return new Proxy(win, {
        get(target, prop, receiver) {
          if (prop === 'closed') {
            return isClosed;
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Firebase Google Sign-In notice:', error?.message || error);
    throw error;
  } finally {
    isClosed = true;
    window.removeEventListener('focus', handleFocus);
    window.open = originalOpen;
  }
}

// Email/Password Sign-In
export async function signInWithEmailFirebase(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error: any) {
    console.warn('Firebase Email Sign-In notice:', error?.message || error);
    throw error;
  }
}

// Email/Password Registration
export async function registerWithEmailFirebase(email: string, pass: string, displayName?: string) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && res.user) {
      await updateProfile(res.user, { displayName });
    }
    return res.user;
  } catch (error: any) {
    console.warn('Firebase Registration notice:', error?.message || error);
    throw error;
  }
}

// Sign out
export async function signOutFirebase() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Firebase Sign Out Error:', error);
    throw error;
  }
}

// Save profile to Firestore
export async function saveFirebaseUserProfile(userId: string, profile: Partial<UserProfile>) {
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}

// Fetch profile from Firestore
export async function getFirebaseUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId);
  try {
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

// Save match history item to Firestore
export async function addFirebaseMatchHistory(userId: string, match: MatchHistoryItem) {
  const matchesRef = doc(collection(db, 'users', userId, 'matches'), match.id);
  try {
    await setDoc(matchesRef, {
      ...match,
      userId,
      timestamp: match.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/matches/${match.id}`);
  }
}

// Fetch match history from Firestore
export async function getFirebaseMatchHistory(userId: string): Promise<MatchHistoryItem[]> {
  const matchesCol = collection(db, 'users', userId, 'matches');
  try {
    const q = query(matchesCol, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const results: MatchHistoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      results.push(docSnap.data() as MatchHistoryItem);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/matches`);
    return [];
  }
}
