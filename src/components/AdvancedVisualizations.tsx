// src/components/AdvancedVisualizations.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { getSurveyResults } from '../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Palette,
  Download,
  TrendingUp,
  Grid,
  Network,
  Activity,
  FileText
} from 'lucide-react';

const AdvancedVisualizations = () => {
  const [loading, setLoading] = useState(false);
  const [surveyData, setSurveyData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [flowData, setFlowData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  
  const [activeTab, setActiveTab] = useState('heatmap');
  const [heatmapGroupBy, setHeatmapGroupBy] = useState('shift');
  const [selectedTask, setSelectedTask] = useState('Medication Administration');
  const [trendMetric, setTrendMetric] = useState('avg_completion_time');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (surveyData.length > 0) {
      processVisualizations();
    }
  }, [surveyData, heatmapGroupBy, selectedTask, trendMetric]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSurveyResults({});
      setSurveyData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processVisualizations = () => {
    generateHeatmapData();
    generateFlowData();
    generateDistributionData();
    generateTrendData();
  };

  const generateHeatmapData = () => {
    const taskTimes = {};
    
    surveyData.forEach(response => {
      if (!response.responses) return;
      
      const groupValue = getGroupValue(response, heatmapGroupBy);
      if (!groupValue) return;

      Object.entries(response.responses).forEach(([taskName, taskInfo]) => {
        if (!taskInfo.minTime || !taskInfo.maxTime) return;
        
        const avgTime = (parseFloat(taskInfo.minTime) + parseFloat(taskInfo.maxTime)) / 2;
        const key = `${groupValue}_${taskName}`;
        
        if (!taskTimes[key]) {
          taskTimes[key] = {
            x_label: groupValue,
            y_label: taskName,
            values: [],
            count: 0
          };
        }
        
        taskTimes[key].values.push(avgTime);
        taskTimes[key].count++;
      });
    });

    const heatmapResult = Object.values(taskTimes).map(item => ({
      x_label: item.x_label,
      y_label: item.y_label,
      value: Math.round(item.values.reduce((a, b) => a + b, 0) / item.values.length),
      count: item.count
    }));

    setHeatmapData(heatmapResult);
  };

  const generateFlowData = () => {
    const taskCategories = {
      'Clinical Tasks': ['Medication Administration', 'Assessment & Documentation', 'Wound Care', 'IV Management', 'Blood Administration'],
      'Patient Care': ['Patient Education', 'Patient Hygiene', 'Ambulation', 'Feeding Assistance'],
      'Monitoring': ['Vital Signs', 'I&O Monitoring', 'Safety Rounds'],
      'Communication': ['Handoff/Report', 'Family Communication', 'M.D. Rounds']
    };

    const categoryTimes = {};
    let totalTime = 0;

    surveyData.forEach(response => {
      if (!response.responses) return;

      Object.entries(response.responses).forEach(([taskName, taskInfo]) => {
        if (!taskInfo.maxTime) return;
        
        const maxTime = parseFloat(taskInfo.maxTime);
        totalTime += maxTime;

        // Find category for task
        let category = 'Other';
        Object.entries(taskCategories).forEach(([cat, tasks]) => {
          if (tasks.some(task => taskName.includes(task) || task.includes(taskName))) {
            category = cat;
          }
        });

        if (!categoryTimes[category]) {
          categoryTimes[category] = [];
        }
        categoryTimes[category].push(maxTime);
      });
    });

    const flowResult = Object.entries(categoryTimes).map(([category, times]) => ({
      source: 'Total Time',
      target: category,
      value: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    }));

    setFlowData(flowResult);
  };

  const generateDistributionData = () => {
    const taskTimes = [];
    
    surveyData.forEach(response => {
      if (!response.responses) return;
      
      Object.entries(response.responses).forEach(([taskName, taskInfo]) => {
        if (taskName === selectedTask && taskInfo.maxTime) {
          taskTimes.push(parseFloat(taskInfo.maxTime));
        }
      });
    });

    if (taskTimes.length === 0) {
      setDistributionData([]);
      return;
    }

    // Create time buckets
    const min = Math.min(...taskTimes);
    const max = Math.max(...taskTimes);
    const bucketSize = Math.ceil((max - min) / 6);
    
    const buckets = {};
    for (let i = 0; i < 6; i++) {
      const start = min + (i * bucketSize);
      const end = start + bucketSize;
      const label = `${start}-${end} min`;
      buckets[label] = 0;
    }

    taskTimes.forEach(time => {
      const bucketIndex = Math.min(Math.floor((time - min) / bucketSize), 5);
      const start = min + (bucketIndex * bucketSize);
      const end = start + bucketSize;
      const label = `${start}-${end} min`;
      buckets[label]++;
    });

    const distributionResult = Object.entries(buckets).map(([bucket, count]) => ({
      time_bucket: bucket,
      count: count,
      percentage: Math.round((count / taskTimes.length) * 100)
    }));

    setDistributionData(distributionResult);
  };

  const generateTrendData = () => {
    // Group responses by date
    const dailyData = {};
    
    surveyData.forEach(response => {
      const date = new Date(response.submitted_at).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date_bucket: date,
          survey_type: response.survey_type,
          completion_times: [],
          response_count: 0,
          quality_scores: []
        };
      }
      
      dailyData[date].response_count++;
      
      if (response.responses) {
        const taskTimes = Object.values(response.responses)
          .filter(task => task.maxTime)
          .map(task => parseFloat(task.maxTime));
        
        if (taskTimes.length > 0) {
          const avgTime = taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length;
          dailyData[date].completion_times.push(avgTime);
        }
      }
      
      // Mock quality score based on response completeness
      const completeness = response.responses ? Object.keys(response.responses).length : 0;
      const qualityScore = Math.min(100, completeness * 10);
      dailyData[date].quality_scores.push(qualityScore);
    });

    const trendResult = Object.values(dailyData).map(day => {
      let metricValue = 0;
      
      switch (trendMetric) {
        case 'avg_completion_time':
          metricValue = day.completion_times.length > 0 
            ? day.completion_times.reduce((a, b) => a + b, 0) / day.completion_times.length 
            : 0;
          break;
        case 'response_rate':
          metricValue = day.response_count;
          break;
        case 'quality_score':
          metricValue = day.quality_scores.length > 0
            ? day.quality_scores.reduce((a, b) => a + b, 0) / day.quality_scores.length
            : 0;
          break;
      }
      
      return {
        date_bucket: day.date_bucket,
        survey_type: day.survey_type,
        metric_value: Math.round(metricValue * 10) / 10,
        sample_size: day.response_count
      };
    }).sort((a, b) => new Date(a.date_bucket) - new Date(b.date_bucket));

    setTrendData(trendResult);
  };

  const getGroupValue = (response, groupBy) => {
    switch (groupBy) {
      case 'shift':
        return response.primary_shift || 'Unknown';
      case 'unit':
        return response.unit_type || 'Unknown';
      case 'experience':
        return response.experience_level || 'Unknown';
      default:
        return 'Unknown';
    }
  };

  const getHeatmapChart = () => {
    const grouped = {};
    heatmapData.forEach(item => {
      if (!grouped[item.y_label]) {
        grouped[item.y_label] = { task: item.y_label };
      }
      grouped[item.y_label][item.x_label] = item.value;
    });

    return Object.values(grouped);
  };

  const getUniqueXLabels = () => {
    return [...new Set(heatmapData.map(d => d.x_label))];
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const handleExport = (format) => {
    const exportData = {
      heatmap: heatmapData,
      flow: flowData,
      distribution: distributionData,
      trend: trendData
    };

    const dataToExport = exportData[activeTab];
    
    if (format === 'csv') {
      exportToCSV(dataToExport, `${activeTab}_data`);
    } else {
      exportToJSON(dataToExport, `${activeTab}_data`);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Get available tasks for distribution selector
  const getAvailableTasks = () => {
    const tasks = new Set();
    surveyData.forEach(response => {
      if (response.responses) {
        Object.keys(response.responses).forEach(task => tasks.add(task));
      }
    });
    return Array.from(tasks);
  };

  const availableTasks = getAvailableTasks();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (surveyData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Survey Data Available</h2>
          <p className="text-gray-500">Advanced visualizations will appear once survey responses are collected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Palette className="h-8 w-8 text-indigo-600" />
            Advanced Visualizations
          </h1>
          <p className="text-gray-600 mt-1">Interactive charts and visual analytics</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'heatmap' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <Grid className="inline h-4 w-4 mr-2" />
              Heat Map
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'flow' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <Network className="inline h-4 w-4 mr-2" />
              Task Flow
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'distribution' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <Activity className="inline h-4 w-4 mr-2" />
              Distribution
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'trends' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-2" />
              Trends
            </button>
          </nav>
        </div>
      </div>

      {/* Heat Map Tab */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Task Time Heat Map</h2>
              <select
                className="p-2 border rounded-lg"
                value={heatmapGroupBy}
                onChange={(e) => setHeatmapGroupBy(e.target.value)}
              >
                <option value="shift">By Shift</option>
                <option value="unit">By Unit</option>
                <option value="experience">By Experience</option>
              </select>
            </div>

            {heatmapData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getHeatmapChart()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Average Time (min)', position: 'bottom' }} />
                    <YAxis dataKey="task" type="category" width={150} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {getUniqueXLabels().map((label, idx) => (
                      <Bar 
                        key={label} 
                        dataKey={label} 
                        fill={COLORS[idx % COLORS.length]} 
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No heat map data available. Ensure survey responses include task timing data.
              </div>
            )}

            <p className="text-sm text-gray-600 mt-4">
              Longer bars indicate tasks taking more time. Compare across {heatmapGroupBy}s to identify patterns.
            </p>
          </div>

          {/* Detailed Table */}
          {heatmapData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Values</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">{heatmapGroupBy.charAt(0).toUpperCase() + heatmapGroupBy.slice(1)}</th>
                      <th className="text-left py-3 px-4">Task</th>
                      <th className="text-right py-3 px-4">Avg Time (min)</th>
                      <th className="text-right py-3 px-4">Sample Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.slice(0, 20).map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{item.x_label}</td>
                        <td className="py-3 px-4">{item.y_label}</td>
                        <td className="text-right py-3 px-4">
                          <span className={`font-semibold ${
                            item.value > 30 ? 'text-red-600' :
                            item.value > 15 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.value}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-sm text-gray-600">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Flow Tab */}
      {activeTab === 'flow' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Task Category Time Allocation</h2>
          
          {flowData.length > 0 ? (
            <>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flowData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="target" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4F46E5" name="Avg Time (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {flowData
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700">{item.target}</h4>
                      <p className="text-2xl font-bold text-indigo-600 mt-2">{Math.round(item.value)} min</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {Math.round((item.value / flowData.reduce((sum, d) => sum + d.value, 0)) * 100)}% of total time
                      </p>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No task flow data available. Complete more surveys to see time allocation patterns.
            </div>
          )}

          <p className="text-sm text-gray-600 mt-4">
            Shows how nursing time is allocated across different task categories based on survey responses.
          </p>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Time Distribution</h2>
              {availableTasks.length > 0 && (
                <select
                  className="p-2 border rounded-lg"
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                >
                  {availableTasks.map(task => (
                    <option key={task} value={task}>{task}</option>
                  ))}
                </select>
              )}
            </div>

            {distributionData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time_bucket" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4F46E5" name="Response Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="percentage"
                        nameKey="time_bucket"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ time_bucket, percentage }) => `${time_bucket}: ${percentage}%`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No distribution data available for "{selectedTask}". 
                {availableTasks.length === 0 ? " Complete surveys to see distribution data." : " Try selecting a different task."}
              </div>
            )}

            {distributionData.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Distribution Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Most Common</p>
                    <p className="text-lg font-bold text-blue-600">
                      {distributionData.length > 0 ? distributionData.reduce((max, d) => d.count > max.count ? d : max).time_bucket : '-'}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Responses</p>
                    <p className="text-lg font-bold text-green-600">
                      {distributionData.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Median Range</p>
                    <p className="text-lg font-bold text-purple-600">
                      {distributionData[Math.floor(distributionData.length / 2)]?.time_bucket || '-'}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Variability</p>
                    <p className="text-lg font-bold text-orange-600">
                      {distributionData.length > 4 ? 'High' : distributionData.length > 2 ? 'Medium' : 'Low'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Trend Analysis</h2>
              <select
                className="p-2 border rounded-lg"
                value={trendMetric}
                onChange={(e) => setTrendMetric(e.target.value)}
              >
                <option value="avg_completion_time">Avg Task Time</option>
                <option value="response_rate">Daily Responses</option>
                <option value="quality_score">Quality Score</option>
              </select>
            </div>

            {trendData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date_bucket" 
                      fontSize={12}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value) => [value, trendMetric === 'avg_completion_time' ? 'minutes' : trendMetric === 'response_rate' ? 'responses' : 'score']}
                    />
                    <Legend />
                    {[...new Set(trendData.map(d => d.survey_type))].map((type, idx) => (
                      <Line
                        key={type}
                        type="monotone"
                        dataKey="metric_value"
                        data={trendData.filter(d => d.survey_type === type)}
                        stroke={COLORS[idx]}
                        strokeWidth={2}
                        name={type.toUpperCase()}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No trend data available. Collect responses over multiple days to see trends.
              </div>
            )}

            {trendData.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...new Set(trendData.map(d => d.survey_type))].map((type) => {
                  const typeData = trendData.filter(d => d.survey_type === type).sort((a, b) => new Date(b.date_bucket) - new Date(a.date_bucket));
                  const latest = typeData[0]?.metric_value || 0;
                  const previous = typeData[1]?.metric_value || 0;
                  const change = latest - previous;
                  const changePercent = previous > 0 ? (change / previous * 100) : 0;

                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 uppercase">{type}</h4>
                      <p className="text-2xl font-bold text-indigo-600 mt-2">{latest.toFixed(1)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-600">vs previous</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">📈 Trend Insights</h3>
            <ul className="space-y-2 text-sm">
              {trendData.length > 0 && (
                <>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>
                      Data tracked over {[...new Set(trendData.map(d => d.date_bucket))].length} days
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>
                      Total sample size: {trendData.reduce((sum, d) => sum + d.sample_size, 0)} responses
                    </span>
                  </li>
                  {trendMetric === 'avg_completion_time' && (
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>
                        Task time trends help identify workload patterns and training opportunities
                      </span>
                    </li>
                  )}
                  {trendMetric === 'response_rate' && (
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>
                        Response rate trends indicate survey engagement and data collection patterns
                      </span>
                    </li>
                  )}
                  {trendMetric === 'quality_score' && (
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>
                        Quality scores based on response completeness and consistency
                      </span>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Overall Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-3">📊 Visualization Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2 text-indigo-800">Data Summary:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Processing {surveyData.length} survey responses</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Available tasks: {availableTasks.length} unique tasks</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Survey types: {[...new Set(surveyData.map(s => s.survey_type))].join(', ')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Date range: {surveyData.length > 0 ? `${new Date(Math.min(...surveyData.map(s => new Date(s.submitted_at)))).toLocaleDateString()} - ${new Date(Math.max(...surveyData.map(s => new Date(s.submitted_at)))).toLocaleDateString()}` : 'N/A'}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-purple-800">Usage Tips:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Use heat maps to identify workload patterns across groups</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Task flow shows time allocation across nursing activities</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Distribution analysis helps understand task time variability</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Trends reveal patterns and changes over time</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Export data for further analysis in external tools</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  function getYAxisLabel() {
    if (trendMetric === 'avg_completion_time') return 'Average Task Time (min)';
    if (trendMetric === 'response_rate') return 'Daily Responses';
    return 'Quality Score';
  }
};

export default AdvancedVisualizations;