// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulwvuntjsgqzajhptskk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsd3Z1bnRqc2dxemFqaHB0c2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDY0NTEsImV4cCI6MjA3NDQ4MjQ1MX0.7cVEaFV5rHte20K7S0j65QgCOcB01tjiRvoayOvQmE0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to submit survey
export async function submitSurvey(surveyData) {
  const { data, error } = await supabase
    .from('survey_responses')
    .insert([{
      survey_type: surveyData.surveyType,
      primary_shift: surveyData.respondentInfo?.primaryShift,
      rotate_shifts: surveyData.respondentInfo?.rotateShifts || false,
      experience_level: surveyData.respondentInfo?.experienceLevel,
      unit_type: surveyData.respondentInfo?.unitType,
      typical_patient_load: surveyData.respondentInfo?.typicalPatientLoad,
      responses: surveyData.responses, // Now includes frequency field
      ip_hash: await hashString(getClientIP()),
      user_agent: navigator.userAgent
    }])
    .select();

  if (error) throw error;
  return data;
}

// Helper function to get survey results
export async function getSurveyResults(filters = {}) {
  let query = supabase
    .from('survey_responses')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (filters.surveyType) {
    query = query.eq('survey_type', filters.surveyType);
  }

  if (filters.shift) {
    query = query.eq('primary_shift', filters.shift);
  }

  if (filters.startDate) {
    query = query.gte('submitted_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('submitted_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Helper function to get task statistics
export async function getTaskStatistics(surveyType = null) {
  const { data, error } = await supabase
    .rpc('get_task_times_for_simulation', { 
      p_survey_type: surveyType 
    });

  if (error) throw error;
  return data;
}

// Helper function to save simulation results


export async function saveSimulationResults(simulationData) {
  // Calculate aggregate metrics from results array
  let aggregateData = {};
  
  if (simulationData.results && Array.isArray(simulationData.results)) {
    const results = simulationData.results;
    
    // Calculate averages
    const avgCost = results.reduce((sum, r) => sum + (r.totalCost || 0), 0) / results.length;
    const avgRisk = results.reduce((sum, r) => sum + (r.riskScore || 0), 0) / results.length;
    const avgFailure = results.reduce((sum, r) => sum + (r.failureProbability || 0), 0) / results.length;
    
    // Extract confidence intervals (using first scenario as example)
    const firstResult = results[0];
    const confidenceLower = {};
    const confidenceUpper = {};
    
    results.forEach(r => {
      const key = `${r.nurseRatio}_${r.cnaRatio}`;
      confidenceLower[key] = r.confidenceLower || r.completionRate;
      confidenceUpper[key] = r.confidenceUpper || r.completionRate;
    });
    
    aggregateData = {
      total_cost: Math.round(avgCost),
      risk_score: Math.round(avgRisk * 100) / 100,
      failure_probability: Math.round(avgFailure * 100) / 100,
      confidence_interval_lower: confidenceLower,
      confidence_interval_upper: confidenceUpper,
      cost_per_hour: simulationData.hourly_rate || 
        ((simulationData.rn_hourly_rate || 45) + (simulationData.cna_hourly_rate || 22)) / 2
    };
  }

  // Create scenario name based on parameters
  const scenarioName = simulationData.scenario_name || 
    `Enhanced Sim: RN[${(simulationData.nurse_ratios || []).join(',')}] CNA[${(simulationData.cna_ratios || []).join(',')}]`;

  const dataToInsert = {
    cna_ratios: simulationData.cna_ratios,
    nurse_ratios: simulationData.nurse_ratios,
    shift_hours: simulationData.shift_hours,
    iterations: simulationData.iterations,
    results: simulationData.results,
    scenario_name: scenarioName,
    notes: simulationData.enhanced_features ? 
      `Enhanced simulation with: ${Object.keys(simulationData.enhanced_features).join(', ')}` : 
      null,
    sensitivity_params: simulationData.enhanced_features || null,
    ...aggregateData
  };

  const { data, error } = await supabase
    .from('simulation_results')
    .insert([dataToInsert])
    .select();

  if (error) throw error;
  return data;
}

// Get enhanced simulation history using existing columns
export async function getEnhancedSimulationHistory(limit = 10) {
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .not('sensitivity_params', 'is', null) // Enhanced simulations have this field
    .order('run_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get simulations within budget and risk constraints using existing columns
export async function getOptimalSimulations(maxCost = 10000, maxRisk = 30) {
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .lte('total_cost', maxCost)
    .lte('risk_score', maxRisk)
    .order('risk_score', { ascending: true });

  if (error) throw error;
  return data;
}

// Get cost and risk trends over time
export async function getCostRiskTrends(daysBack = 30) {
  const { data, error } = await supabase
    .from('simulation_results')
    .select('run_at, total_cost, risk_score, failure_probability, nurse_ratios, cna_ratios, scenario_name')
    .gte('run_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .not('total_cost', 'is', null)
    .order('run_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Helper function to get simulation history
export async function getSimulationHistory(limit = 10) {
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Simple hash function for IP addresses (client-side, for basic spam prevention)
async function hashString(str) {
  if (!str) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get client IP (approximation)
function getClientIP() {
  // This is a placeholder - in production you'd get this from headers
  return 'unknown';
}

// Count responses by type
export async function getSurveyCounts() {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('survey_type');

  if (error) throw error;

  const counts = data.reduce((acc, row) => {
    acc[row.survey_type] = (acc[row.survey_type] || 0) + 1;
    return acc;
  }, {});

  return {
    rn: counts.rn || 0,
    cna: counts.cna || 0,
    total: data.length
  };
}

// Add to src/lib/supabase.js

// Session tracking functions
export async function createSurveySession(surveyType, totalSteps) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { data, error } = await supabase
    .from('survey_sessions')
    .insert([{
      session_id: sessionId,
      survey_type: surveyType,
      total_steps: totalSteps,
      ip_hash: await hashString(getClientIP()),
      user_agent: navigator.userAgent,
      device_type: getDeviceType()
    }])
    .select()
    .single();

  if (error) throw error;
  return sessionId;
}

export async function updateSurveySession(sessionId, currentStep, completed = false) {
  const updateData = {
    current_step: currentStep,
    last_activity: new Date().toISOString(),
    completed: completed
  };

  if (completed) {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('survey_sessions')
    .update(updateData)
    .eq('session_id', sessionId);

  if (error) throw error;
}

export async function trackSurveyStep(sessionId, stepNumber, stepName, completed = false) {
  const { data: existingStep } = await supabase
    .from('survey_step_tracking')
    .select('id, entered_at')
    .eq('session_id', sessionId)
    .eq('step_number', stepNumber)
    .single();

  if (existingStep && completed) {
    const enteredAt = new Date(existingStep.entered_at);
    const exitedAt = new Date();
    const timeSpent = Math.round((exitedAt - enteredAt) / 1000);

    const { error } = await supabase
      .from('survey_step_tracking')
      .update({
        exited_at: exitedAt.toISOString(),
        time_spent_seconds: timeSpent,
        completed: true
      })
      .eq('id', existingStep.id);

    if (error) throw error;
  } else if (!existingStep) {
    const { error } = await supabase
      .from('survey_step_tracking')
      .insert([{
        session_id: sessionId,
        step_number: stepNumber,
        step_name: stepName
      }]);

    if (error) throw error;
  }
}

// Analytics retrieval functions
export async function getActiveSessions() {
  const { data, error } = await supabase
    .rpc('get_active_sessions');

  if (error) throw error;
  
  return data.reduce((acc, row) => {
    acc[row.survey_type] = row.active_count;
    return acc;
  }, { rn: 0, cna: 0, total: data.reduce((sum, r) => sum + Number(r.active_count), 0) });
}

export async function getCompletionRates(daysBack = 7) {
  const { data, error } = await supabase
    .rpc('get_completion_rates', { days_back: daysBack });

  if (error) throw error;
  return data;
}

export async function getDropoffAnalysis(surveyType = null) {
  const { data, error } = await supabase
    .rpc('get_dropoff_analysis', { survey_type_filter: surveyType });

  if (error) throw error;
  return data;
}

export async function getResponseVelocity(hoursBack = 24) {
  const { data, error } = await supabase
    .rpc('get_response_velocity', { hours_back: hoursBack });

  if (error) throw error;
  
  // Format for charting
  const formatted = {};
  data.forEach(row => {
    const hour = new Date(row.time_bucket).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric' 
    });
    if (!formatted[hour]) {
      formatted[hour] = { hour, rn: 0, cna: 0 };
    }
    formatted[hour][row.survey_type] = Number(row.response_count);
  });

  return Object.values(formatted).reverse();
}

// Helper function to detect device type
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Add to src/lib/supabase.js - Data Quality Functions

// Get data quality summary
export async function getDataQualitySummary(daysBack = 7) {
  const { data, error } = await supabase
    .rpc('get_data_quality_summary', { days_back: daysBack });

  if (error) throw error;
  return data[0] || {
    total_responses: 0,
    high_quality_count: 0,
    medium_quality_count: 0,
    low_quality_count: 0,
    flagged_count: 0,
    avg_quality_score: 0,
    outlier_percentage: 0,
    suspicious_percentage: 0
  };
}

// Get outlier details
export async function getOutliers() {
  const { data, error } = await supabase
    .rpc('detect_outliers');

  if (error) throw error;
  return data;
}

// Get suspicious responses
export async function getSuspiciousResponses() {
  const { data, error } = await supabase
    .rpc('detect_suspicious_responses');

  if (error) throw error;
  return data;
}

// Get flagged responses for review
export async function getFlaggedResponses(limit = 50) {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('flagged_for_review', true)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Update quality scores manually
export async function updateQualityScores() {
  const { data, error } = await supabase
    .rpc('update_quality_scores');

  if (error) throw error;
  return data;
}

// Get quality metrics over time
export async function getQualityMetricsHistory(days = 30) {
  const { data, error } = await supabase
    .from('data_quality_metrics')
    .select('*')
    .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('metric_date', { ascending: true });

  if (error) throw error;
  return data;
}

// Get response details with quality info
export async function getResponseWithQuality(responseId) {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('id', responseId)
    .single();

  if (error) throw error;
  return data;
}

// Mark response as reviewed
export async function markResponseReviewed(responseId, approved = true) {
  const { data, error } = await supabase
    .from('survey_responses')
    .update({ 
      flagged_for_review: !approved,
      quality_score: approved ? 100 : 0
    })
    .eq('id', responseId)
    .select();

  if (error) throw error;
  return data;
}

// Get quality distribution
export async function getQualityDistribution() {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('quality_score, survey_type');

  if (error) throw error;

  // Group into quality tiers
  const distribution = {
    high: { rn: 0, cna: 0 },
    medium: { rn: 0, cna: 0 },
    low: { rn: 0, cna: 0 }
  };

  data.forEach(response => {
    const score = response.quality_score || 0;
    const type = response.survey_type;
    
    if (score >= 80) distribution.high[type]++;
    else if (score >= 60) distribution.medium[type]++;
    else distribution.low[type]++;
  });

  return distribution;
}

// Add to src/lib/supabase.js - Comparative Analytics Functions

// Compare data by shift
export async function compareByShift(taskFilter = null) {
  const { data, error } = await supabase
    .rpc('compare_by_shift', { task_filter: taskFilter });

  if (error) throw error;
  return data;
}

// Compare data by experience level
export async function compareByExperience(taskFilter = null) {
  const { data, error } = await supabase
    .rpc('compare_by_experience', { task_filter: taskFilter });

  if (error) throw error;
  return data;
}

// Compare data by unit type
export async function compareByUnit(taskFilter = null) {
  const { data, error } = await supabase
    .rpc('compare_by_unit', { task_filter: taskFilter });

  if (error) throw error;
  return data;
}

// Compare RN vs CNA tasks
export async function compareRnVsCna() {
  const { data, error } = await supabase
    .rpc('compare_rn_vs_cna');

  if (error) throw error;
  return data;
}

// Get percentile benchmarks
export async function getPercentileBenchmarks(benchmarkType, benchmarkKey) {
  const { data, error } = await supabase
    .rpc('calculate_percentile_benchmarks', { 
      benchmark_type_param: benchmarkType,
      benchmark_key_param: benchmarkKey
    });

  if (error) throw error;
  return data;
}

// Get performance ranking
export async function getPerformanceRanking(compareType, compareValue) {
  const { data, error } = await supabase
    .rpc('get_performance_ranking', { 
      compare_type: compareType,
      compare_value: compareValue
    });

  if (error) throw error;
  return data;
}

// Identify best practices
export async function identifyBestPractices(taskName) {
  const { data, error } = await supabase
    .rpc('identify_best_practices', { task_name_param: taskName });

  if (error) throw error;
  return data;
}

// Calculate workload intensity
export async function getWorkloadIntensity() {
  const { data, error } = await supabase
    .rpc('calculate_workload_intensity');

  if (error) throw error;
  return data;
}

// Get available comparison groups
export async function getComparisonGroups() {
  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('primary_shift, experience_level, unit_type, survey_type');

  if (error) throw error;

  const groups = {
    shifts: [...new Set(responses.map(r => r.primary_shift).filter(Boolean))],
    experiences: [...new Set(responses.map(r => r.experience_level).filter(Boolean))],
    units: [...new Set(responses.map(r => r.unit_type).filter(Boolean))],
    surveyTypes: [...new Set(responses.map(r => r.survey_type).filter(Boolean))]
  };

  return groups;
}

// Add to src/lib/supabase.js - Simulation Enhancement Functions

// Calculate confidence intervals
export async function getConfidenceIntervals(nurseRatio, cnaRatio, shiftHours, iterations = 1000, confidenceLevel = 0.95) {
  const { data, error } = await supabase
    .rpc('calculate_confidence_intervals', {
      nurse_ratio_param: nurseRatio,
      cna_ratio_param: cnaRatio,
      shift_hours_param: shiftHours,
      iterations_param: iterations,
      confidence_level: confidenceLevel
    });

  if (error) throw error;
  return data[0] || null;
}

// Run sensitivity analysis
export async function runSensitivityAnalysis(baseNurseRatio, baseCnaRatio, parameterToVary, variationRange = [1,2,3,4,5,6]) {
  const { data, error } = await supabase
    .rpc('run_sensitivity_analysis', {
      base_nurse_ratio: baseNurseRatio,
      base_cna_ratio: baseCnaRatio,
      parameter_to_vary: parameterToVary,
      variation_range: variationRange
    });

  if (error) throw error;
  return data;
}

// Calculate risk score
export async function calculateRiskScore(completionRate, workloadVariance, staffRatio) {
  const { data, error } = await supabase
    .rpc('calculate_risk_score', {
      completion_rate: completionRate,
      workload_variance: workloadVariance,
      staff_ratio: staffRatio
    });

  if (error) throw error;
  return data;
}

// Calculate staffing costs
export async function calculateStaffingCosts(
  rnCount, 
  cnaCount, 
  hoursPerShift, 
  rnHourlyRate = 45, 
  cnaHourlyRate = 22,
  overheadMultiplier = 1.3
) {
  const { data, error } = await supabase
    .rpc('calculate_staffing_costs', {
      rn_count: rnCount,
      cna_count: cnaCount,
      hours_per_shift: hoursPerShift,
      rn_hourly_rate: rnHourlyRate,
      cna_hourly_rate: cnaHourlyRate,
      overhead_multiplier: overheadMultiplier
    });

  if (error) throw error;
  return data[0] || null;
}

// Save scenario for comparison
export async function saveScenario(scenarioGroupId, scenarioName, parameters, results, metrics) {
  const { data, error } = await supabase
    .from('simulation_scenarios')
    .insert([{
      scenario_group_id: scenarioGroupId,
      scenario_name: scenarioName,
      parameters: parameters,
      results: results,
      metrics: metrics
    }])
    .select();

  if (error) throw error;
  return data[0];
}

// Compare scenarios
export async function compareScenarios(scenarioGroupId) {
  const { data, error } = await supabase
    .rpc('compare_scenarios', {
      scenario_group_id_param: scenarioGroupId
    });

  if (error) throw error;
  return data;
}

// Calculate what-if impact
export async function calculateWhatIfImpact(
  currentNurseRatio,
  currentCnaRatio,
  proposedNurseRatio,
  proposedCnaRatio,
  patientVolume = 30
) {
  const { data, error } = await supabase
    .rpc('calculate_what_if_impact', {
      current_nurse_ratio: currentNurseRatio,
      current_cna_ratio: currentCnaRatio,
      proposed_nurse_ratio: proposedNurseRatio,
      proposed_cna_ratio: proposedCnaRatio,
      patient_volume: patientVolume
    });

  if (error) throw error;
  return data;
}

// Get optimal staffing recommendation
export async function getOptimalStaffing(minCompletionRate = 90, maxBudget = 10000, patientCount = 30) {
  const { data, error } = await supabase
    .rpc('get_optimal_staffing', {
      min_completion_rate: minCompletionRate,
      max_budget: maxBudget,
      patient_count: patientCount
    });

  if (error) throw error;
  return data;
}

// Save sensitivity analysis results
export async function saveSensitivityResults(baseScenarioId, parameterName, parameterValue, completionRate, workloadScore, costImpact) {
  const { data, error } = await supabase
    .from('sensitivity_analysis')
    .insert([{
      base_scenario_id: baseScenarioId,
      parameter_name: parameterName,
      parameter_value: parameterValue,
      completion_rate: completionRate,
      workload_score: workloadScore,
      cost_impact: costImpact
    }])
    .select();

  if (error) throw error;
  return data[0];
}

// Add to src/lib/supabase.js - Visualization Functions

// Get heat map data
export async function getHeatmapData(groupBy = 'shift') {
  const { data, error } = await supabase
    .rpc('get_heatmap_data', { group_by_param: groupBy });

  if (error) throw error;
  return data;
}

// Get task flow data for Sankey diagram
export async function getTaskFlowData() {
  const { data, error } = await supabase
    .rpc('get_task_flow_data');

  if (error) throw error;
  return data;
}

// Get network graph data
export async function getTaskNetworkData() {
  const { data, error } = await supabase
    .rpc('get_task_network_data');

  if (error) throw error;
  
  // Separate nodes and edges
  const nodes = data.filter(d => d.node_id !== null).map(d => ({
    id: d.node_id,
    label: d.node_label,
    size: d.node_size,
    category: d.node_category
  }));

  const edges = data.filter(d => d.edge_source !== null).map(d => ({
    source: d.edge_source,
    target: d.edge_target,
    weight: d.edge_weight
  }));

  return { nodes, edges };
}

// Get time distribution for a specific task
export async function getTimeDistribution(taskName) {
  const { data, error } = await supabase
    .rpc('get_time_distribution', { task_name_param: taskName });

  if (error) throw error;
  return data;
}

// Get trend data
export async function getTrendData(metricName = 'avg_completion_time') {
  const { data, error } = await supabase
    .rpc('get_trend_data', { metric_name: metricName });

  if (error) throw error;
  return data;
}

// Export dashboard data
export async function exportDashboardData(exportType, filters = {}) {
  const { data, error } = await supabase
    .rpc('export_dashboard_data', { 
      export_type: exportType,
      filters: filters
    });

  if (error) throw error;
  return data;
}

// Save dashboard preferences
export async function saveDashboardPreferences(userSession, dashboardConfig, widgetLayout) {
  const { data, error } = await supabase
    .from('dashboard_preferences')
    .upsert([{
      user_session: userSession,
      dashboard_config: dashboardConfig,
      widget_layout: widgetLayout,
      updated_at: new Date().toISOString()
    }], { onConflict: 'user_session' })
    .select();

  if (error) throw error;
  return data[0];
}

// Load dashboard preferences
export async function loadDashboardPreferences(userSession) {
  const { data, error } = await supabase
    .from('dashboard_preferences')
    .select('*')
    .eq('user_session', userSession)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
  return data;
}

// Export to CSV
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
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
}

// Export to JSON
export function exportToJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}