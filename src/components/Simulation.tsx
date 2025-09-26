// src/components/Simulation.tsx
import React, { useState, useEffect } from 'react';
import { getTaskStatistics, saveSimulationResults } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, RefreshCw } from 'lucide-react';

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
          let completedShifts = 0;

          for (let i = 0; i < params.iterations; i++) {
            let totalRnTime = 0;
            let totalCnaTime = 0;

            // RN tasks
            taskData.forEach(task => {
              const avgTime = (task.avg_min_time + task.avg_max_time) / 2;
              const stdDev = task.std_dev || (task.avg_max_time - task.avg_min_time) / 4;
              
              const isCnaTask = task.task_name.toLowerCase().includes('vital') || 
                               task.task_name.toLowerCase().includes('hygiene') || 
                               task.task_name.toLowerCase().includes('mobility') ||
                               task.task_name.toLowerCase().includes('toileting') ||
                               task.task_name.toLowerCase().includes('feeding');
              
              if (!isCnaTask) {
                const randomTime = avgTime + (Math.random() - 0.5) * 2 * stdDev;
                const taskTime = Math.max(task.avg_min_time, Math.min(task.avg_max_time, randomTime));
                const probability = avgFrequencies[task.task_name] || 0.5;
                
                // One-time tasks vs per-patient tasks
                if (task.task_name.toLowerCase().includes('handoff') || 
                    task.task_name.toLowerCase().includes('report')) {
                  totalRnTime += taskTime; // Once per shift
                } else {
                  // Per patient, using survey-reported frequency
                  for (let p = 0; p < nurseRatio; p++) {
                    if (Math.random() < probability) {
                      totalRnTime += taskTime;
                    }
                  }
                }
              }
            });

            // CNA tasks
            taskData.forEach(task => {
              const avgTime = (task.avg_min_time + task.avg_max_time) / 2;
              const stdDev = task.std_dev || (task.avg_max_time - task.avg_min_time) / 4;
              
              const isCnaTask = task.task_name.toLowerCase().includes('vital') || 
                               task.task_name.toLowerCase().includes('hygiene') || 
                               task.task_name.toLowerCase().includes('mobility') ||
                               task.task_name.toLowerCase().includes('toileting') ||
                               task.task_name.toLowerCase().includes('feeding');
              
              if (isCnaTask) {
                const randomTime = avgTime + (Math.random() - 0.5) * 2 * stdDev;
                const taskTime = Math.max(task.avg_min_time, Math.min(task.avg_max_time, randomTime));
                const probability = avgFrequencies[task.task_name] || 0.5;
                
                for (let p = 0; p < cnaRatio; p++) {
                  if (Math.random() < probability) {
                    totalCnaTime += taskTime;
                  }
                }
              }
            });

            const shiftMinutes = params.shiftHours * 60;
            if (totalRnTime <= shiftMinutes && totalCnaTime <= shiftMinutes) {
              completedShifts++;
            }
          }

          const completionRate = (completedShifts / params.iterations) * 100;

          simulationResults.push({
            nurseRatio: `1:${nurseRatio}`,
            cnaRatio: `1:${cnaRatio}`,
            completionRate: Math.round(completionRate * 10) / 10,
            avgWorkload: Math.round((100 - completionRate) / 10)
          });
        }
      }

      setResults(simulationResults);

      await saveSimulationResults({
        cna_ratios: params.cnaRatios,
        nurse_ratios: params.nurseRatios,
        shift_hours: params.shiftHours,
        iterations: params.iterations,
        results: simulationResults
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Workload Simulation</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Available Task Data:</strong> {taskData.length} tasks with sufficient responses
          {taskData.length === 0 && " (Need at least 3 survey responses per task to run simulation)"}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Simulation Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">CNA:Patient Ratios</label>
            <div className="space-y-2">
              {[8, 10, 12, 14].map(ratio => (
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
            <label className="block text-sm font-medium mb-2">Iterations</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={params.iterations}
              onChange={(e) => setParams({ ...params, iterations: parseInt(e.target.value) })}
            >
              <option value="500">500 (Fast)</option>
              <option value="1000">1,000 (Standard)</option>
              <option value="5000">5,000 (High Precision)</option>
            </select>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || taskData.length === 0}
          className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Running Simulation...
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
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Task Completion Rates by Staffing Ratio</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cnaRatio" label={{ value: 'CNA Ratio', position: 'bottom' }} />
                  <YAxis label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {params.nurseRatios.map((ratio, idx) => (
                    <Line
                      key={ratio}
                      type="monotone"
                      dataKey={`RN 1:${ratio}`}
                      stroke={`hsl(${220 + idx * 30}, 70%, 50%)`}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Higher completion rates indicate better staffing levels for workload management.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Detailed Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">RN Ratio</th>
                    <th className="text-left py-3 px-4">CNA Ratio</th>
                    <th className="text-right py-3 px-4">Completion Rate</th>
                    <th className="text-right py-3 px-4">Workload Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{result.nurseRatio}</td>
                      <td className="py-3 px-4">{result.cnaRatio}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`px-2 py-1 rounded ${
                          result.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                          result.completionRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.completionRate}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">{result.avgWorkload}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Aim for completion rates above 90% to ensure adequate patient care</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Lower nurse:patient ratios generally result in better task completion</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Balance CNA ratios with RN ratios for optimal team performance</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Collect more survey data to improve simulation accuracy</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Simulation;