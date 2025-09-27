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
  const { data, error } = await supabase
    .from('simulation_results')
    .insert([simulationData])
    .select();

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