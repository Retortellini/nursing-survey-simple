// src/components/RealtimeAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { 
  getActiveSessions, 
  getCompletionRates, 
  getDropoffAnalysis, 
  getResponseVelocity 
} from '../lib/supabase';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';

const RealtimeAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState({ rn: 0, cna: 0, total: 0 });
  const [completionRates, setCompletionRates] = useState([]);
  const [dropoffData, setDropoffData] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [selectedSurveyType, setSelectedSurveyType] = useState('all');
  const [timeRange, setTimeRange] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedSurveyType, timeRange, autoRefresh]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sessions, rates, dropoff, velocity] = await Promise.all([
        getActiveSessions(),
        getCompletionRates(timeRange),
        getDropoffAnalysis(selectedSurveyType === 'all' ? null : selectedSurveyType),
        getResponseVelocity(24)
      ]);

      setActiveSessions(sessions);
      setCompletionRates(rates);
      setDropoffData(dropoff);
      setVelocityData(velocity);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallCompletionRate = () => {
    if (completionRates.length === 0) return 0;
    const total = completionRates.reduce((sum, r) => sum + Number(r.total_started), 0);
    const completed = completionRates.reduce((sum, r) => sum + Number(r.total_completed), 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getAvgCompletionTime = () => {
    if (completionRates.length === 0) return 0;
    const times = completionRates.map(r => Number(r.avg_completion_time_minutes)).filter(t => t > 0);
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  if (loading && completionRates.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics</h1>
          <p className="text-gray-600 mt-1">Live survey metrics and performance tracking</p>
        </div>
        
        <div className="flex gap-4">
          <select
            className="p-2 border rounded-lg"
            value={selectedSurveyType}
            onChange={(e) => setSelectedSurveyType(e.target.value)}
          >
            <option value="all">All Surveys</option>
            <option value="rn">RN Only</option>
            <option value="cna">CNA Only</option>
          </select>

          <select
            className="p-2 border rounded-lg"
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="mr-2"
          />
          Auto-refresh every 30 seconds
        </label>
        {autoRefresh && <Activity className="h-4 w-4 text-green-500 animate-pulse" />}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold mt-2">{activeSessions.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                RN: {activeSessions.rn} | CNA: {activeSessions.cna}
              </p>
            </div>
            <Activity className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold mt-2">{getOverallCompletionRate()}%</p>
              <p className="text-xs text-gray-500 mt-1">Last {timeRange} days</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Completion Time</p>
              <p className="text-3xl font-bold mt-2">{getAvgCompletionTime()}</p>
              <p className="text-xs text-gray-500 mt-1">minutes</p>
            </div>
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold mt-2">
                {completionRates.reduce((sum, r) => sum + Number(r.total_completed), 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last {timeRange} days</p>
            </div>
            <TrendingUp className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Response Velocity Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Response Velocity (Last 24 Hours)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rn" 
                stroke="#4F46E5" 
                strokeWidth={2}
                name="RN Surveys"
              />
              <Line 
                type="monotone" 
                dataKey="cna" 
                stroke="#10B981" 
                strokeWidth={2}
                name="CNA Surveys"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion Rates by Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Completion Rates by Survey Type</h2>
          <div className="space-y-4">
            {completionRates.map((rate, idx) => (
              <div key={idx} className="border-l-4 border-indigo-500 pl-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold uppercase">{rate.survey_type}</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {rate.completion_rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${rate.completion_rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>{rate.total_completed} completed</span>
                  <span>{rate.total_started} started</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Completion Time Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionRates.map(r => ({
                    name: r.survey_type.toUpperCase(),
                    value: Number(r.avg_completion_time_minutes)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}m`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionRates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <h2 className="text-lg font-semibold">Drop-off Analysis by Step</h2>
        </div>
        
        {dropoffData.length > 0 ? (
          <>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropoffData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step_name" fontSize={12} angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entered_count" fill="#4F46E5" name="Entered" />
                  <Bar dataKey="completed_count" fill="#10B981" name="Completed" />
                  <Bar dataKey="dropped_count" fill="#EF4444" name="Dropped" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Step</th>
                    <th className="text-right py-3 px-4">Entered</th>
                    <th className="text-right py-3 px-4">Completed</th>
                    <th className="text-right py-3 px-4">Dropped</th>
                    <th className="text-right py-3 px-4">Drop Rate</th>
                    <th className="text-right py-3 px-4">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dropoffData.map((step, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-semibold">Step {step.step_number}:</span> {step.step_name}
                      </td>
                      <td className="text-right py-3 px-4">{step.entered_count}</td>
                      <td className="text-right py-3 px-4 text-green-600">{step.completed_count}</td>
                      <td className="text-right py-3 px-4 text-red-600">{step.dropped_count}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`px-2 py-1 rounded ${
                          Number(step.drop_rate) < 10 ? 'bg-green-100 text-green-800' :
                          Number(step.drop_rate) < 25 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {step.drop_rate}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        {Math.round(Number(step.avg_time_seconds))}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No drop-off data available yet. Data will appear once surveys are started.
          </div>
        )}
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-3">📊 Insights & Recommendations</h3>
        <ul className="space-y-2 text-sm">
          {getOverallCompletionRate() < 70 && (
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <span>Completion rate is below 70%. Consider simplifying the survey or reducing the number of questions.</span>
            </li>
          )}
          {dropoffData.some(s => Number(s.drop_rate) > 30) && (
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">⚠️</span>
              <span>High drop-off detected at specific steps. Review question clarity and reduce complexity.</span>
            </li>
          )}
          {getAvgCompletionTime() > 15 && (
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">💡</span>
              <span>Average completion time exceeds 15 minutes. Consider breaking into shorter sections or adding progress indicators.</span>
            </li>
          )}
          {activeSessions.total > 10 && (
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>High engagement! {activeSessions.total} users are currently taking surveys.</span>
            </li>
          )}
          {completionRates.length > 0 && completionRates.every(r => Number(r.completion_rate) > 80) && (
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Excellent completion rates across all survey types!</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RealtimeAnalytics;