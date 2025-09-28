// src/components/DataQuality.tsx
import React, { useState, useEffect } from 'react';
import {
  getDataQualitySummary,
  getOutliers,
  getSuspiciousResponses,
  getFlaggedResponses,
  updateQualityScores,
  getQualityDistribution
} from '../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Flag,
  Eye
} from 'lucide-react';

const DataQuality = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [outliers, setOutliers] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [timeRange, setTimeRange] = useState(7);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

const fetchAllData = async () => {
  setLoading(true);
  try {
    // Add a small delay to ensure database updates are committed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const [summaryData, outliersData, suspiciousData, flaggedData, distributionData] = await Promise.all([
      getDataQualitySummary(timeRange),
      getOutliers(),
      getSuspiciousResponses(),
      getFlaggedResponses(20),
      getQualityDistribution()
    ]);

    console.log('Fetched data:', {
      summary: summaryData,
      outliers: outliersData?.length || 0,
      suspicious: suspiciousData?.length || 0,
      flagged: flaggedData?.length || 0
    });

    setSummary(summaryData);
    setOutliers(outliersData || []);
    setSuspicious(suspiciousData || []);
    setFlagged(flaggedData || []);
    setDistribution(distributionData);
    
  } catch (error) {
    console.error('Error fetching quality data:', error);
    
    // If there's an error, try to fetch basic data
    try {
      const basicSummary = await getDataQualitySummary(timeRange);
      setSummary(basicSummary);
    } catch (fallbackError) {
      console.error('Fallback fetch also failed:', fallbackError);
    }
  } finally {
    setLoading(false);
  }
};

// Updated handleUpdateScores function in src/components/DataQuality.tsx
// Replace the existing handleUpdateScores function with this implementation
const handleUpdateScores = async () => {
  setUpdating(true);
  try {
    console.log('Starting quality score update...');
    
    // Run the quality score update
    const result = await updateQualityScores();
    
    console.log('Quality scores update result:', result);
    
    // Force refresh ALL data after successful update
    // This ensures the cards show the new outlier counts
    await fetchAllData();
    
    // Show detailed success message
    let successMessage = `Quality scores updated successfully!\n\n`;
    successMessage += `✅ Updated ${result.updated_count} responses\n`;
    
    if (result.outliers_detected) {
      successMessage += `🚨 Detected ${result.outliers_detected} total outliers\n`;
    }
    
    if (result.critical_outliers) {
      successMessage += `⚠️  Found ${result.critical_outliers} critical outliers\n`;
    }
    
    if (result.flagged_for_review) {
      successMessage += `🔍 Flagged ${result.flagged_for_review} responses for review\n`;
    }
    
    successMessage += `\nThe dashboard has been refreshed with updated data.`;
    
    alert(successMessage);
    
  } catch (error) {
    console.error('Error updating scores:', error);
    
    let errorMessage = 'Error updating quality scores:\n\n';
    
    if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'An unexpected error occurred. Please check the browser console for details.';
    }
    
    errorMessage += '\n\nPossible solutions:\n';
    errorMessage += '• Check your internet connection\n';
    errorMessage += '• Refresh the page and try again\n';
    errorMessage += '• Contact support if the issue persists';
    
    alert(errorMessage);
  } finally {
    setUpdating(false);
  }
};

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score) => {
    if (score >= 80) return { text: 'High Quality', class: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'Medium Quality', class: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low Quality', class: 'bg-red-100 text-red-800' };
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  const qualityChartData = summary ? [
    { name: 'High Quality', value: Number(summary.high_quality_count), color: '#10B981' },
    { name: 'Medium Quality', value: Number(summary.medium_quality_count), color: '#F59E0B' },
    { name: 'Low Quality', value: Number(summary.low_quality_count), color: '#EF4444' }
  ] : [];

  const distributionChartData = distribution ? [
    { quality: 'High (80-100)', RN: distribution.high.rn, CNA: distribution.high.cna },
    { quality: 'Medium (60-79)', RN: distribution.medium.rn, CNA: distribution.medium.cna },
    { quality: 'Low (<60)', RN: distribution.low.rn, CNA: distribution.low.cna }
  ] : [];

  if (loading && !summary) {
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
          <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and validate survey response quality</p>
        </div>

        <div className="flex gap-4">
          <select
            className="p-2 border rounded-lg"
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <button
            onClick={handleUpdateScores}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update Scores'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Quality Score</p>
              <p className={`text-3xl font-bold mt-2 ${getQualityColor(summary?.avg_quality_score || 0)}`}>
                {Math.round(summary?.avg_quality_score || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Out of 100</p>
            </div>
            <Shield className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Quality Responses</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {summary?.high_quality_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Score ≥ 80</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged for Review</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {summary?.flagged_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </div>
            <Flag className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outliers Detected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {Math.round(summary?.outlier_percentage || 0)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Statistical outliers</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Quality Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quality Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {qualityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality by Survey Type */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quality by Survey Type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quality" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="RN" fill="#4F46E5" />
                <Bar dataKey="CNA" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Outliers Table */}
      {outliers.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-semibold">Detected Outliers</h2>
            <span className="text-sm text-gray-500">({outliers.length} tasks flagged)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Task Name</th>
                  <th className="text-right py-3 px-4">Reported Time</th>
                  <th className="text-right py-3 px-4">Average Time</th>
                  <th className="text-right py-3 px-4">Std Dev</th>
                  <th className="text-right py-3 px-4">Z-Score</th>
                  <th className="text-right py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {outliers.slice(0, 10).map((outlier, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{outlier.task_name}</td>
                    <td className="text-right py-3 px-4">{Math.round(outlier.reported_time)} min</td>
                    <td className="text-right py-3 px-4">{Math.round(outlier.avg_time)} min</td>
                    <td className="text-right py-3 px-4">{Math.round(outlier.std_dev)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={`font-semibold ${Math.abs(outlier.z_score) > 4 ? 'text-red-600' : 'text-orange-600'}`}>
                        {outlier.z_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                        Outlier
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {outliers.length > 10 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing 10 of {outliers.length} outliers. Update scores to see all.
            </p>
          )}
        </div>
      )}

      {/* Suspicious Responses */}
      {suspicious.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Flag className="h-6 w-6 text-orange-500" />
            <h2 className="text-lg font-semibold">Suspicious Response Patterns</h2>
            <span className="text-sm text-gray-500">({suspicious.length} flagged)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Response ID</th>
                  <th className="text-left py-3 px-4">Suspicion Type</th>
                  <th className="text-right py-3 px-4">Confidence</th>
                  <th className="text-left py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {suspicious.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      {item.response_id?.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        {item.suspicion_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`font-semibold ${
                        item.confidence >= 0.8 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flagged Responses for Review */}
      {flagged.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-semibold">Responses Flagged for Review</h2>
            <span className="text-sm text-gray-500">({flagged.length} responses)</span>
          </div>

          <div className="space-y-4">
            {flagged.map((response, idx) => {
              const badge = getQualityBadge(response.quality_score);
              return (
                <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded text-sm ${badge.class}`}>
                          {badge.text}
                        </span>
                        <span className="text-sm font-medium uppercase text-gray-600">
                          {response.survey_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(response.submitted_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Quality Score</p>
                          <p className={`text-lg font-bold ${getQualityColor(response.quality_score)}`}>
                            {Math.round(response.quality_score)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Issues Found</p>
                          <p className="text-lg font-bold">
                            {(response.outlier_flags?.length || 0) + (response.validation_warnings?.length || 0)}
                          </p>
                        </div>
                      </div>

                      {response.validation_warnings && response.validation_warnings.length > 0 && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-sm font-medium text-yellow-800 mb-2">Validation Warnings:</p>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            {response.validation_warnings.slice(0, 3).map((warning, i) => (
                              <li key={i}>• {warning.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {response.outlier_flags && response.outlier_flags.length > 0 && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm font-medium text-red-800 mb-2">Outlier Tasks:</p>
                          <div className="flex flex-wrap gap-2">
                            {response.outlier_flags.slice(0, 5).map((flag, i) => (
                              <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                {flag.task}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quality Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-3">📊 Data Quality Insights</h3>
        <ul className="space-y-2 text-sm">
          {summary && summary.avg_quality_score >= 80 && (
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Excellent overall data quality with an average score of {Math.round(summary.avg_quality_score)}!</span>
            </li>
          )}
          {summary && summary.avg_quality_score < 70 && (
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <span>Average quality score is below 70. Review flagged responses and consider adjusting survey questions for clarity.</span>
            </li>
          )}
          {summary && Number(summary.outlier_percentage) > 15 && (
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">⚠️</span>
              <span>High percentage of outliers ({Math.round(summary.outlier_percentage)}%). This may indicate confusion about time reporting or data entry errors.</span>
            </li>
          )}
          {summary && Number(summary.suspicious_percentage) > 10 && (
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <span>Suspicious response patterns detected ({Math.round(summary.suspicious_percentage)}%). Review for potential spam or rushed submissions.</span>
            </li>
          )}
          {outliers.length > 0 && (
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">💡</span>
              <span>Most common outlier tasks: {outliers.slice(0, 3).map(o => o.task_name).join(', ')}. Consider providing clearer time estimation guidance.</span>
            </li>
          )}
          {summary && summary.high_quality_count > summary.low_quality_count * 3 && (
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Majority of responses are high quality. Your survey design is working well!</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DataQuality;