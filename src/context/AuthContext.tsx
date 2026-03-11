import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Usage, Plan, LIMITS } from '../utils';

interface AuthContextType {
  user: User | null;
  usage: Usage;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, name: string, pass: string) => Promise<void>;
  logout: () => void;
  upgrade: () => void;
  incrementUsage: (type: keyof Omit<Usage, 'lastReset'>) => void;
  checkLimit: (type: keyof Omit<Usage, 'lastReset'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<Usage>({
    chats: 0,
    images: 0,
    analysis: 0,
    lastReset: Date.now()
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('velix_user');
    const savedUsage = localStorage.getItem('velix_usage');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedUsage) {
      const parsedUsage = JSON.parse(savedUsage);
      // Reset usage if it's a new day
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
  }, []);

  const login = async (email: string, _pass: string) => {
    // Ali's special account check
    const isAli = email === 'aimlock463@gmail.com';
    
    const mockUser: User = {
      id: isAli ? 'ali-ceo' : '1',
      email,
      name: isAli ? 'Ali (CEO)' : email.split('@')[0],
      plan: isAli ? 'premium' : 'free', // Ali is always premium
      isAdmin: isAli, // Ali is always admin
      createdAt: Date.now()
    };
    setUser(mockUser);
    localStorage.setItem('velix_user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, name: string, _pass: string) => {
    const isAli = email === 'aimlock463@gmail.com';
    
    const mockUser: User = {
      id: isAli ? 'ali-ceo' : Date.now().toString(),
      email,
      name: isAli ? 'Ali (CEO)' : name,
      plan: isAli ? 'premium' : 'free',
      isAdmin: isAli,
      createdAt: Date.now()
    };
    setUser(mockUser);
    localStorage.setItem('velix_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('velix_user');
  };

  const upgrade = () => {
    if (!user) return;
    const upgraded = { ...user, plan: 'premium' as Plan };
    setUser(upgraded);
    localStorage.setItem('velix_user', JSON.stringify(upgraded));
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
    <AuthContext.Provider value={{ user, usage, login, signup, logout, upgrade, incrementUsage, checkLimit }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
