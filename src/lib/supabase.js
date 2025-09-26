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
      responses: surveyData.responses,
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