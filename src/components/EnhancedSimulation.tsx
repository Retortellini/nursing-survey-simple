// src/components/EnhancedSimulation.tsx
import React, { useState, useEffect } from 'react';
import { 
  getTaskStatistics,
  getConfidenceIntervals,
  runSensitivityAnalysis,
  calculateStaffingCosts,
  saveScenario,
  compareScenarios,
  calculateWhatIfImpact,
  getOptimalStaffing
} from '../lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import {
  Play,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Calculator,
  BarChart3,
  Target
} from 'lucide-react';

const EnhancedSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState([]);
  const [simulationResults, setSimulationResults] = useState(null);
  const [sensitivityData, setSensitivityData] = useState([]);
  const [whatIfData, setWhatIfData] = useState([]);
  const [optimalRecommendations, setOptimalRecommendations] = useState([]);
  const [scenarioComparison, setScenarioComparison] = useState([]);
  
  const [params, setParams] = useState({
    nurseRatios: [3, 4, 5],
    cnaRatios: [10, 12, 14],
    shiftHours: 8,
    iterations: 1000,
    confidenceLevel: 0.95,
    rnHourlyRate: 45,
    cnaHourlyRate: 22,
    patientVolume: 30,
    minCompletionRate: 90,
    maxBudget: 10000
  });

  const [whatIfParams, setWhatIfParams] = useState({
    currentNurseRatio: 4,
    currentCnaRatio: 12,
    proposedNurseRatio: 3,
    proposedCnaRatio: 10
  });

  const [activeTab, setActiveTab] = useState('simulation');

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

  const runEnhancedSimulation = async () => {
    if (taskData.length === 0) {
      alert('Not enough survey data. Need at least 3 responses per task.');
      return;
    }

    setLoading(true);
    try {
      const results = [];
      const scenarioGroupId = crypto.randomUUID();

      for (const nurseRatio of params.nurseRatios) {
        for (const cnaRatio of params.cnaRatios) {
          let completedShifts = 0;

          for (let i = 0; i < params.iterations; i++) {
            let totalRnTime = 0;
            let totalCnaTime = 0;

            taskData.forEach(task => {
              const avgTime = (task.avg_min_time + task.avg_max_time) / 2;
              const stdDev = task.std_dev || (task.avg_max_time - task.avg_min_time) / 4;
              
              const isCnaTask = task.task_name.toLowerCase().includes('vital') || 
                               task.task_name.toLowerCase().includes('hygiene') || 
                               task.task_name.toLowerCase().includes('mobility');
              
              if (!isCnaTask) {
                for (let p = 0; p < nurseRatio; p++) {
                  const randomTime = avgTime + (Math.random() - 0.5) * 2 * stdDev;
                  totalRnTime += Math.max(task.avg_min_time, Math.min(task.avg_max_time, randomTime));
                }
              } else {
                for (let p = 0; p < cnaRatio; p++) {
                  const randomTime = avgTime + (Math.random() - 0.5) * 2 * stdDev;
                  totalCnaTime += Math.max(task.avg_min_time, Math.min(task.avg_max_time, randomTime));
                }
              }
            });

            const shiftMinutes = params.shiftHours * 60;
            if (totalRnTime <= shiftMinutes && totalCnaTime <= shiftMinutes) {
              completedShifts++;
            }
          }

          const completionRate = (completedShifts / params.iterations) * 100;

          const ciData = await getConfidenceIntervals(
            nurseRatio,
            cnaRatio,
            params.shiftHours,
            params.iterations,
            params.confidenceLevel
          );

          const rnCount = Math.ceil(params.patientVolume / nurseRatio);
          const cnaCount = Math.ceil(params.patientVolume / cnaRatio);
          const costData = await calculateStaffingCosts(
            rnCount,
            cnaCount,
            params.shiftHours,
            params.rnHourlyRate,
            params.cnaHourlyRate
          );

          const result = {
            nurseRatio: `1:${nurseRatio}`,
            cnaRatio: `1:${cnaRatio}`,
            completionRate: Math.round(completionRate * 10) / 10,
            confidenceLower: ciData?.ci_lower || completionRate - 5,
            confidenceUpper: ciData?.ci_upper || completionRate + 5,
            stdDev: ciData?.std_dev || 0,
            totalCost: costData?.total_with_overhead || 0,
            rnCost: costData?.rn_cost || 0,
            cnaCost: costData?.cna_cost || 0,
            rnCount,
            cnaCount,
            riskScore: completionRate < 80 ? 100 - completionRate : (100 - completionRate) * 0.5,
            failureProbability: 100 - completionRate
          };

          results.push(result);

          await saveScenario(
            scenarioGroupId,
            `RN 1:${nurseRatio} | CNA 1:${cnaRatio}`,
            { nurseRatio, cnaRatio, shiftHours: params.shiftHours },
            { completionRate: result.completionRate },
            { totalCost: result.totalCost, riskScore: result.riskScore }
          );
        }
      }

      setSimulationResults(results);

      const comparison = await compareScenarios(scenarioGroupId);
      setScenarioComparison(comparison);

    } catch (error) {
      console.error('Error running simulation:', error);
      alert('Error running simulation');
    } finally {
      setLoading(false);
    }
  };

  const runSensitivity = async () => {
    if (!simulationResults || simulationResults.length === 0) {
      alert('Please run simulation first');
      return;
    }

    setLoading(true);
    try {
      const baseNurseRatio = params.nurseRatios[Math.floor(params.nurseRatios.length / 2)];
      const baseCnaRatio = params.cnaRatios[Math.floor(params.cnaRatios.length / 2)];

      const nurseData = await runSensitivityAnalysis(
        baseNurseRatio,
        baseCnaRatio,
        'nurse_ratio',
        [2, 3, 4, 5, 6]
      );

      const cnaData = await runSensitivityAnalysis(
        baseNurseRatio,
        baseCnaRatio,
        'cna_ratio',
        [8, 10, 12, 14, 16]
      );

      setSensitivityData([
        ...nurseData.map(d => ({ ...d, type: 'RN Ratio' })),
        ...cnaData.map(d => ({ ...d, type: 'CNA Ratio' }))
      ]);

    } catch (error) {
      console.error('Error running sensitivity analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const runWhatIf = async () => {
    setLoading(true);
    try {
      const impact = await calculateWhatIfImpact(
        whatIfParams.currentNurseRatio,
        whatIfParams.currentCnaRatio,
        whatIfParams.proposedNurseRatio,
        whatIfParams.proposedCnaRatio,
        params.patientVolume
      );

      setWhatIfData(impact);
    } catch (error) {
      console.error('Error calculating what-if:', error);
    } finally {
      setLoading(false);
    }
  };

  const findOptimal = async () => {
    setLoading(true);
    try {
      const recommendations = await getOptimalStaffing(
        params.minCompletionRate,
        params.maxBudget,
        params.patientVolume
      );

      setOptimalRecommendations(recommendations);
    } catch (error) {
      console.error('Error finding optimal staffing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceChartData = () => {
    if (!simulationResults) return [];
    
    return simulationResults.map(r => ({
      name: `${r.nurseRatio} | ${r.cnaRatio}`,
      completion: r.completionRate,
      lower: r.confidenceLower,
      upper: r.confidenceUpper,
      error: [(r.completionRate - r.confidenceLower), (r.confidenceUpper - r.completionRate)]
    }));
  };

  const getCostEfficiencyData = () => {
    if (!simulationResults) return [];
    
    return simulationResults.map(r => ({
      cost: r.totalCost,
      completion: r.completionRate,
      name: `${r.nurseRatio} | ${r.cnaRatio}`,
      risk: r.riskScore
    }));
  };

  const getRiskColor = (risk) => {
    if (risk < 20) return 'text-green-600';
    if (risk < 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !simulationResults) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Enhanced Simulation</h1>
        <p className="text-gray-600 mt-1">Advanced staffing optimization with confidence intervals and risk analysis</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'simulation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <Play className="inline h-4 w-4 mr-2" />
              Simulation
            </button>
            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'sensitivity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-2" />
              Sensitivity
            </button>
            <button
              onClick={() => setActiveTab('whatif')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'whatif' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <Calculator className="inline h-4 w-4 mr-2" />
              What-If
            </button>
            <button
              onClick={() => setActiveTab('optimal')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'optimal' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
              }`}
            >
              <Target className="inline h-4 w-4 mr-2" />
              Optimal
            </button>
          </nav>
        </div>
      </div>

      {/* Simulation Tab */}
      {activeTab === 'simulation' && (
        <>
          {/* Parameters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Simulation Parameters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">RN:Patient Ratios</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={params.nurseRatios.join(', ')}
                  onChange={(e) => setParams({ ...params, nurseRatios: e.target.value.split(',').map(n => parseInt(n.trim())) })}
                  placeholder="3, 4, 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CNA:Patient Ratios</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={params.cnaRatios.join(', ')}
                  onChange={(e) => setParams({ ...params, cnaRatios: e.target.value.split(',').map(n => parseInt(n.trim())) })}
                  placeholder="10, 12, 14"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Iterations</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={params.iterations}
                  onChange={(e) => setParams({ ...params, iterations: parseInt(e.target.value) })}
                >
                  <option value="500">500</option>
                  <option value="1000">1,000</option>
                  <option value="5000">5,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">RN Hourly Rate ($)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={params.rnHourlyRate}
                  onChange={(e) => setParams({ ...params, rnHourlyRate: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CNA Hourly Rate ($)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={params.cnaHourlyRate}
                  onChange={(e) => setParams({ ...params, cnaHourlyRate: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Patient Volume</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={params.patientVolume}
                  onChange={(e) => setParams({ ...params, patientVolume: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <button
              onClick={runEnhancedSimulation}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Enhanced Simulation
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {simulationResults && (
            <>
              {/* Confidence Intervals Chart */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Completion Rates with {(params.confidenceLevel * 100)}% Confidence Intervals</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getConfidenceChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completion" fill="#4F46E5" name="Completion Rate" />
                      <Bar dataKey="lower" fill="#93C5FD" name="Lower Bound" />
                      <Bar dataKey="upper" fill="#1E40AF" name="Upper Bound" />
                      <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="3 3" label="Target: 90%" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost-Efficiency Scatter */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Cost-Efficiency Analysis</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cost" name="Total Cost" label={{ value: 'Total Cost ($)', position: 'bottom' }} />
                      <YAxis dataKey="completion" name="Completion Rate" label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={getCostEfficiencyData()} fill="#4F46E5" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Optimal scenarios are in the upper-left (high completion, low cost)
                </p>
              </div>

              {/* Detailed Results Table */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Detailed Results</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">RN Ratio</th>
                        <th className="text-left py-3 px-4">CNA Ratio</th>
                        <th className="text-right py-3 px-4">Completion Rate</th>
                        <th className="text-right py-3 px-4">CI Range</th>
                        <th className="text-right py-3 px-4">Total Cost</th>
                        <th className="text-right py-3 px-4">Risk Score</th>
                        <th className="text-right py-3 px-4">Staff Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResults.map((result, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{result.nurseRatio}</td>
                          <td className="py-3 px-4">{result.cnaRatio}</td>
                          <td className="text-right py-3 px-4">
                            <span className={`font-semibold ${
                              result.completionRate >= 90 ? 'text-green-600' :
                              result.completionRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {result.completionRate}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-sm text-gray-600">
                            {result.confidenceLower.toFixed(1)} - {result.confidenceUpper.toFixed(1)}%
                          </td>
                          <td className="text-right py-3 px-4">${result.totalCost.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">
                            <span className={`font-semibold ${getRiskColor(result.riskScore)}`}>
                              {result.riskScore.toFixed(1)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-sm">
                            RN: {result.rnCount} | CNA: {result.cnaCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Sensitivity Tab */}
      {activeTab === 'sensitivity' && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Sensitivity Analysis</h2>
            <button
              onClick={runSensitivity}
              disabled={loading || !simulationResults}
              className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {loading ? 'Running...' : 'Run Sensitivity Analysis'}
            </button>

            {sensitivityData.length > 0 && (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="parameter_value" label={{ value: 'Ratio Value', position: 'bottom' }} />
                    <YAxis label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completion_rate" stroke="#4F46E5" strokeWidth={2} name="Completion Rate" />
                    <Line type="monotone" dataKey="rate_change_percent" stroke="#10B981" strokeWidth={2} name="% Change" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* What-If Tab */}
      {activeTab === 'whatif' && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">What-If Scenario Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold mb-3">Current Scenario</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">RN Ratio</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg"
                      value={whatIfParams.currentNurseRatio}
                      onChange={(e) => setWhatIfParams({ ...whatIfParams, currentNurseRatio: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CNA Ratio</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg"
                      value={whatIfParams.currentCnaRatio}
                      onChange={(e) => setWhatIfParams({ ...whatIfParams, currentCnaRatio: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold mb-3">Proposed Scenario</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">RN Ratio</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg"
                      value={whatIfParams.proposedNurseRatio}
                      onChange={(e) => setWhatIfParams({ ...whatIfParams, proposedNurseRatio: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CNA Ratio</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg"
                      value={whatIfParams.proposedCnaRatio}
                      onChange={(e) => setWhatIfParams({ ...whatIfParams, proposedCnaRatio: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={runWhatIf}
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {loading ? 'Calculating...' : 'Calculate Impact'}
            </button>
          </div>

          {whatIfData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Impact Analysis</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Metric</th>
                      <th className="text-right py-3 px-4">Current</th>
                      <th className="text-right py-3 px-4">Proposed</th>
                      <th className="text-right py-3 px-4">Change</th>
                      <th className="text-right py-3 px-4">% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatIfData.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.metric}</td>
                        <td className="text-right py-3 px-4">{item.current_value.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{item.proposed_value.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">
                          <span className={item.change_value > 0 ? 'text-green-600' : item.change_value < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {item.change_value > 0 ? '+' : ''}{item.change_value.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={item.change_percent > 0 ? 'text-green-600' : item.change_percent < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {item.change_percent > 0 ? '+' : ''}{item.change_percent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optimal Tab */}
      {activeTab === 'optimal' && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Find Optimal Staffing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Min Completion Rate (%)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={params.minCompletionRate}
                  onChange={(e) => setParams({ ...params, minCompletionRate: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Budget ($)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={params.maxBudget}
                  onChange={(e) => setParams({ ...params, maxBudget: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Patient Count</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={params.patientVolume}
                  onChange={(e) => setParams({ ...params, patientVolume: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <button
              onClick={findOptimal}
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {loading ? 'Finding...' : 'Find Optimal Staffing'}
            </button>
          </div>

          {optimalRecommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                <h2 className="text-lg font-semibold">Optimal Recommendations</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {optimalRecommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className={`border-2 rounded-lg p-4 ${
                    idx === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    {idx === 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">RECOMMENDED</span>
                      </div>
                    )}
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {rec.nurse_ratio} | {rec.cna_ratio}
                      </p>
                      <p className="text-sm text-gray-600">RN : CNA Ratios</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="font-semibold text-green-600">{rec.completion_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Cost:</span>
                        <span className="font-semibold">${rec.estimated_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Efficiency Score:</span>
                        <span className="font-semibold text-indigo-600">{rec.efficiency_score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">RN Ratio</th>
                      <th className="text-left py-3 px-4">CNA Ratio</th>
                      <th className="text-right py-3 px-4">Completion Rate</th>
                      <th className="text-right py-3 px-4">Estimated Cost</th>
                      <th className="text-right py-3 px-4">Efficiency</th>
                      <th className="text-center py-3 px-4">Meets Requirements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimalRecommendations.map((rec, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{rec.nurse_ratio}</td>
                        <td className="py-3 px-4">{rec.cna_ratio}</td>
                        <td className="text-right py-3 px-4">
                          <span className="font-semibold text-green-600">{rec.completion_rate}%</span>
                        </td>
                        <td className="text-right py-3 px-4">${rec.estimated_cost.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">
                          <span className="font-semibold text-indigo-600">{rec.efficiency_score}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {rec.meets_requirements ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Yes</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {simulationResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-3">🎯 Simulation Insights</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">📊</span>
              <span>
                Confidence intervals show uncertainty range: wider intervals indicate higher variability in outcomes
              </span>
            </li>
            {simulationResults.some(r => r.riskScore > 40) && (
              <li className="flex items-start">
                <span className="text-red-600 mr-2">⚠️</span>
                <span>
                  High risk scenarios detected ({simulationResults.filter(r => r.riskScore > 40).length} scenarios with risk &gt; 40)
                </span>
              </li>
            )}
            {scenarioComparison.length > 0 && (
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✅</span>
                <span>
                  Best scenario: {scenarioComparison[0]?.scenario_name} with recommendation score of {scenarioComparison[0]?.recommendation_score}
                </span>
              </li>
            )}
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">💰</span>
              <span>
                Cost range: ${Math.min(...simulationResults.map(r => r.totalCost)).toLocaleString()} - 
                ${Math.max(...simulationResults.map(r => r.totalCost)).toLocaleString()}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">💡</span>
              <span>
                Use sensitivity analysis to understand how changing one parameter affects outcomes
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnhancedSimulation;