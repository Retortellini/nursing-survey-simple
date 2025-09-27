// src/App.tsx - WITH PASSWORD PROTECTION AND VISIBLE LINKS
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, LogOut, Menu } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Determine which nav items to show based on auth level
  const showAnalytics = isAuthenticated;
  const showAdmin = userLevel === 'admin';
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Nursing Workload Platform</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-3">
            <Link 
              to="/" 
              className={`text-sm font-medium px-3 py-2 rounded ${isActive('/') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Home
            </Link>
            <Link 
              to="/survey/nurse" 
              className={`text-sm font-medium px-3 py-2 rounded ${isActive('/survey/nurse') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              RN Survey
            </Link>
            <Link 
              to="/survey/cna" 
              className={`text-sm font-medium px-3 py-2 rounded ${isActive('/survey/cna') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              CNA Survey
            </Link>
            
            {/* Analytics section - requires password */}
            {showAnalytics && (
              <>
                <div className="border-l pl-3 ml-3 flex items-center space-x-3">
                  <Link 
                    to="/analytics" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/analytics') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Analytics
                  </Link>
                  <Link 
                    to="/quality" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/quality') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Quality
                  </Link>
                  <Link 
                    to="/comparative" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/comparative') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Compare
                  </Link>
                  <Link 
                    to="/visualizations" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/visualizations') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Visualize
                  </Link>
                  <Link 
                    to="/results" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/results') ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Results
                  </Link>
                </div>
              </>
            )}
            
            {/* Admin section - requires admin password */}
            {showAdmin && (
              <>
                <div className="border-l pl-3 ml-3 flex items-center space-x-3">
                  <Link 
                    to="/simulation" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/simulation') ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Simulate
                  </Link>
                  <Link 
                    to="/enhanced-simulation" 
                    className={`text-sm font-medium px-3 py-2 rounded ${isActive('/enhanced-simulation') ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Enhanced
                  </Link>
                </div>
              </>
            )}

            {/* Logout button */}
            {isAuthenticated && (
              <button
                onClick={logout}
                className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded text-gray-700 hover:bg-red-50 hover:text-red-600 ml-3"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t">
            <div className="flex flex-col space-y-2 pt-4">
              <Link to="/" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">Home</Link>
              <Link to="/survey/nurse" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">RN Survey</Link>
              <Link to="/survey/cna" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">CNA Survey</Link>
              
              {showAnalytics && (
                <>
                  <div className="border-t my-2 pt-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 mb-2">ANALYTICS</p>
                    <Link to="/analytics" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Analytics</Link>
                    <Link to="/quality" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Quality</Link>
                    <Link to="/comparative" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Compare</Link>
                    <Link to="/visualizations" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Visualize</Link>
                    <Link to="/results" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Results</Link>
                  </div>
                </>
              )}
              
              {showAdmin && (
                <>
                  <div className="border-t my-2 pt-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 mb-2">ADMIN</p>
                    <Link to="/simulation" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Simulate</Link>
                    <Link to="/enhanced-simulation" className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded block">Enhanced</Link>
                  </div>
                </>
              )}

              {isAuthenticated && (
                <button onClick={logout} className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded text-left">
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
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