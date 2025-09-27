// src/App.tsx - WITH PASSWORD PROTECTION
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { usePasswordAuth } from './hooks/usePasswordAuth';
import { PasswordProtect } from './components/PasswordProtect';
import Dashboard from './components/Dashboard';
import NurseSurvey from './components/NurseSurvey';
import CNASurvey from './components/CNASurvey';
import Results from './components/Results';
import Simulation from './components/Simulation';
import EnhancedSimulation from './components/EnhancedSimulation';
import RealtimeAnalytics from './components/RealtimeAnalytics';
import DataQuality from './components/DataQuality';
import ComparativeAnalytics from './components/ComparativeAnalytics';
import AdvancedVisualizations from './components/AdvancedVisualizations';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, userLevel, logout } = usePasswordAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Determine which nav items to show based on auth level
  const showAnalytics = isAuthenticated;
  const showAdmin = userLevel === 'admin';
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Nursing Workload Platform</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className={`text-sm font-medium ${isActive('/') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/survey/nurse" 
              className={`text-sm font-medium ${isActive('/survey/nurse') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              RN Survey
            </Link>
            <Link 
              to="/survey/cna" 
              className={`text-sm font-medium ${isActive('/survey/cna') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              CNA Survey
            </Link>
            
            {/* Analytics section - requires password */}
            {showAnalytics && (
              <>
                <Link 
                  to="/analytics" 
                  className={`text-sm font-medium ${isActive('/analytics') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Analytics
                </Link>
                <Link 
                  to="/quality" 
                  className={`text-sm font-medium ${isActive('/quality') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Quality
                </Link>
                <Link 
                  to="/comparative" 
                  className={`text-sm font-medium ${isActive('/comparative') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Compare
                </Link>
                <Link 
                  to="/visualizations" 
                  className={`text-sm font-medium ${isActive('/visualizations') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Visualize
                </Link>
                <Link 
                  to="/results" 
                  className={`text-sm font-medium ${isActive('/results') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Results
                </Link>
              </>
            )}
            
            {/* Admin section - requires admin password */}
            {showAdmin && (
              <>
                <Link 
                  to="/simulation" 
                  className={`text-sm font-medium ${isActive('/simulation') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Simulate
                </Link>
                <Link 
                  to="/enhanced-simulation" 
                  className={`text-sm font-medium ${isActive('/enhanced-simulation') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
                >
                  Enhanced
                </Link>
              </>
            )}

            {/* Logout button */}
            {isAuthenticated && (
              <button
                onClick={logout}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-red-600 ml-4"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto py-8">
          <Routes>
            {/* PUBLIC ROUTES - No password needed */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/survey/nurse" element={<NurseSurvey />} />
            <Route path="/survey/cna" element={<CNASurvey />} />
            
            {/* ANALYTICS ROUTES - Analytics password required */}
            <Route path="/analytics" element={
              <PasswordProtect level="analytics">
                <RealtimeAnalytics />
              </PasswordProtect>
            } />
            <Route path="/quality" element={
              <PasswordProtect level="analytics">
                <DataQuality />
              </PasswordProtect>
            } />
            <Route path="/comparative" element={
              <PasswordProtect level="analytics">
                <ComparativeAnalytics />
              </PasswordProtect>
            } />
            <Route path="/visualizations" element={
              <PasswordProtect level="analytics">
                <AdvancedVisualizations />
              </PasswordProtect>
            } />
            <Route path="/results" element={
              <PasswordProtect level="analytics">
                <Results />
              </PasswordProtect>
            } />
            
            {/* ADMIN ROUTES - Admin password required */}
            <Route path="/simulation" element={
              <PasswordProtect level="admin">
                <Simulation />
              </PasswordProtect>
            } />
            <Route path="/enhanced-simulation" element={
              <PasswordProtect level="admin">
                <EnhancedSimulation />
              </PasswordProtect>
            } />
          </Routes>
        </main>
        
        <footer className="bg-white border-t py-6 mt-10">
          <div className="container mx-auto px-4 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Nursing Workload Survey Platform</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;