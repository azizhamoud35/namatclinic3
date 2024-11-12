import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

interface AuthContextType {
  currentUser: (FirebaseUser & { role?: UserRole }) | null;
  userData: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<(FirebaseUser & { role?: UserRole }) | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser({ ...user, role: userData.role });
            setUserData(userData);

            // Redirect based on role
            if (userData.role) {
              navigate(`/dashboard/${userData.role}`);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await signOut(auth);
          navigate('/login');
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        navigate('/login');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data() as User;
    setCurrentUser({ ...user, role: userData.role });
    setUserData(userData);
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  };

  const logout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const value = {
    currentUser,
    userData,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}