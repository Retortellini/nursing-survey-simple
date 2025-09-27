// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSurveyCounts } from '../lib/supabase';
import { ClipboardList, Users, BarChart2, Play, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [counts, setCounts] = useState({ rn: 0, cna: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const data = await getSurveyCounts();
      setCounts(data);
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Nursing Workload Survey Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Help improve nursing workload management by sharing your task time data. 
          Your input directly informs staffing simulations and recommendations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : counts.total}
              </p>
            </div>
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">RN Surveys</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : counts.rn}
              </p>
            </div>
            <ClipboardList className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CNA Surveys</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : counts.cna}
              </p>
            </div>
            <ClipboardList className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Link 
          to="/survey/nurse"
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all"
        >
          <ClipboardList className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Take Nurse Survey</h3>
          <p className="mb-4 opacity-90">
            Share your task time data as a Registered Nurse to help improve workload understanding
          </p>
          <div className="flex items-center text-sm font-semibold">
            Start Survey <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Link>

        <Link 
          to="/survey/cna"
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-8 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all"
        >
          <ClipboardList className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Take CNA Survey</h3>
          <p className="mb-4 opacity-90">
            Share your task time data as a Certified Nursing Assistant to contribute to better staffing
          </p>
          <div className="flex items-center text-sm font-semibold">
            Start Survey <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link 
          to="/results"
          className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
        >
          <BarChart2 className="h-12 w-12 text-indigo-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">View Results</h3>
          <p className="text-gray-600">
            Explore aggregated survey data and see how task times vary across shifts and roles
          </p>
        </Link>

        <Link 
          to="/simulation"
          className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
        >
          <Play className="h-12 w-12 text-indigo-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Run Simulation</h3>
          <p className="text-gray-600">
            Use survey data to simulate different staffing ratios and optimize workload distribution
          </p>
        </Link>
      </div>

      {/* Simple Aggregated Insights */}
      {counts.total >= 5 && (
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Community Insights</h2>
          <p className="text-gray-600 mb-6">
            Here's what our community of {counts.total} healthcare professionals is telling us:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                {counts.rn}
              </div>
              <p className="text-gray-700 font-medium">Registered Nurses</p>
              <p className="text-sm text-gray-600 mt-2">
                Sharing their experience with clinical tasks and patient care
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                {counts.cna}
              </div>
              <p className="text-gray-700 font-medium">Certified Nursing Assistants</p>
              <p className="text-sm text-gray-600 mt-2">
                Contributing valuable data on daily care activities
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Your Impact:</strong> With {counts.total} responses, we can now run meaningful 
              workload simulations to help optimize staffing ratios and improve working conditions. 
              The more data we collect, the more accurate our recommendations become!
            </p>
          </div>
        </div>
      )}

      {/* Thank You Section */}
      {counts.total > 0 && (
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8 text-center border border-indigo-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Thank You to Our Contributors! 🎉
          </h2>
          <p className="text-xl text-gray-700 mb-4">
            <strong>{counts.total} responses collected</strong> - Your input is making a real difference!
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Every survey response helps us better understand nursing workload and develop more accurate 
            staffing simulations. Your anonymous contributions are helping improve patient care and 
            working conditions for healthcare teams.
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h3 className="font-semibold mb-2">Take Survey</h3>
            <p className="text-sm text-gray-600">
              Complete a quick survey about your typical task times during a shift
            </p>
          </div>
          <div>
            <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h3 className="font-semibold mb-2">Data Collection</h3>
            <p className="text-sm text-gray-600">
              Your anonymous responses are aggregated with others to build a comprehensive dataset
            </p>
          </div>
          <div>
            <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h3 className="font-semibold mb-2">Simulation & Insights</h3>
            <p className="text-sm text-gray-600">
              Data feeds into simulations that help optimize staffing ratios and workload distribution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;