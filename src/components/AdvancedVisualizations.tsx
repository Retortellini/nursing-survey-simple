// src/components/AdvancedVisualizations.tsx
import React, { useState, useEffect } from 'react';
import {
  getHeatmapData,
  getTaskFlowData,
  getTimeDistribution,
  getTrendData,
  exportToCSV,
  exportToJSON
} from '../lib/supabase';
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
  Grid3x3,
  Network,
  Activity,
  FileText
} from 'lucide-react';

const AdvancedVisualizations = () => {
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [flowData, setFlowData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  
  const [activeTab, setActiveTab] = useState('heatmap');
  const [heatmapGroupBy, setHeatmapGroupBy] = useState('shift');
  const [selectedTask, setSelectedTask] = useState('Medication Administration');
  const [trendMetric, setTrendMetric] = useState('avg_completion_time');

  useEffect(() => {
    loadVisualizations();
  }, [heatmapGroupBy, selectedTask, trendMetric]);

  const loadVisualizations = async () => {
    setLoading(true);
    try {
      const [heatmap, flow, distribution, trend] = await Promise.all([
        getHeatmapData(heatmapGroupBy),
        getTaskFlowData(),
        getTimeDistribution(selectedTask),
        getTrendData(trendMetric)
      ]);

      setHeatmapData(heatmap);
      setFlowData(flow);
      setDistributionData(distribution);
      setTrendData(trend);
    } catch (error) {
      console.error('Error loading visualizations:', error);
    } finally {
      setLoading(false);
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

    if (format === 'csv') {
      exportToCSV(exportData[activeTab], `${activeTab}_data`);
    } else {
      exportToJSON(exportData[activeTab], `${activeTab}_data`);
    }
  };

  if (loading && heatmapData.length === 0) {
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
              <Grid3x3 className="inline h-4 w-4 mr-2" />
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

            <p className="text-sm text-gray-600 mt-4">
              Darker/longer bars indicate tasks taking more time. Compare across {heatmapGroupBy}s.
            </p>
          </div>

          {/* Detailed Table */}
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
        </div>
      )}

      {/* Task Flow Tab (Sankey-style) */}
      {activeTab === 'flow' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Task Time Flow</h2>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData.filter(d => d.source === 'Total Time')} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="target" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" name="Time Allocation (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Shows how total shift time flows into different task categories. Each category breaks down into specific tasks.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {flowData
              .filter(d => d.source === 'Total Time')
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)
              .map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700">{item.target}</h4>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">{Math.round(item.value)} min</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.round((item.value / flowData.filter(d => d.source === 'Total Time').reduce((sum, d) => sum + d.value, 0)) * 100)}% of total time
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Time Distribution</h2>
              <select
                className="p-2 border rounded-lg"
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
              >
                <option value="Medication Administration">Medication Administration</option>
                <option value="Assessment & Documentation">Assessment & Documentation</option>
                <option value="Wound Care">Wound Care</option>
                <option value="Patient Hygiene">Patient Hygiene</option>
                <option value="Vital Signs">Vital Signs</option>
              </select>
            </div>

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
                    {distributionData.length > 0 ? (distributionData.length > 4 ? 'High' : distributionData.length > 2 ? 'Medium' : 'Low') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Trend Analysis (Last 30 Days)</h2>
              <select
                className="p-2 border rounded-lg"
                value={trendMetric}
                onChange={(e) => setTrendMetric(e.target.value)}
              >
                <option value="avg_completion_time">Avg Completion Time</option>
                <option value="response_rate">Response Rate</option>
                <option value="quality_score">Quality Score</option>
              </select>
            </div>

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
                    formatter={(value) => [value, trendMetric === 'avg_completion_time' ? 'minutes' : trendMetric === 'response_rate' ? '%' : 'score']}
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

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...new Set(trendData.map(d => d.survey_type))].map((type) => {
                const typeData = trendData.filter(d => d.survey_type === type);
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
                        Lower completion times may indicate improved survey design or user familiarity
                      </span>
                    </li>
                  )}
                  {trendMetric === 'response_rate' && (
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>
                        Higher response rates indicate better engagement and survey accessibility
                      </span>
                    </li>
                  )}
                  {trendMetric === 'quality_score' && (
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">💡</span>
                      <span>
                        Quality scores above 80 indicate reliable, high-quality data for simulations
                      </span>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  function getYAxisLabel() {
    if (trendMetric === 'avg_completion_time') return 'Completion Time (min)';
    if (trendMetric === 'response_rate') return 'Response Rate (%)';
    return 'Quality Score';
  }
};

export default AdvancedVisualizations;