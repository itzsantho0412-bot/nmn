import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../config/firebase.ts';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  activeRole: UserRole;
  isSuperAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  simulateRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Super admin email recognized automatically
const SUPER_ADMIN_EMAIL = 'loqsandy@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const isSuper = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        setProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
          isSuperAdmin: isSuper,
        });
        if (isSuper) {
          setActiveRole('super_admin');
        } else {
          setActiveRole('owner');
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogleAction = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const e = err as Error;
      setAuthError(e.message || 'Failed to sign in with Google');
    }
  };

  const simulateRole = (role: UserRole) => {
    setActiveRole(role);
  };

  const logoutAction = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setCurrentUser(null);
      setActiveRole('owner');
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }
  };

  const isSuperAdmin = profile?.isSuperAdmin || activeRole === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        activeRole,
        isSuperAdmin,
        loading,
        signInWithGoogle: signInWithGoogleAction,
        simulateRole,
        logout: logoutAction,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
