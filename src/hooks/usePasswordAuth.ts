// src/hooks/usePasswordAuth.ts
import { useState, useEffect } from 'react';
import { checkPassword, AUTH_KEYS, AccessLevel } from '../lib/passwords';

export function usePasswordAuth(requiredLevel: AccessLevel = 'analytics') {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLevel, setUserLevel] = useState<AccessLevel | null>(null);

  // Check auth on mount and when requiredLevel changes
  useEffect(() => {
    checkAuth();
  }, [requiredLevel]);

  // Listen for storage changes (when login happens in another component)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuth();
    };

    // Custom event for same-window storage updates
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, [requiredLevel]);

  function checkAuth() {
    const authAnalytics = sessionStorage.getItem(AUTH_KEYS.ANALYTICS);
    const authAdmin = sessionStorage.getItem(AUTH_KEYS.ADMIN);
    
    if (authAdmin === 'true') {
      setIsAuthenticated(true);
      setUserLevel('admin');
    } else if (requiredLevel === 'analytics' && authAnalytics === 'true') {
      setIsAuthenticated(true);
      setUserLevel('analytics');
    } else {
      setIsAuthenticated(false);
      setUserLevel(null);
    }
  }

  function login(password: string) {
    // Check admin password first (gives access to everything)
    if (checkPassword(password, 'admin')) {
      sessionStorage.setItem(AUTH_KEYS.ADMIN, 'true');
      sessionStorage.setItem(AUTH_KEYS.ANALYTICS, 'true');
      setIsAuthenticated(true);
      setUserLevel('admin');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('auth-change'));
      
      return { success: true, level: 'admin' as AccessLevel };
    } 
    // Check analytics password
    else if (checkPassword(password, 'analytics')) {
      sessionStorage.setItem(AUTH_KEYS.ANALYTICS, 'true');
      setIsAuthenticated(true);
      setUserLevel('analytics');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('auth-change'));
      
      return { success: true, level: 'analytics' as AccessLevel };
    }
    
    return { success: false, level: null };
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEYS.ANALYTICS);
    sessionStorage.removeItem(AUTH_KEYS.ADMIN);
    setIsAuthenticated(false);
    setUserLevel(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('auth-change'));
  }

  return { isAuthenticated, userLevel, login, logout };
}