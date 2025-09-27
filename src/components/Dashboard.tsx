// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSurveyCounts, getSurveyResults } from '../lib/supabase';
import { ClipboardList, Users, ArrowRight, Lock, TrendingUp, Clock, Calendar } from 'lucide-react';

const Dashboard = () => {
  const [counts, setCounts] = useState({ rn: 0, cna: 0, total: 0 });
  const [insights, setInsights] = useState({
    avgTaskTime: 0,
    weeklyResponses: 0,
    shiftBreakdown: { days: 0, evenings: 0, nights: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const countsData = await getSurveyCounts();
      setCounts(countsData);

      // Fetch additional insights
      const responses = await getSurveyResults({});
      
      // Calculate average task time across all responses
      let totalTaskTime = 0;
      let taskCount = 0;
      
      responses.forEach(response => {
        if (response.responses) {
          Object.values(response.responses).forEach((task: any) => {
            if (task.minTime && task.maxTime) {
              totalTaskTime += (parseFloat(task.minTime) + parseFloat(task.maxTime)) / 2;
              taskCount++;
            }
          });
        }
      });

      // Get weekly responses (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyResponses = responses.filter(r => 
        new Date(r.submitted_at) > weekAgo
      ).length;

      // Get shift breakdown
      const shiftBreakdown = responses.reduce((acc, r) => {
        if (r.primary_shift) {
          acc[r.primary_shift] = (acc[r.primary_shift] || 0) + 1;
        }
        return acc;
      }, { days: 0, evenings: 0, nights: 0 });

      setInsights({
        avgTaskTime: taskCount > 0 ? Math.round(totalTaskTime / taskCount) : 0,
        weeklyResponses,
        shiftBreakdown
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneProgress = () => {
    const milestones = [10, 25, 50, 100, 200, 500];
    const nextMilestone = milestones.find(m => m > counts.total) || 500;
    const previousMilestone = milestones[milestones.indexOf(nextMilestone) - 1] || 0;
    const progress = ((counts.total - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
    return { nextMilestone, progress: Math.min(progress, 100) };
  };

  const { nextMilestone, progress } = getMilestoneProgress();

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

      {/* Milestone Progress Bar */}
      {counts.total > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 Community Milestone Progress
            </h3>
            <span className="text-sm font-medium text-indigo-600">
              {counts.total} / {nextMilestone} responses
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {nextMilestone - counts.total} more responses to reach our next milestone! 🚀
          </p>
        </div>
      )}

      {/* Stats Cards - Participation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : counts.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {counts.rn} RN • {counts.cna} CNA
              </p>
            </div>
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : insights.weeklyResponses}
              </p>
              <p className="text-xs text-gray-500 mt-1">New responses</p>
            </div>
            <Calendar className="h-12 w-12 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Task Time</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : insights.avgTaskTime}
                <span className="text-lg text-gray-500 ml-1">min</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Across all tasks</p>
            </div>
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Action Cards - Survey Only */}
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

      {/* Community Insights - Shift Breakdown */}
      {counts.total >= 5 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold">Community Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {insights.shiftBreakdown.days}
              </div>
              <p className="text-sm text-gray-600">Day Shift</p>
              <p className="text-xs text-gray-500 mt-1">
                {counts.total > 0 ? Math.round((insights.shiftBreakdown.days / counts.total) * 100) : 0}%
              </p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {insights.shiftBreakdown.evenings}
              </div>
              <p className="text-sm text-gray-600">Evening Shift</p>
              <p className="text-xs text-gray-500 mt-1">
                {counts.total > 0 ? Math.round((insights.shiftBreakdown.evenings / counts.total) * 100) : 0}%
              </p>
            </div>

            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {insights.shiftBreakdown.nights}
              </div>
              <p className="text-sm text-gray-600">Night Shift</p>
              <p className="text-xs text-gray-500 mt-1">
                {counts.total > 0 ? Math.round((insights.shiftBreakdown.nights / counts.total) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Your Impact:</strong> With {counts.total} responses from across all shifts, 
              we can now run meaningful workload simulations to help optimize staffing ratios and 
              improve working conditions. The more data we collect, the more accurate our recommendations become!
            </p>
          </div>
        </div>
      )}

      {/* Thank You Section */}
      {counts.total > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8 text-center border border-indigo-100 mb-12">
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

      {/* How It Works Section */}
      <div className="bg-blue-50 rounded-lg p-8 mb-12">
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

      {/* Admin Access Section */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
        <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Administrator Access</h3>
        <p className="text-gray-600 mb-6">
          Detailed results analysis and simulation tools are available to authorized personnel
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            to="/results"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
          >
            <Lock className="h-4 w-4 mr-2" />
            Admin Login
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Contact your system administrator for access credentials
        </p>
      </div>
    </div>
  );
};

export default Dashboard;