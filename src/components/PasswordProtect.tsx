// src/components/PasswordProtect.tsx
import React, { useState } from 'react';
import { usePasswordAuth } from '../hooks/usePasswordAuth';
import { AccessLevel } from '../lib/passwords';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordProtectProps {
  children: React.ReactNode;
  level?: AccessLevel;
}

export function PasswordProtect({ children, level = 'analytics' }: PasswordProtectProps) {
  const { isAuthenticated, login } = usePasswordAuth(level);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    const result = login(password);
    
    if (!result.success) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Lock className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Protected Access</h2>
            <p className="text-gray-600 mt-2">
              {level === 'admin' 
                ? 'Admin password required for simulations and advanced features' 
                : 'Password required to access analytics'}
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-md hover:shadow-lg"
            >
              Access System
            </button>
          </form>
          
          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Contact your administrator if you need access credentials
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Analytics Access</p>
            <p className="text-sm font-semibold text-indigo-600">View Reports</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Admin Access</p>
            <p className="text-sm font-semibold text-purple-600">All Features</p>
          </div>
        </div>
      </div>
    </div>
  );
}