// src/components/NurseSurvey.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurvey } from '../lib/supabase';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const NurseSurvey = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [respondentInfo, setRespondentInfo] = useState({
    primaryShift: '',
    rotateShifts: false,
    experienceLevel: '',
    unitType: ''
  });

  const [responses, setResponses] = useState({});

  const taskSections = [
    {
      title: "Mandatory RN Tasks",
      tasks: [
        {
          name: "Medication Administration",
          description: "Including preparation, administration, documentation, and follow-up",
          timeRange: "15-30"
        },
        {
          name: "Assessment & Documentation",
          description: "Complete patient assessment and documentation",
          timeRange: "20-35"
        },
        {
          name: "Handoff/Report",
          description: "Giving and receiving shift report",
          timeRange: "10-20"
        },
        {
          name: "Chart Review",
          description: "Review of patient charts and orders",
          timeRange: "10-15"
        }
      ]
    },
    {
      title: "Clinical Tasks",
      tasks: [
        {
          name: "Wound Care",
          description: "Assessment, treatment, and documentation of wounds",
          timeRange: "15-45"
        },
        {
          name: "IV Management",
          description: "IV starts, maintenance, and documentation",
          timeRange: "10-25"
        },
        {
          name: "Pain Management",
          description: "Assessment and interventions for pain",
          timeRange: "5-20"
        },
        {
          name: "Blood Administration",
          description: "Administration and monitoring of blood products",
          timeRange: "30-60"
        }
      ]
    },
    {
      title: "Patient Care & Education",
      tasks: [
        {
          name: "Patient Education",
          description: "Teaching patients and families",
          timeRange: "10-30"
        },
        {
          name: "Medication Counseling",
          description: "Education about medications",
          timeRange: "10-25"
        },
        {
          name: "Family Communication",
          description: "Updates and discussions with family",
          timeRange: "10-25"
        }
      ]
    }
  ];

  const handleTaskResponseChange = (taskName, field, value) => {
    setResponses(prev => ({
      ...prev,
      [taskName]: {
        ...(prev[taskName] || { minTime: '', maxTime: '', pattern: '', frequency: '', factors: [] }),
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitSurvey({
        surveyType: 'rn',
        respondentInfo,
        responses
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Error submitting survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return respondentInfo.primaryShift && respondentInfo.experienceLevel;
    }
    
    const section = taskSections[currentStep - 1];
    return section.tasks.every(task => {
      const resp = responses[task.name];
      return resp && resp.minTime && resp.maxTime && resp.pattern && resp.frequency;
    });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
        <p className="text-gray-600 mb-6">Your survey has been submitted successfully.</p>
        <button
          onClick={() => navigate('/results')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          View Results
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (taskSections.length + 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Nurse Task Time Survey</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Shift <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border rounded-lg"
                value={respondentInfo.primaryShift}
                onChange={(e) => setRespondentInfo({...respondentInfo, primaryShift: e.target.value})}
              >
                <option value="">Select your primary shift...</option>
                <option value="days">Days (7am - 3pm)</option>
                <option value="evenings">Evenings (3pm - 11pm)</option>
                <option value="nights">Nights/NOC (11pm - 7am)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border rounded-lg"
                value={respondentInfo.experienceLevel}
                onChange={(e) => setRespondentInfo({...respondentInfo, experienceLevel: e.target.value})}
              >
                <option value="">Select experience level...</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Unit Type</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={respondentInfo.unitType}
                onChange={(e) => setRespondentInfo({...respondentInfo, unitType: e.target.value})}
              >
                <option value="">Select unit type...</option>
                <option value="med-surg">Medical-Surgical</option>
                <option value="med-tele">Medical-Telemetry</option>
                <option value="icu">Intensive Care (ICU/CCU)</option>
                <option value="ed">Emergency Department</option>
                <option value="ob">Obstetrics/L&D</option>
                <option value="peds">Pediatrics</option>
                <option value="other">Other</option>
              </select>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={respondentInfo.rotateShifts}
                onChange={(e) => setRespondentInfo({...respondentInfo, rotateShifts: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">I regularly rotate between shifts</span>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">{taskSections[currentStep - 1].title}</h3>
            
            {taskSections[currentStep - 1].tasks.map(task => (
              <div key={task.name} className="border-l-4 border-indigo-500 pl-4 py-2">
                <h4 className="font-semibold">{task.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{task.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Min Time (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={task.timeRange.split('-')[0]}
                      className="w-full p-2 border rounded"
                      value={responses[task.name]?.minTime || ''}
                      onChange={(e) => handleTaskResponseChange(task.name, 'minTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Time (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={task.timeRange.split('-')[1]}
                      className="w-full p-2 border rounded"
                      value={responses[task.name]?.maxTime || ''}
                      onChange={(e) => handleTaskResponseChange(task.name, 'maxTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Time Pattern <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={responses[task.name]?.pattern || ''}
                    onChange={(e) => handleTaskResponseChange(task.name, 'pattern', e.target.value)}
                  >
                    <option value="">Select pattern...</option>
                    <option value="consistent">Consistent (Similar times usually)</option>
                    <option value="variable">Variable (Often differs)</option>
                    <option value="highly_variable">Highly Variable (Very unpredictable)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    How Often Does This Task Occur? <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={responses[task.name]?.frequency || ''}
                    onChange={(e) => handleTaskResponseChange(task.name, 'frequency', e.target.value)}
                  >
                    <option value="">Select frequency...</option>
                    <option value="1.0">Every patient, every shift (100%)</option>
                    <option value="0.75">Most patients (75%)</option>
                    <option value="0.5">About half the patients (50%)</option>
                    <option value="0.25">Occasionally (25%)</option>
                    <option value="0.1">Rarely (10%)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          )}

          {currentStep < taskSections.length ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 ml-auto"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 ml-auto"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseSurvey;