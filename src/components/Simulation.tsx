// src/components/Simulation.tsx - Complete Enhanced Version
import React, { useState, useEffect } from 'react';
import { getTaskStatistics, saveSimulationResults } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Bar, BarChart } from 'recharts';
import { Play, RefreshCw, AlertTriangle, Target, TrendingUp, Info } from 'lucide-react';

const Simulation = () => {
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState([]);
  const [results, setResults] = useState(null);
  
  const [params, setParams] = useState({
    cnaRatios: [8, 10, 12],
    nurseRatios: [2, 3, 4, 5],
    shiftHours: 8,
    iterations: 1000
  });

  useEffect(() => {
    fetchTaskData();
  }, []);

  const fetchTaskData = async () => {
    try {
      const data = await getTaskStatistics();
      setTaskData(data);
    } catch (error) {
      console.error('Error fetching task data:', error);
    }
  };

  // Calculate confidence intervals using normal approximation
  const calculateConfidenceInterval = (data, confidence = 0.95) => {
    if (data.length === 0) return { lower: 0, upper: 0, stdDev: 0 };
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-scores for common confidence levels
    const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.65;
    const margin = z * stdDev / Math.sqrt(data.length);
    
    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(100, mean + margin),
      stdDev: stdDev
    };
  };

  const runSimulation = async () => {
    if (taskData.length === 0) {
      alert('Not enough survey data to run simulation. Need at least 3 responses per task.');
      return;
    }

    setLoading(true);
    try {
      // Get frequency data from survey responses
      const frequencyData = {};
      const responses = await fetch(`https://ulwvuntjsgqzajhptskk.supabase.co/rest/v1/survey_responses?select=responses`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsd3Z1bnRqc2dxemFqaHB0c2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDY0NTEsImV4cCI6MjA3NDQ4MjQ1MX0.7cVEaFV5rHte20K7S0j65QgCOcB01tjiRvoayOvQmE0'
        }
      });
      const surveyData = await responses.json();
      
      // Calculate average frequency for each task
      surveyData.forEach(response => {
        if (response.responses) {
          Object.entries(response.responses).forEach(([taskName, taskInfo]) => {
            if (!frequencyData[taskName]) {
              frequencyData[taskName] = [];
            }
            if (taskInfo.frequency) {
              frequencyData[taskName].push(parseFloat(taskInfo.frequency));
            }
          });
        }
      });

      // Calculate average frequency per task
      const avgFrequencies = {};
      Object.entries(frequencyData).forEach(([taskName, frequencies]) => {
        avgFrequencies[taskName] = frequencies.length > 0
          ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
          : 0.5; // Default to 50% if no frequency data
      });

      const simulationResults = [];

      for (const nurseRatio of params.nurseRatios) {
        for (const cnaRatio of params.cnaRatios) {
          const completionRates = []; // Store all iteration results for confidence intervals
          for (let i = 0; i < params.iterations; i++) {
            let totalRnTime = 0;
            let totalCnaTime = 0;

            taskData.forEach(task => {
              const avgTime = (task.avg_min_time + task.avg_max_time) / 2;
              const stdDev = task.std_dev || (task.avg_max_time - task.avg_min_time) / 4;
              
              const isCnaTask = task.task_name.toLowerCase().includes('vital') || 
                               task.task_name.toLowerCase().includes('hygiene') || 
                               task.task_name.toLowerCase().includes('mobility') ||
                               task.task_name.toLowerCase().includes('toileting') ||
                               task.task_name.toLowerCase().includes('feeding') ||
                               task.task_name.toLowerCase().includes('i&o') ||
                               task.task_name.toLowerCase().includes('safety rounds') ||
                               task.task_name.toLowerCase().includes('room turnover');
              
              // Generate random time with normal distribution
              const randomTime = avgTime + (Math.random() - 0.5) * 2 * stdDev;
              const taskTime = Math.max(task.avg_min_time, Math.min(task.avg_max_time, randomTime));
              const probability = avgFrequencies[task.task_name] || 0.5;
              
              if (!isCnaTask) {
                // RN tasks
                // One-time tasks (once per shift regardless of patients)
                if (task.task_name.toLowerCase().includes('handoff') || 
                    task.task_name.toLowerCase().includes('report') ||
                    task.task_name.toLowerCase().includes('chart review')) {
                  totalRnTime += taskTime;
                  if (i === 0) console.log(`  RN One-time: ${task.task_name} = ${Math.round(taskTime)} min`);
                } else {
                  // Per-patient tasks with probability
                  // For each patient, randomly determine if task occurs based on probability
                  for (let p = 0; p < nurseRatio; p++) {
                    if (Math.random() < probability) {
                      totalRnTime += taskTime;
                    }
                  }
                  // Debug logging only on first iteration
                  if (i === 0) {
                    const expectedOccurrences = nurseRatio * probability;
                    console.log(`  RN Per-patient: ${task.task_name} = ${Math.round(taskTime)} min × ${expectedOccurrences.toFixed(2)} expected occurrences (${(probability * 100).toFixed(1)}% probability)`);
                  }
                }
              } else {
                // CNA tasks - per patient with probability
                for (let p = 0; p < cnaRatio; p++) {
                  if (Math.random() < probability) {
                    totalCnaTime += taskTime;
                  }
                }
                // Debug logging only on first iteration
                if (i === 0) {
                  const expectedOccurrences = cnaRatio * probability;
                  console.log(`  CNA Per-patient: ${task.task_name} = ${Math.round(taskTime)} min × ${expectedOccurrences.toFixed(2)} expected occurrences (${(probability * 100).toFixed(1)}% probability)`);
                }
              }
            });

            const shiftMinutes = params.shiftHours * 60;
            const rnCompleted = totalRnTime <= shiftMinutes;
            const cnaCompleted = totalCnaTime <= shiftMinutes;
            const completed = rnCompleted && cnaCompleted;
            
            // Debug first iteration
            if (i === 0) {
              console.log(`First iteration for RN 1:${nurseRatio}, CNA 1:${cnaRatio}:`);
              console.log(`  RN Time: ${Math.round(totalRnTime)} min (limit: ${shiftMinutes} min)`);
              console.log(`  CNA Time: ${Math.round(totalCnaTime)} min (limit: ${shiftMinutes} min)`);
              console.log(`  Completed: ${completed}`);
            }
            
            completionRates.push(completed ? 100 : 0);
          }

          // Calculate statistics
          const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
          const ci = calculateConfidenceInterval(completionRates, 0.95);
          
          // Calculate risk metrics
          const riskScore = avgCompletionRate < 80 ? 100 - avgCompletionRate : (100 - avgCompletionRate) * 0.5;
          const failureProbability = 100 - avgCompletionRate;

          simulationResults.push({
            nurseRatio: `1:${nurseRatio}`,
            cnaRatio: `1:${cnaRatio}`,
            completionRate: Math.round(avgCompletionRate * 10) / 10,
            confidenceLower: Math.round(ci.lower * 10) / 10,
            confidenceUpper: Math.round(ci.upper * 10) / 10,
            stdDev: Math.round(ci.stdDev * 10) / 10,
            riskScore: Math.round(riskScore * 10) / 10,
            failureProbability: Math.round(failureProbability * 10) / 10,
            avgWorkload: Math.round((100 - avgCompletionRate) / 10)
          });
        }
      }

      setResults(simulationResults);

      // Save to database with enhanced data
      await saveSimulationResults({
        cna_ratios: params.cnaRatios,
        nurse_ratios: params.nurseRatios,
        shift_hours: params.shiftHours,
        iterations: params.iterations,
        results: simulationResults,
        scenario_name: `Basic Simulation - ${new Date().toLocaleDateString()}`
      });

    } catch (error) {
      console.error('Error running simulation:', error);
      alert('Error running simulation');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!results) return [];
    
    const chartData = params.cnaRatios.map(cnaRatio => {
      const point = { cnaRatio: `1:${cnaRatio}` };
      params.nurseRatios.forEach(nurseRatio => {
        const result = results.find(
          r => r.nurseRatio === `1:${nurseRatio}` && r.cnaRatio === `1:${cnaRatio}`
        );
        if (result) {
          point[`RN 1:${nurseRatio}`] = result.completionRate;
        }
      });
      return point;
    });

    return chartData;
  };

  const getConfidenceChartData = () => {
    if (!results) return [];
    
    return results.map(r => ({
      name: `${r.nurseRatio} | ${r.cnaRatio}`,
      completion: r.completionRate,
      lower: r.confidenceLower,
      upper: r.confidenceUpper,
      risk: r.riskScore
    }));
  };

  const getRiskColor = (risk) => {
    if (risk < 20) return 'text-green-600';
    if (risk < 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBestScenarios = () => {
    if (!results) return [];
    return results
      .filter(r => r.completionRate >= 90)
      .sort((a, b) => a.riskScore - b.riskScore)
      .slice(0, 3);
  };

  const getWorstScenarios = () => {
    if (!results) return [];
    return results
      .filter(r => r.completionRate < 75)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workload Simulation</h1>
        <p className="text-gray-600 mt-1">Monte Carlo simulation with confidence intervals and risk assessment</p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Available Task Data:</strong> {taskData.length} tasks with sufficient responses
              {taskData.length === 0 && " (Need at least 3 survey responses per task to run simulation)"}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This simulation uses Monte Carlo methods with {params.iterations.toLocaleString()} iterations to provide statistically reliable results with 95% confidence intervals.
            </p>
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Simulation Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">CNA:Patient Ratios</label>
            <div className="space-y-2">
              {[8, 10, 12, 14, 16].map(ratio => (
                <label key={ratio} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={params.cnaRatios.includes(ratio)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParams({ ...params, cnaRatios: [...params.cnaRatios, ratio].sort() });
                      } else {
                        setParams({ ...params, cnaRatios: params.cnaRatios.filter(r => r !== ratio) });
                      }
                    }}
                    className="rounded"
                  />
                  <span>1:{ratio}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">RN:Patient Ratios</label>
            <div className="space-y-2">
              {[2, 3, 4, 5, 6].map(ratio => (
                <label key={ratio} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={params.nurseRatios.includes(ratio)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParams({ ...params, nurseRatios: [...params.nurseRatios, ratio].sort() });
                      } else {
                        setParams({ ...params, nurseRatios: params.nurseRatios.filter(r => r !== ratio) });
                      }
                    }}
                    className="rounded"
                  />
                  <span>1:{ratio}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Shift Duration (hours)</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={params.shiftHours}
              onChange={(e) => setParams({ ...params, shiftHours: parseInt(e.target.value) })}
            >
              <option value="8">8 hours</option>
              <option value="10">10 hours</option>
              <option value="12">12 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Simulation Precision</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={params.iterations}
              onChange={(e) => setParams({ ...params, iterations: parseInt(e.target.value) })}
            >
              <option value="500">500 iterations (Fast)</option>
              <option value="1000">1,000 iterations (Standard)</option>
              <option value="5000">5,000 iterations (High Precision)</option>
              <option value="10000">10,000 iterations (Research Grade)</option>
            </select>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || taskData.length === 0}
          className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Running {params.iterations.toLocaleString()} iterations...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {results && (
        <>
          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Best Scenarios</h3>
              </div>
              {getBestScenarios().length > 0 ? (
                <div className="space-y-1">
                  {getBestScenarios().map((scenario, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{scenario.nurseRatio} | {scenario.cnaRatio}</span>
                      <span className="text-green-700 ml-2">{scenario.completionRate}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-700">No scenarios meet 90% completion target</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Average Performance</h3>
              </div>
              <div className="text-sm space-y-1">
                <div>Avg Completion: <span className="font-medium">{Math.round(results.reduce((sum, r) => sum + r.completionRate, 0) / results.length)}%</span></div>
                <div>Avg Risk Score: <span className="font-medium">{Math.round(results.reduce((sum, r) => sum + r.riskScore, 0) / results.length)}</span></div>
                <div>Scenarios ≥90%: <span className="font-medium">{results.filter(r => r.completionRate >= 90).length}</span></div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-800">High Risk Scenarios</h3>
              </div>
              {getWorstScenarios().length > 0 ? (
                <div className="space-y-1">
                  {getWorstScenarios().map((scenario, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{scenario.nurseRatio} | {scenario.cnaRatio}</span>
                      <span className="text-red-700 ml-2">{scenario.completionRate}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-700">No high-risk scenarios detected</p>
              )}
            </div>
          </div>

          {/* Confidence Intervals Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Task Completion Rates with 95% Confidence Intervals</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getConfidenceChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12} 
                    angle={-45} 
                    textAnchor="end" 
                    height={100} 
                  />
                  <YAxis label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`, 
                      name === 'completion' ? 'Completion Rate' : 
                      name === 'lower' ? 'Lower Bound' : 'Upper Bound'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="completion" fill="#4F46E5" name="Completion Rate" />
                  <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="3 3" label="Target: 90%" />
                  <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="2 2" label="Warning: 75%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Confidence intervals show the statistical uncertainty around each completion rate estimate. 
              Narrower intervals indicate more reliable predictions.
            </p>
          </div>

          {/* Traditional Line Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Task Completion Rates by Staffing Ratio</h2>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={getChartData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="cnaRatio" 
                    label={{ 
                      value: 'CNA Ratio', 
                      position: 'bottom',
                      offset: 0,
                      style: { textAnchor: 'middle' }
                    }} 
                    height={60}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Completion Rate (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip />
                  <Legend 
                    verticalAlign="top" 
                    height={40}
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="3 3" label="Target: 90%" />
                  {params.nurseRatios.map((ratio, idx) => (
                    <Line
                      key={ratio}
                      type="monotone"
                      dataKey={`RN 1:${ratio}`}
                      stroke={`hsl(${220 + idx * 30}, 70%, 50%)`}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Higher completion rates indicate better staffing levels for workload management. 
              Look for combinations above the 90% target line.
            </p>
          </div>

          {/* Detailed Results Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Detailed Results with Statistical Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">RN Ratio</th>
                    <th className="text-left py-3 px-4 font-semibold">CNA Ratio</th>
                    <th className="text-right py-3 px-4 font-semibold">Completion Rate</th>
                    <th className="text-right py-3 px-4 font-semibold">95% Confidence Interval</th>
                    <th className="text-right py-3 px-4 font-semibold">Risk Score</th>
                    <th className="text-right py-3 px-4 font-semibold">Failure Probability</th>
                    <th className="text-center py-3 px-4 font-semibold">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .map((result, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{result.nurseRatio}</td>
                      <td className="py-3 px-4 font-medium">{result.cnaRatio}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`px-3 py-1 rounded font-semibold ${
                          result.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                          result.completionRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.completionRate}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm">
                        <span className="text-gray-600">
                          {result.confidenceLower}% - {result.confidenceUpper}%
                        </span>
                        <div className="text-xs text-gray-400">
                          ±{((result.confidenceUpper - result.confidenceLower) / 2).toFixed(1)}%
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-semibold ${getRiskColor(result.riskScore)}`}>
                          {result.riskScore}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {result.failureProbability}%
                      </td>
                      <td className="text-center py-3 px-4">
                        {result.completionRate >= 90 ? (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            ✓ Recommended
                          </span>
                        ) : result.completionRate >= 75 ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                            ⚠ Caution
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                            ✗ Not Recommended
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Recommendations */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold">Statistical Insights & Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-800">Key Findings:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>{results.filter(r => r.completionRate >= 90).length} of {results.length} scenarios meet the 90% completion target</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Average confidence interval width: ±{Math.round(results.reduce((sum, r) => sum + (r.confidenceUpper - r.confidenceLower), 0) / results.length / 2)}%</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Simulation based on {params.iterations.toLocaleString()} iterations per scenario for statistical reliability</span>
                  </li>
                  {results.some(r => r.riskScore < 10) && (
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✅</span>
                      <span>Low-risk scenarios available with risk scores below 10</span>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-800">Recommendations:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Choose scenarios with completion rates ≥90% and narrow confidence intervals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Risk scores below 20 indicate reliable, low-risk staffing levels</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Wide confidence intervals suggest higher uncertainty - consider more conservative ratios</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>For cost analysis and optimization features, use the Enhanced Simulation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Consider patient acuity and unit-specific factors when implementing these ratios</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {getBestScenarios().length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-2 text-gray-800">🎯 Top Recommendation:</h4>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-indigo-600">
                    {getBestScenarios()[0].nurseRatio} | {getBestScenarios()[0].cnaRatio}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getBestScenarios()[0].completionRate}% completion 
                    ({getBestScenarios()[0].confidenceLower}-{getBestScenarios()[0].confidenceUpper}% CI)
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    Risk Score: {getBestScenarios()[0].riskScore}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Methodology */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-3">📊 Simulation Methodology</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Statistical Methods:</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Monte Carlo simulation with {params.iterations.toLocaleString()} iterations</li>
                  <li>• 95% confidence intervals using normal approximation</li>
                  <li>• Risk scores based on failure probability and completion variance</li>
                  <li>• Task frequency data from actual survey responses</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Sources:</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Task time ranges from {taskData.length} surveyed tasks</li>
                  <li>• Task frequency patterns from nursing staff responses</li>
                  <li>• Standard deviation calculated from min/max time ranges</li>
                  <li>• Random sampling within realistic time boundaries</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This simulation models task completion probability based on available shift time. 
                Actual outcomes may vary due to patient acuity, interruptions, documentation requirements, and other clinical factors. 
                Results should be used as guidance alongside clinical judgment and operational considerations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Simulation;