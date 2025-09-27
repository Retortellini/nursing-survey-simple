// src/App.tsx - UPDATED with Comparative Analytics route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Dashboard from './components/Dashboard';
import NurseSurvey from './components/NurseSurvey';
import CNASurvey from './components/CNASurvey';
import Results from './components/Results';
import Simulation from './components/Simulation';
import RealtimeAnalytics from './components/RealtimeAnalytics';
import DataQuality from './components/DataQuality';
import ComparativeAnalytics from './components/ComparativeAnalytics';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Nursing Workload Platform</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
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
              Nurse Survey
            </Link>
            <Link 
              to="/survey/cna" 
              className={`text-sm font-medium ${isActive('/survey/cna') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              CNA Survey
            </Link>
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
              Data Quality
            </Link>
            <Link 
              to="/comparative" 
              className={`text-sm font-medium ${isActive('/comparative') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              Comparative
            </Link>
            <Link 
              to="/results" 
              className={`text-sm font-medium ${isActive('/results') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              Results
            </Link>
            <Link 
              to="/simulation" 
              className={`text-sm font-medium ${isActive('/simulation') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              Simulation
            </Link>
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/survey/nurse" element={<NurseSurvey />} />
            <Route path="/survey/cna" element={<CNASurvey />} />
            <Route path="/analytics" element={<RealtimeAnalytics />} />
            <Route path="/quality" element={<DataQuality />} />
            <Route path="/comparative" element={<ComparativeAnalytics />} />
            <Route path="/results" element={<Results />} />
            <Route path="/simulation" element={<Simulation />} />
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