// src/lib/testData.js - Simulated Data Generator

/**
 * Generates simulated survey response data with controlled variability
 * to produce a range of completion rates in simulations
 */

// Task definitions with realistic time ranges
const RN_TASKS = [
  { name: "Medication Administration", minRange: [10, 15], maxRange: [25, 35], frequency: 0.95 },
  { name: "Assessment & Documentation", minRange: [15, 20], maxRange: [30, 40], frequency: 0.90 },
  { name: "Handoff/Report", minRange: [8, 12], maxRange: [15, 25], frequency: 1.0 },
  { name: "Chart Review", minRange: [8, 12], maxRange: [12, 18], frequency: 0.85 },
  { name: "I/O's", minRange: [3, 6], maxRange: [8, 12], frequency: 0.70 },
  { name: "Wound Care", minRange: [10, 20], maxRange: [30, 50], frequency: 0.40 },
  { name: "IV Management", minRange: [8, 15], maxRange: [20, 30], frequency: 0.60 },
  { name: "Pain Management", minRange: [3, 8], maxRange: [15, 25], frequency: 0.55 },
  { name: "Blood Administration", minRange: [25, 35], maxRange: [50, 70], frequency: 0.15 },
  { name: "Turns", minRange: [3, 6], maxRange: [10, 18], frequency: 0.80 },
  { name: "Patient Education", minRange: [8, 12], maxRange: [20, 35], frequency: 0.50 },
  { name: "Medication Counseling", minRange: [8, 12], maxRange: [20, 30], frequency: 0.45 },
  { name: "Family Communication", minRange: [8, 12], maxRange: [20, 30], frequency: 0.50 },
  { name: "Tooth Brushing", minRange: [3, 6], maxRange: [10, 18], frequency: 0.35 },
  { name: "Ambulation", minRange: [8, 12], maxRange: [15, 25], frequency: 0.60 },
  { name: "Out Of Bed For Meals", minRange: [8, 12], maxRange: [15, 25], frequency: 0.55 },
  { name: "Code Blue", minRange: [25, 35], maxRange: [50, 70], frequency: 0.05 },
  { name: "Rapid Response", minRange: [12, 18], maxRange: [30, 50], frequency: 0.10 },
  { name: "M.D. Rounds", minRange: [12, 18], maxRange: [25, 35], frequency: 0.65 }
];

const CNA_TASKS = [
  { name: "Vital Signs", minRange: [3, 6], maxRange: [8, 12], frequency: 0.95 },
  { name: "I&O Monitoring", minRange: [3, 6], maxRange: [8, 12], frequency: 0.85 },
  { name: "Safety Rounds", minRange: [3, 6], maxRange: [8, 12], frequency: 0.90 },
  { name: "Patient Hygiene", minRange: [12, 18], maxRange: [25, 35], frequency: 0.70 },
  { name: "Toileting Assistance", minRange: [3, 8], maxRange: [10, 18], frequency: 0.75 },
  { name: "Feeding Assistance", minRange: [8, 12], maxRange: [20, 30], frequency: 0.60 },
  { name: "Patient Mobility", minRange: [8, 12], maxRange: [15, 25], frequency: 0.65 },
  { name: "Room Turnover", minRange: [3, 8], maxRange: [10, 18], frequency: 0.30 }
];

/**
 * Generate a random value within a range with some variability
 */
function randomInRange(min, max, variability = 0.2) {
  const center = (min + max) / 2;
  const spread = (max - min) / 2;
  const variance = spread * variability;
  return Math.max(min, Math.min(max, center + (Math.random() - 0.5) * 2 * variance));
}

/**
 * Generate simulated survey responses
 * @param {Object} options - Configuration options
 * @returns {Array} Array of simulated survey responses
 */
export function generateSimulatedData(options = {}) {
  const {
    rnCount = 100,           // Number of RN responses
    cnaCount = 80,           // Number of CNA responses
    experienceLevels = ['0-2', '3-5', '6-10', '10+'],
    shifts = ['days', 'evenings', 'nights'],
    unitTypes = ['med-surg', 'med-tele', 'icu', 'ed'],
    // Variability profiles: 'consistent', 'moderate', 'high'
    variabilityProfile = 'moderate'
  } = options;

  const variabilityMap = {
    'consistent': 0.1,    // Low variability - more predictable times
    'moderate': 0.25,     // Moderate variability - realistic variation
    'high': 0.4           // High variability - lots of variation
  };

  const variability = variabilityMap[variabilityProfile] || 0.25;

  const responses = [];

  // Generate RN responses
  for (let i = 0; i < rnCount; i++) {
    const taskResponses = {};
    
    RN_TASKS.forEach(task => {
      const minTime = randomInRange(task.minRange[0], task.minRange[1], variability);
      const maxTime = randomInRange(task.maxRange[0], task.maxRange[1], variability);
      
      // Add some realistic frequency variation
      const frequencyVariation = (Math.random() - 0.5) * 0.2; // ±10%
      const frequency = Math.max(0.05, Math.min(1.0, task.frequency + frequencyVariation));
      
      taskResponses[task.name] = {
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        frequency: frequency.toFixed(2),
        pattern: variability < 0.2 ? 'consistent' : variability < 0.35 ? 'variable' : 'highly_variable'
      };
    });

    responses.push({
      id: `test-rn-${i}`,
      survey_type: 'rn',
      primary_shift: shifts[Math.floor(Math.random() * shifts.length)],
      rotate_shifts: Math.random() < 0.3,
      experience_level: experienceLevels[Math.floor(Math.random() * experienceLevels.length)],
      unit_type: unitTypes[Math.floor(Math.random() * unitTypes.length)],
      typical_patient_load: [3, 4, 5, 6][Math.floor(Math.random() * 4)],
      responses: taskResponses,
      submitted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      quality_score: Math.round(70 + Math.random() * 30), // 70-100 quality score
      flagged_for_review: false
    });
  }

  // Generate CNA responses
  for (let i = 0; i < cnaCount; i++) {
    const taskResponses = {};
    
    CNA_TASKS.forEach(task => {
      const minTime = randomInRange(task.minRange[0], task.minRange[1], variability);
      const maxTime = randomInRange(task.maxRange[0], task.maxRange[1], variability);
      
      const frequencyVariation = (Math.random() - 0.5) * 0.2;
      const frequency = Math.max(0.05, Math.min(1.0, task.frequency + frequencyVariation));
      
      taskResponses[task.name] = {
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        frequency: frequency.toFixed(2),
        pattern: variability < 0.2 ? 'consistent' : variability < 0.35 ? 'variable' : 'highly_variable'
      };
    });

    responses.push({
      id: `test-cna-${i}`,
      survey_type: 'cna',
      primary_shift: shifts[Math.floor(Math.random() * shifts.length)],
      rotate_shifts: Math.random() < 0.3,
      experience_level: experienceLevels[Math.floor(Math.random() * experienceLevels.length)],
      unit_type: unitTypes[Math.floor(Math.random() * unitTypes.length)],
      typical_patient_load: [8, 10, 12, 14, 16][Math.floor(Math.random() * 5)],
      responses: taskResponses,
      submitted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      quality_score: Math.round(70 + Math.random() * 30),
      flagged_for_review: false
    });
  }

  return responses;
}

/**
 * Generate task statistics from simulated data (mimics database function)
 */
export function generateSimulatedTaskStats(responses) {
  const taskStats = {};

  responses.forEach(response => {
    if (!response.responses) return;

    Object.entries(response.responses).forEach(([taskName, taskData]) => {
      if (!taskStats[taskName]) {
        taskStats[taskName] = {
          task_name: taskName,
          minTimes: [],
          maxTimes: [],
          frequencies: []
        };
      }

      if (taskData.minTime) taskStats[taskName].minTimes.push(parseFloat(taskData.minTime));
      if (taskData.maxTime) taskStats[taskName].maxTimes.push(parseFloat(taskData.maxTime));
      if (taskData.frequency) taskStats[taskName].frequencies.push(parseFloat(taskData.frequency));
    });
  });

  return Object.values(taskStats).map(stat => {
    const avgMinTime = stat.minTimes.reduce((a, b) => a + b, 0) / stat.minTimes.length;
    const avgMaxTime = stat.maxTimes.reduce((a, b) => a + b, 0) / stat.maxTimes.length;
    const avgFrequency = stat.frequencies.reduce((a, b) => a + b, 0) / stat.frequencies.length;
    
    // Calculate standard deviation
    const mean = (avgMinTime + avgMaxTime) / 2;
    const variance = stat.maxTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / stat.maxTimes.length;
    const stdDev = Math.sqrt(variance);

    return {
      task_name: stat.task_name,
      avg_min_time: Math.round(avgMinTime * 10) / 10,
      avg_max_time: Math.round(avgMaxTime * 10) / 10,
      std_dev: Math.round(stdDev * 10) / 10,
      avg_frequency: Math.round(avgFrequency * 100) / 100,
      response_count: stat.minTimes.length
    };
  }).filter(stat => stat.response_count >= 3); // Only include tasks with sufficient data
}

/**
 * Generate different scenario datasets for testing
 */
export const TEST_SCENARIOS = {
  // Optimistic: Lower task times, should yield high completion rates
  optimistic: {
    name: "Optimistic Scenario",
    description: "Lower average task times - should yield 85-95% completion rates",
    config: {
      rnCount: 100,
      cnaCount: 80,
      variabilityProfile: 'consistent'
    }
  },
  
  // Realistic: Moderate task times, should yield 70-85% completion rates
  realistic: {
    name: "Realistic Scenario",
    description: "Moderate task times with realistic variation - should yield 65-80% completion rates",
    config: {
      rnCount: 120,
      cnaCount: 100,
      variabilityProfile: 'moderate'
    }
  },
  
  // Challenging: Higher task times, should yield 50-70% completion rates
  challenging: {
    name: "Challenging Scenario",
    description: "Higher task times with more variation - should yield 45-65% completion rates",
    config: {
      rnCount: 150,
      cnaCount: 120,
      variabilityProfile: 'high'
    }
  },

  // Mixed: Combination of all profiles
  mixed: {
    name: "Mixed Scenario",
    description: "Mix of all variability profiles - wide range of completion rates",
    config: {
      rnCount: 100,
      cnaCount: 80,
      variabilityProfile: 'moderate'
    }
  }
};

/**
 * Save test data to browser storage for persistence
 */
export function saveTestDataToStorage(scenario, data) {
  try {
    const testDataKey = 'nursing_survey_test_data';
    const testData = {
      scenario,
      data,
      timestamp: new Date().toISOString(),
      config: TEST_SCENARIOS[scenario]
    };
    localStorage.setItem(testDataKey, JSON.stringify(testData));
    console.log(`✅ Test data saved: ${scenario} scenario with ${data.length} responses`);
    return true;
  } catch (error) {
    console.error('Error saving test data:', error);
    return false;
  }
}

/**
 * Load test data from browser storage
 */
export function loadTestDataFromStorage() {
  try {
    const testDataKey = 'nursing_survey_test_data';
    const stored = localStorage.getItem(testDataKey);
    if (stored) {
      const testData = JSON.parse(stored);
      console.log(`📦 Loaded test data: ${testData.scenario} (${testData.data.length} responses)`);
      return testData;
    }
    return null;
  } catch (error) {
    console.error('Error loading test data:', error);
    return null;
  }
}

/**
 * Clear test data from storage
 */
export function clearTestData() {
  try {
    localStorage.removeItem('nursing_survey_test_data');
    console.log('🗑️  Test data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing test data:', error);
    return false;
  }
}

/**
 * Generate and save a specific test scenario
 */
export function generateAndSaveScenario(scenarioName) {
  const scenario = TEST_SCENARIOS[scenarioName];
  if (!scenario) {
    console.error(`Scenario '${scenarioName}' not found`);
    return null;
  }

  console.log(`🎲 Generating ${scenario.name}...`);
  const data = generateSimulatedData(scenario.config);
  saveTestDataToStorage(scenarioName, data);
  
  return {
    scenario: scenarioName,
    data,
    stats: generateSimulatedTaskStats(data)
  };
}