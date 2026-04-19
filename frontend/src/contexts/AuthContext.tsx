'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        
        if (userDoc.exists()) {
          setUser({
            id: userDoc.id,
            ...userDoc.data(),
            createdAt: userDoc.data().createdAt?.toDate(),
            updatedAt: userDoc.data().updatedAt?.toDate(),
          } as User);
        } else {
          const newUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Anonymous User',
            avatarUrl: fbUser.photoURL || '',
            bio: '',
            isCreator: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await setDoc(doc(db, 'users', fbUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, (await import('@/lib/firebase')).googleProvider);
    
    if (result.user) {
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        const newUser: User = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Anonymous User',
          avatarUrl: result.user.photoURL || '',
          bio: '',
          isCreator: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', result.user.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  };

  const signOut = async () => {
    const { signOut: fbSignOut } = await import('firebase/auth');
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
