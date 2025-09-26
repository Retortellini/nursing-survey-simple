// src/components/Results.tsx
import React, { useState, useEffect } from 'react';
import { getSurveyResults, getSurveyCounts } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Clock, Filter } from 'lucide-react';

const Results = () => {
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [counts, setCounts] = useState({ rn: 0, cna: 0, total: 0 });
  const [filters, setFilters] = useState({
    surveyType: 'all',
    shift: 'all'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filterObj = {};
      if (filters.surveyType !== 'all') filterObj.surveyType = filters.surveyType;
      if (filters.shift !== 'all') filterObj.shift = filters.shift;

      const [responsesData, countsData] = await Promise.all([
        getSurveyResults(filterObj),
        getSurveyCounts()
      ]);

      setResponses(responsesData);
      setCounts(countsData);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskAverages = () => {
    const taskData = {};

    responses.forEach(response => {
      if (!response.responses) return;

      Object.entries(response.responses).forEach(([taskName, taskInfo]: [string, any]) => {
        if (!taskData[taskName]) {
          taskData[taskName] = { minTimes: [], maxTimes: [], count: 0 };
        }
        
        if (taskInfo.minTime) taskData[taskName].minTimes.push(parseFloat(taskInfo.minTime));
        if (taskInfo.maxTime) taskData[taskName].maxTimes.push(parseFloat(taskInfo.maxTime));
        taskData[taskName].count++;
      });
    });

    return Object.entries(taskData).map(([name, data]: [string, any]) => ({
      name,
      avgMinTime: data.minTimes.length > 0 
        ? Math.round(data.minTimes.reduce((a, b) => a + b, 0) / data.minTimes.length) 
        : 0,
      avgMaxTime: data.maxTimes.length > 0 
        ? Math.round(data.maxTimes.reduce((a, b) => a + b, 0) / data.maxTimes.length) 
        : 0,
      count: data.count
    })).sort((a, b) => b.avgMaxTime - a.avgMaxTime);
  };

  const chartData = getTaskAverages();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Survey Results</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold mt-2">{counts.total}</p>
            </div>
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">RN Surveys</p>
              <p className="text-3xl font-bold mt-2">{counts.rn}</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CNA Surveys</p>
              <p className="text-3xl font-bold mt-2">{counts.cna}</p>
            </div>
            <Users className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Survey Type</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={filters.surveyType}
              onChange={(e) => setFilters({ ...filters, surveyType: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="rn">RN Only</option>
              <option value="cna">CNA Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Shift</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={filters.shift}
              onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
            >
              <option value="all">All Shifts</option>
              <option value="days">Days</option>
              <option value="evenings">Evenings</option>
              <option value="nights">Nights</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Time Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Average Task Times</h2>
        </div>

        {chartData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgMinTime" fill="#4F46E5" name="Avg Min Time (min)" />
                <Bar dataKey="avgMaxTime" fill="#10B981" name="Avg Max Time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No data available with current filters
          </div>
        )}
      </div>

      {/* Task Details Table */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">Task Details</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Task Name</th>
                <th className="text-right py-3 px-4">Avg Min (min)</th>
                <th className="text-right py-3 px-4">Avg Max (min)</th>
                <th className="text-right py-3 px-4">Responses</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((task, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{task.name}</td>
                  <td className="text-right py-3 px-4">{task.avgMinTime}</td>
                  <td className="text-right py-3 px-4">{task.avgMaxTime}</td>
                  <td className="text-right py-3 px-4">{task.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results;