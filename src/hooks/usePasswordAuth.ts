// src/hooks/usePasswordAuth.ts
import { useState, useEffect } from 'react';
import { checkPassword, AUTH_KEYS, AccessLevel } from '../lib/passwords';

export function usePasswordAuth(requiredLevel: AccessLevel = 'analytics') {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLevel, setUserLevel] = useState<AccessLevel | null>(null);

  useEffect(() => {
    checkAuth();
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
      return { success: true, level: 'admin' as AccessLevel };
    } 
    // Check analytics password
    else if (checkPassword(password, 'analytics')) {
      sessionStorage.setItem(AUTH_KEYS.ANALYTICS, 'true');
      setIsAuthenticated(true);
      setUserLevel('analytics');
      return { success: true, level: 'analytics' as AccessLevel };
    }
    
    return { success: false, level: null };
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEYS.ANALYTICS);
    sessionStorage.removeItem(AUTH_KEYS.ADMIN);
    setIsAuthenticated(false);
    setUserLevel(null);
  }

  return { isAuthenticated, userLevel, login, logout };
}