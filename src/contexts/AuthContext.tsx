import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for authentication
const DEMO_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@pmcockpit.com',
    fullName: 'System Administrator',
    role: 'Admin' as const,
  },
  {
    id: '2',
    username: 'manager',
    password: 'manager123',
    email: 'manager@pmcockpit.com',
    fullName: 'Project Manager',
    role: 'Manager' as const,
  },
  {
    id: '3',
    username: 'user',
    password: 'user123',
    email: 'user@pmcockpit.com',
    fullName: 'Team Member',
    role: 'User' as const,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('pm-cockpit-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('pm-cockpit-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = DEMO_USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const authUser: AuthUser = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: foundUser.role,
      };
      
      setUser(authUser);
      localStorage.setItem('pm-cockpit-user', JSON.stringify(authUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pm-cockpit-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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