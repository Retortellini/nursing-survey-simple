// src/components/DataModeSwitcher.tsx
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  TestTube, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Settings,
  Download,
  Trash2
} from 'lucide-react';
import {
  TEST_SCENARIOS,
  generateAndSaveScenario,
  loadTestDataFromStorage,
  clearTestData,
  generateSimulatedData,
  generateSimulatedTaskStats
} from '../lib/testData';
import { getDataMode, setDataMode, isTestMode } from '../lib/supabase';

export const DataModeSwitcher = () => {
  const [currentMode, setCurrentMode] = useState('production');
  const [testDataInfo, setTestDataInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    loadCurrentState();
  }, []);

  const loadCurrentState = () => {
    const mode = getDataMode();
    setCurrentMode(mode);
    
    if (mode === 'test') {
      const testData = loadTestDataFromStorage();
      setTestDataInfo(testData);
    }
  };

  const handleModeSwitch = async (mode) => {
    setLoading(true);
    try {
      setDataMode(mode);
      setCurrentMode(mode);
      
      if (mode === 'test') {
        // Check if test data exists
        const testData = loadTestDataFromStorage();
        if (!testData) {
          // Generate default realistic scenario
          generateAndSaveScenario('realistic');
          const newTestData = loadTestDataFromStorage();
          setTestDataInfo(newTestData);
        } else {
          setTestDataInfo(testData);
        }
        alert('✅ Switched to TEST MODE\n\nUsing simulated data. Real survey data is not affected.');
      } else {
        setTestDataInfo(null);
        alert('✅ Switched to PRODUCTION MODE\n\nUsing real survey data from database.');
      }
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Error switching mode:', error);
      alert('Error switching data mode');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScenario = (scenarioName) => {
    setLoading(true);
    try {
      const result = generateAndSaveScenario(scenarioName);
      setTestDataInfo(loadTestDataFromStorage());
      alert(`✅ Generated ${TEST_SCENARIOS[scenarioName].name}\n\n${result.data.length} responses created`);
      window.location.reload();
    } catch (error) {
      console.error('Error generating scenario:', error);
      alert('Error generating test data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTestData = () => {
    if (confirm('Are you sure you want to clear all test data?')) {
      clearTestData();
      setTestDataInfo(null);
      if (currentMode === 'test') {
        handleModeSwitch('production');
      }
    }
  };

  const handleExportTestData = () => {
    const testData = loadTestDataFromStorage();
    if (!testData) {
      alert('No test data to export');
      return;
    }

    const dataStr = JSON.stringify(testData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-data-${testData.scenario}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50 ${
          currentMode === 'test' 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
        title={`Current Mode: ${currentMode.toUpperCase()}`}
      >
        {currentMode === 'test' ? (
          <TestTube className="h-6 w-6" />
        ) : (
          <Database className="h-6 w-6" />
        )}
      </button>

      {/* Settings Panel */}
      {showPanel && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <h3 className="font-semibold">Data Mode</h3>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="text-white hover:bg-white/20 rounded p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Current Status */}
            <div className={`p-3 rounded-lg border-2 ${
              currentMode === 'test' 
                ? 'bg-orange-50 border-orange-300' 
                : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-center gap-2">
                {currentMode === 'test' ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">TEST MODE ACTIVE</p>
                      <p className="text-xs text-orange-700">Using simulated data</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">PRODUCTION MODE</p>
                      <p className="text-xs text-green-700">Using real survey data</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Switch Data Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleModeSwitch('production')}
                  disabled={loading || currentMode === 'production'}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentMode === 'production'
                      ? 'bg-green-100 border-green-500 text-green-900'
                      : 'bg-white border-gray-300 hover:border-green-500'
                  } disabled:opacity-50`}
                >
                  <Database className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Production</p>
                </button>

                <button
                  onClick={() => handleModeSwitch('test')}
                  disabled={loading || currentMode === 'test'}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentMode === 'test'
                      ? 'bg-orange-100 border-orange-500 text-orange-900'
                      : 'bg-white border-gray-300 hover:border-orange-500'
                  } disabled:opacity-50`}
                >
                  <TestTube className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Test</p>
                </button>
              </div>
            </div>

            {/* Test Data Info */}
            {currentMode === 'test' && testDataInfo && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs font-medium text-gray-700 mb-2">Current Test Data:</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Scenario:</strong> {TEST_SCENARIOS[testDataInfo.scenario]?.name || testDataInfo.scenario}</p>
                  <p><strong>Responses:</strong> {testDataInfo.data?.length || 0}</p>
                  <p><strong>Generated:</strong> {new Date(testDataInfo.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Test Scenario Generator */}
            {currentMode === 'test' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generate Test Scenario
                </label>
                <div className="space-y-2">
                  {Object.entries(TEST_SCENARIOS).map(([key, scenario]) => (
                    <button
                      key={key}
                      onClick={() => handleGenerateScenario(key)}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{scenario.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {currentMode === 'test' && testDataInfo && (
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={handleExportTestData}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={handleClearTestData}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              </div>
            )}

            {/* Warning */}
            {currentMode === 'test' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Remember:</strong> Switch back to Production mode before sharing results or making decisions based on the data.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};