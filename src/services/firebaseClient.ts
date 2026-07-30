import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, MatchHistoryItem } from '../types';

// Initialize Firebase App & Firestore with databaseId
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test on boot as required by Firebase SKILL.md
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline or connecting...');
    }
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
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-In with popup
export async function signInWithGoogleFirebase() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Firebase Google Sign-In Error:', error);
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
