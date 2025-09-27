// src/components/ComparativeAnalytics.tsx
import React, { useState, useEffect } from 'react';
import {
  compareByShift,
  compareByExperience,
  compareByUnit,
  compareRnVsCna,
  getPerformanceRanking,
  identifyBestPractices,
  getWorkloadIntensity,
  getComparisonGroups
} from '../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Award,
  Users,
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const ComparativeAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [comparisonType, setComparisonType] = useState('shift');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [shiftData, setShiftData] = useState([]);
  const [experienceData, setExperienceData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [rnVsCnaData, setRnVsCnaData] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [bestPractices, setBestPractices] = useState([]);
  const [workloadIntensity, setWorkloadIntensity] = useState([]);
  const [availableGroups, setAvailableGroups] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedGroup && comparisonType) {
      fetchRankingData();
    }
  }, [selectedGroup, comparisonType]);

  useEffect(() => {
    if (selectedTask) {
      fetchBestPractices();
    }
  }, [selectedTask]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [shift, experience, unit, rnCna, intensity, groups] = await Promise.all([
        compareByShift(),
        compareByExperience(),
        compareByUnit(),
        compareRnVsCna(),
        getWorkloadIntensity(),
        getComparisonGroups()
      ]);

      setShiftData(shift);
      setExperienceData(experience);
      setUnitData(unit);
      setRnVsCnaData(rnCna);
      setWorkloadIntensity(intensity);
      setAvailableGroups(groups);

      // Set defaults
      if (groups.shifts.length > 0 && !selectedGroup) {
        setSelectedGroup(groups.shifts[0]);
      }
    } catch (error) {
      console.error('Error fetching comparative data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankingData = async () => {
    try {
      const ranking = await getPerformanceRanking(comparisonType, selectedGroup);
      setRankingData(ranking);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    }
  };

  const fetchBestPractices = async () => {
    try {
      const practices = await identifyBestPractices(selectedTask);
      setBestPractices(practices);
    } catch (error) {
      console.error('Error fetching best practices:', error);
    }
  };

  const getCurrentComparisonData = () => {
    switch (comparisonType) {
      case 'shift':
        return shiftData;
      case 'experience':
        return experienceData;
      case 'unit':
        return unitData;
      default:
        return [];
    }
  };

  const getChartData = () => {
    const data = getCurrentComparisonData();
    const grouped = {};

    data.forEach(item => {
      const key = item.shift_type || item.experience_level || item.unit_type;
      if (!grouped[key]) {
        grouped[key] = { name: key };
      }
      grouped[key][item.task_name] = Number(item.avg_max_time);
    });

    return Object.values(grouped);
  };

  const getTopTasks = () => {
    const data = getCurrentComparisonData();
    const taskTotals = {};

    data.forEach(item => {
      const task = item.task_name;
      if (!taskTotals[task]) {
        taskTotals[task] = 0;
      }
      taskTotals[task] += Number(item.avg_max_time);
    });

    return Object.entries(taskTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name]) => name);
  };

  const getWorkloadChart = () => {
    return workloadIntensity.map(w => ({
      name: `${w.group_type}: ${w.group_value}`,
      intensity: Number(w.workload_intensity_score),
      tasks: w.task_count
    }));
  };

  const getPerformanceColor = (level) => {
    const colors = {
      'Excellent': 'text-green-600 bg-green-50',
      'Good': 'text-blue-600 bg-blue-50',
      'Average': 'text-yellow-600 bg-yellow-50',
      'Needs Improvement': 'text-red-600 bg-red-50'
    };
    return colors[level] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const topTasks = getTopTasks();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Comparative Analytics</h1>
          <p className="text-gray-600 mt-1">Benchmark performance across shifts, units, and experience levels</p>
        </div>

        <button
          onClick={fetchAllData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Comparison Type Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold">Comparison Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Compare By</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={comparisonType}
              onChange={(e) => {
                setComparisonType(e.target.value);
                setSelectedGroup(null);
                setRankingData([]);
              }}
            >
              <option value="shift">Shift Type</option>
              <option value="experience">Experience Level</option>
              <option value="unit">Unit Type</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Group</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedGroup || ''}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">Select your group...</option>
              {comparisonType === 'shift' && availableGroups?.shifts.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
              {comparisonType === 'experience' && availableGroups?.experiences.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
              {comparisonType === 'unit' && availableGroups?.units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Groups Analyzed</p>
              <p className="text-3xl font-bold mt-2">
                {comparisonType === 'shift' ? availableGroups?.shifts.length :
                 comparisonType === 'experience' ? availableGroups?.experiences.length :
                 availableGroups?.units.length}
              </p>
            </div>
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasks Compared</p>
              <p className="text-3xl font-bold mt-2">{topTasks.length}</p>
            </div>
            <BarChart3 className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Ranking</p>
              <p className="text-3xl font-bold mt-2">
                {rankingData.length > 0 ? 
                  Math.round(rankingData.reduce((sum, r) => sum + Number(r.percentile_rank), 0) / rankingData.length) : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Percentile</p>
            </div>
            <Award className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Time Difference</p>
              <p className="text-3xl font-bold mt-2">
                {rankingData.length > 0 ? 
                  Math.round(rankingData.reduce((sum, r) => sum + (Number(r.your_avg_time) - Number(r.overall_avg_time)), 0) / rankingData.length) : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">minutes vs avg</p>
            </div>
            <Clock className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Task Time Comparison by {comparisonType}</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis label={{ value: 'Average Time (minutes)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {topTasks.slice(0, 5).map((task, idx) => (
                <Bar 
                  key={task} 
                  dataKey={task} 
                  fill={`hsl(${220 + idx * 40}, 70%, 50%)`}
                  onClick={() => setSelectedTask(task)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Click on a bar to see best practices for that task
        </p>
      </div>

      {/* RN vs CNA Comparison */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">RN vs CNA Task Times</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Task Name</th>
                <th className="text-right py-3 px-4">RN Avg Time</th>
                <th className="text-right py-3 px-4">CNA Avg Time</th>
                <th className="text-right py-3 px-4">Difference</th>
                <th className="text-right py-3 px-4">Sample Sizes</th>
              </tr>
            </thead>
            <tbody>
              {rnVsCnaData.slice(0, 10).map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.task_name}</td>
                  <td className="text-right py-3 px-4">
                    {item.rn_avg_time ? `${Math.round(item.rn_avg_time)} min` : '-'}
                  </td>
                  <td className="text-right py-3 px-4">
                    {item.cna_avg_time ? `${Math.round(item.cna_avg_time)} min` : '-'}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`font-semibold ${
                      item.time_difference > 0 ? 'text-red-600' : 
                      item.time_difference < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {item.time_difference ? `${item.time_difference > 0 ? '+' : ''}${Math.round(item.time_difference)} min` : '-'}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-600">
                    RN: {item.rn_count || 0} | CNA: {item.cna_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Ranking */}
      {rankingData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-semibold">Your Performance Ranking</h2>
            <span className="text-sm text-gray-500">({selectedGroup})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Task Name</th>
                  <th className="text-right py-3 px-4">Your Time</th>
                  <th className="text-right py-3 px-4">Overall Avg</th>
                  <th className="text-right py-3 px-4">Percentile</th>
                  <th className="text-right py-3 px-4">Performance</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((rank, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{rank.task_name}</td>
                    <td className="text-right py-3 px-4">{Math.round(rank.your_avg_time)} min</td>
                    <td className="text-right py-3 px-4">{Math.round(rank.overall_avg_time)} min</td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-indigo-600">
                        {Math.round(rank.percentile_rank)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`px-3 py-1 rounded text-sm ${getPerformanceColor(rank.performance_level)}`}>
                        {rank.performance_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Best Practices */}
      {bestPractices.length > 0 && selectedTask && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold">Best Practices for: {selectedTask}</h2>
          </div>

          <div className="space-y-4">
            {bestPractices.map((practice, idx) => (
              <div key={idx} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-800">
                    {practice.characteristic}: {practice.top_performer_value}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    practice.confidence_level === 'High' ? 'bg-green-100 text-green-800' :
                    practice.confidence_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {practice.confidence_level} Confidence
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Top Performers</p>
                    <p className="font-bold text-green-700">{Math.round(practice.avg_time_top)} min</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Others</p>
                    <p className="font-bold text-gray-700">{Math.round(practice.avg_time_others)} min</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Savings</p>
                    <p className="font-bold text-indigo-700">{Math.round(practice.time_savings)} min</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Insight:</strong> Top performers save an average of{' '}
              {Math.round(bestPractices.reduce((sum, p) => sum + Number(p.time_savings), 0) / bestPractices.length)} minutes
              per task. Consider adopting their practices!
            </p>
          </div>
        </div>
      )}

      {/* Workload Intensity */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold">Workload Intensity Index</h2>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getWorkloadChart()} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} fontSize={12} />
              <Tooltip />
              <Bar dataKey="intensity" fill="#4F46E5" name="Workload Intensity" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Workload Intensity = Average Task Time × Task Frequency. Higher scores indicate heavier workload.
        </p>
      </div>

      {/* Key Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">📊 Key Comparative Insights</h3>
        <ul className="space-y-2 text-sm">
          {rankingData.length > 0 && (
            <>
              {rankingData.filter(r => r.performance_level === 'Excellent').length > 0 && (
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>You excel at {rankingData.filter(r => r.performance_level === 'Excellent').length} tasks compared to peers!</span>
                </li>
              )}
              {rankingData.filter(r => r.performance_level === 'Needs Improvement').length > 0 && (
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">💡</span>
                  <span>
                    Focus improvement on: {rankingData.filter(r => r.performance_level === 'Needs Improvement').slice(0, 3).map(r => r.task_name).join(', ')}
                  </span>
                </li>
              )}
            </>
          )}
          {rnVsCnaData.length > 0 && (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">ℹ️</span>
              <span>
                Largest RN-CNA time difference: {rnVsCnaData[0]?.task_name} 
                ({Math.abs(Math.round(rnVsCnaData[0]?.time_difference))} min difference)
              </span>
            </li>
          )}
          {bestPractices.length > 0 && (
            <li className="flex items-start">
              <span className="text-green-600 mr-2">🌟</span>
              <span>
                Adopting best practices for {selectedTask} could save up to{' '}
                {Math.round(bestPractices[0]?.time_savings)} minutes per task
              </span>
            </li>
          )}
          {workloadIntensity.length > 0 && (
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <span>
                Highest workload intensity: {workloadIntensity[0]?.group_value} 
                (intensity score: {Math.round(workloadIntensity[0]?.workload_intensity_score)})
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ComparativeAnalytics;