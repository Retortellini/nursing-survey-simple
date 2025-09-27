// src/lib/passwords.ts

export const PASSWORDS = {
  ANALYTICS: 'NursingAnalytics2025',  // For analytics, quality, comparative, visualizations
  ADMIN: 'NursingAdmin2025'           // For simulations and all features
};

export type AccessLevel = 'analytics' | 'admin';

export function checkPassword(password: string, level: AccessLevel): boolean {
  if (level === 'admin') {
    return password === PASSWORDS.ADMIN;
  }
  return password === PASSWORDS.ANALYTICS || password === PASSWORDS.ADMIN;
}

// Session storage keys
export const AUTH_KEYS = {
  ANALYTICS: 'auth_analytics',
  ADMIN: 'auth_admin'
};