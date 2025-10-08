// src/lib/testData.js - FIXED VERSION with Corrected Emergency Frequencies

const RN_TASKS = [
  { name: "Medication Administration", minRange: [10, 15], maxRange: [25, 35], frequency: 0.95 },
  { name: "Assessment & Documentation", minRange: [15, 20], maxRange: [30, 40], frequency: 0.90 },
  { name: "Handoff/Report", minRange: [8, 12], maxRange: [15, 25], frequency: 1.0 },
  { name: "Chart Review", minRange: [8, 12], maxRange: [12, 18], frequency: 0.85 },
  { name: "I/O's", minRange: [3, 6], maxRange: [8, 12], frequency: 0.30 },
  { name: "Wound Care", minRange: [10, 20], maxRange: [30, 50], frequency: 0.20 },
  { name: "IV Management", minRange: [8, 15], maxRange: [20, 30], frequency: 0.35 },
  { name: "Pain Management", minRange: [3, 8], maxRange: [15, 25], frequency: 0.40 },
  { name: "Blood Administration", minRange: [25, 35], maxRange: [50, 70], frequency: 0.05 },
  { name: "Turns", minRange: [3, 6], maxRange: [10, 18], frequency: 0.50 },
  { name: "Patient Education", minRange: [8, 12], maxRange: [20, 35], frequency: 0.30 },
  { name: "Medication Counseling", minRange: [8, 12], maxRange: [20, 30], frequency: 0.25 },
  { name: "Family Communication", minRange: [8, 12], maxRange: [20, 30], frequency: 0.35 },
  { name: "Tooth Brushing", minRange: [3, 6], maxRange: [10, 18], frequency: 0.20 },
  { name: "Ambulation", minRange: [8, 12], maxRange: [15, 25], frequency: 0.40 },
  { name: "Out Of Bed For Meals", minRange: [8, 12], maxRange: [15, 25], frequency: 0.45 },
  { name: "Code Blue", minRange: [25, 35], maxRange: [50, 70], frequency: 0.005 }, // ⚠️ CHANGED: 0.5% instead of 1%
  { name: "Rapid Response", minRange: [12, 18], maxRange: [30, 50], frequency: 0.01 }, // ⚠️ CHANGED: 1% instead of 2%
  { name: "M.D. Rounds", minRange: [12, 18], maxRange: [25, 35], frequency: 0.45 }
];

const CNA_TASKS = [
  { name: "Vital Signs", minRange: [3, 6], maxRange: [8, 12], frequency: 0.90 },
  { name: "I&O Monitoring", minRange: [3, 6], maxRange: [8, 12], frequency: 0.60 },
  { name: "Safety Rounds", minRange: [3, 6], maxRange: [8, 12], frequency: 0.70 },
  { name: "Patient Hygiene", minRange: [12, 18], maxRange: [25, 35], frequency: 0.50 },
  { name: "Toileting Assistance", minRange: [3, 8], maxRange: [10, 18], frequency: 0.65 },
  { name: "Feeding Assistance", minRange: [8, 12], maxRange: [20, 30], frequency: 0.55 },
  { name: "Patient Mobility", minRange: [8, 12], maxRange: [15, 25], frequency: 0.50 },
  { name: "Room Turnover", minRange: [3, 8], maxRange: [10, 18], frequency: 0.20 }
];

function randomInRange(min, max, variability = 0.2) {
  const center = (min + max) / 2;
  const spread = (max - min) / 2;
  const variance = spread * variability;
  return Math.max(min, Math.min(max, center + (Math.random() - 0.5) * 2 * variance));
}

export function generateSimulatedData(options = {}) {
  const {
    rnCount = 100,
    cnaCount = 80,
    experienceLevels = ['0-2', '3-5', '6-10', '10+'],
    shifts = ['days', 'evenings', 'nights'],
    unitTypes = ['med-surg', 'med-tele', 'icu', 'ed'],
    variabilityProfile = 'moderate'
  } = options;

  const variabilityMap = {
    'consistent': 0.1,
    'moderate': 0.25,
    'high': 0.4
  };

  const variability = variabilityMap[variabilityProfile] || 0.25;
  const responses = [];

  // Generate RN responses
  for (let i = 0; i < rnCount; i++) {
    const taskResponses = {};
    
    RN_TASKS.forEach(task => {
      const minTime = randomInRange(task.minRange[0], task.minRange[1], variability);
      const maxTime = randomInRange(task.maxRange[0], task.maxRange[1], variability);
      
      // ⚠️ FIXED: Improved frequency variation logic
      let frequencyVariation;
      if (task.frequency < 0.01) {
        // For extremely rare events (< 1%), use MINIMAL variation (±5% of base value)
        // This keeps 0.005 as 0.005 ± 0.00025 (so 0.00475 to 0.00525)
        frequencyVariation = task.frequency * (Math.random() - 0.5) * 0.1;
      } else if (task.frequency < 0.05) {
        // For very rare events (1-5%), use TINY variation (±10% of base value)
        frequencyVariation = task.frequency * (Math.random() - 0.5) * 0.2;
      } else if (task.frequency < 0.30) {
        // For occasional events (5-30%), use ±5% absolute
        frequencyVariation = (Math.random() - 0.5) * 0.1;
      } else {
        // For common events (>30%), use ±10% absolute
        frequencyVariation = (Math.random() - 0.5) * 0.2;
      }
      const frequency = Math.max(0.001, Math.min(1.0, task.frequency + frequencyVariation));
      
      taskResponses[task.name] = {
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        frequency: frequency.toFixed(3), // ⚠️ CHANGED: 3 decimals for precision on rare events
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
      quality_score: Math.round(70 + Math.random() * 30),
      flagged_for_review: false
    });
  }

  // Generate CNA responses
  for (let i = 0; i < cnaCount; i++) {
    const taskResponses = {};
    
    CNA_TASKS.forEach(task => {
      const minTime = randomInRange(task.minRange[0], task.minRange[1], variability);
      const maxTime = randomInRange(task.maxRange[0], task.maxRange[1], variability);
      
      // Add realistic frequency variation
      let frequencyVariation;
      if (task.frequency < 0.01) {
        // For extremely rare events (< 1%), minimal variation
        frequencyVariation = task.frequency * (Math.random() - 0.5) * 0.1;
      } else if (task.frequency < 0.10) {
        // For rare events, use ±20% of the base value
        frequencyVariation = task.frequency * (Math.random() - 0.5) * 0.4;
      } else {
        // For common events, use ±10% absolute
        frequencyVariation = (Math.random() - 0.5) * 0.2;
      }
      const frequency = Math.max(0.001, Math.min(1.0, task.frequency + frequencyVariation));
      
      taskResponses[task.name] = {
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        frequency: frequency.toFixed(3),
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
    
    const mean = (avgMinTime + avgMaxTime) / 2;
    const variance = stat.maxTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / stat.maxTimes.length;
    const stdDev = Math.sqrt(variance);

    return {
      task_name: stat.task_name,
      avg_min_time: Math.round(avgMinTime * 10) / 10,
      avg_max_time: Math.round(avgMaxTime * 10) / 10,
      std_dev: Math.round(stdDev * 10) / 10,
      avg_frequency: Math.round(avgFrequency * 1000) / 1000, // ⚠️ CHANGED: 3 decimal precision
      response_count: stat.minTimes.length
    };
  }).filter(stat => stat.response_count >= 3);
}

export const TEST_SCENARIOS = {
  optimistic: {
    name: "Optimistic Scenario",
    description: "Lower average task times with realistic frequencies - should yield 75-90% completion rates",
    config: {
      rnCount: 100,
      cnaCount: 80,
      variabilityProfile: 'consistent'
    }
  },
  
  realistic: {
    name: "Realistic Scenario",
    description: "Moderate task times with realistic variation - should yield 60-75% completion rates",
    config: {
      rnCount: 120,
      cnaCount: 100,
      variabilityProfile: 'moderate'
    }
  },
  
  challenging: {
    name: "Challenging Scenario",
    description: "Higher task times with more variation - should yield 40-60% completion rates",
    config: {
      rnCount: 150,
      cnaCount: 120,
      variabilityProfile: 'high'
    }
  }
};

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