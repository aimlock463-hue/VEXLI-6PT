import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { User, Usage, Plan, LIMITS } from '../utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  usage: Usage;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, name: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  upgrade: () => Promise<void>;
  incrementUsage: (type: keyof Omit<Usage, 'lastReset'>) => void;
  checkLimit: (type: keyof Omit<Usage, 'lastReset'>) => boolean;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<Usage>({
    chats: 0,
    images: 0,
    analysis: 0,
    lastReset: Date.now()
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            const isAli = fUser.email === 'aimlock463@gmail.com';
            const newUser: User = {
              id: fUser.uid,
              email: fUser.email || '',
              name: fUser.displayName || fUser.email?.split('@')[0] || 'User',
              plan: isAli ? 'premium' : 'free',
              isAdmin: isAli,
              createdAt: Date.now()
            };
            await setDoc(doc(db, 'users', fUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          // Don't throw here to avoid breaking the app, but log it
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const savedUsage = localStorage.getItem('velix_usage');
    if (savedUsage) {
      const parsedUsage = JSON.parse(savedUsage);
      const now = new Date();
      const last = new Date(parsedUsage.lastReset);
      if (now.getDate() !== last.getDate()) {
        const reset = { chats: 0, images: 0, analysis: 0, lastReset: Date.now() };
        setUsage(reset);
        localStorage.setItem('velix_usage', JSON.stringify(reset));
      } else {
        setUsage(parsedUsage);
      }
    }

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (email: string, name: string, pass: string) => {
    try {
      const { user: fUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(fUser);
      
      const isAli = email === 'aimlock463@gmail.com';
      const newUser: User = {
        id: fUser.uid,
        email,
        name,
        plan: isAli ? 'premium' : 'free',
        isAdmin: isAli,
        createdAt: Date.now()
      };
      
      try {
        await setDoc(doc(db, 'users', fUser.uid), newUser);
        setUser(newUser);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${fUser.uid}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const upgrade = async () => {
    if (!user || !firebaseUser) return;
    const updatedUser = { ...user, plan: 'premium' as Plan };
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser);
      setUser(updatedUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error) {
        console.error("Resend verification error:", error);
        throw error;
      }
    }
  };

  const incrementUsage = (type: keyof Omit<Usage, 'lastReset'>) => {
    const newUsage = { ...usage, [type]: usage[type] + 1 };
    setUsage(newUsage);
    localStorage.setItem('velix_usage', JSON.stringify(newUsage));
  };

  const checkLimit = (type: keyof Omit<Usage, 'lastReset'>) => {
    if (!user) return false;
    const limit = LIMITS[user.plan][type];
    return usage[type] < limit;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      usage, 
      loading, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      upgrade, 
      incrementUsage, 
      checkLimit,
      resendVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
