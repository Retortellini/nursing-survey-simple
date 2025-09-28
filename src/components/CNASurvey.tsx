// src/components/CNASurvey.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurvey } from '../lib/supabase';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const CNASurvey = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [respondentInfo, setRespondentInfo] = useState({
    primaryShift: '',
    rotateShifts: false,
    experienceLevel: '',
    unitType: '',
    typicalPatientLoad: 0
  });

  const [responses, setResponses] = useState({});

  const taskSections = [
    {
      title: "Clinical Monitoring Tasks",
      tasks: [
        {
          name: "Vital Signs",
          description: "Complete set of vital signs including documentation",
          timeRange: "5-10"
        },
        {
          name: "I&O Monitoring",
          description: "Measuring and recording intake/output",
          timeRange: "5-10"
        },
        {
          name: "Safety Rounds",
          description: "Regular patient safety checks",
          timeRange: "5-10"
        }
      ]
    },
    {
      title: "Activities of Daily Living",
      tasks: [
        {
          name: "Patient Hygiene",
          description: "Complete or assisted bath/cleaning",
          timeRange: "15-30"
        },
        {
          name: "Toileting Assistance",
          description: "Helping patients with bathroom needs",
          timeRange: "5-15"
        },
        {
          name: "Feeding Assistance",
          description: "Helping patients with meals",
          timeRange: "10-25"
        },
        {
          name: "Patient Mobility",
          description: "Helping patients move/transfer",
          timeRange: "10-20"
        }
      ]
    },
    {
      title: "Room Management",
      tasks: [
        {
          name: "Room Turnover",
          description: "Preparing room for new patient",
          timeRange: "5-15"
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
        surveyType: 'cna',
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
      return respondentInfo.primaryShift && respondentInfo.experienceLevel && respondentInfo.typicalPatientLoad > 0;
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
      <p className="text-gray-600 mb-6">
        Your CNA task time data has been submitted successfully. This research contributes 
        to the understanding of nursing workload patterns and task completion times.
      </p>
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-emerald-800">
          <strong>Help expand this research!</strong> Share this survey with CNA and nursing colleagues 
          to build a larger dataset for workload analysis and research.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => {
            const currentUrl = window.location.origin;
            const surveyUrls = {
              rn: `${currentUrl}/survey/nurse`,
              cna: `${currentUrl}/survey/cna`
            };
            const text = `Help improve nursing workload management! Share your task time data:\n\nRN Survey: ${surveyUrls.rn}\nCNA Survey: ${surveyUrls.cna}\n\nYour anonymous input helps optimize staffing and patient care.`;
            
            if (navigator.share) {
              navigator.share({
                title: 'Nursing Workload Survey',
                text: text,
                url: currentUrl
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(text).then(() => {
                alert('Survey links copied to clipboard!');
              }).catch(() => {
                alert(`Share these survey links:\n\n${text}`);
              });
            }
          }}
          className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          📋 Share Survey with Colleagues
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>Your response is anonymous and helps create better working conditions for all nursing staff.</p>
      </div>
    </div>
  );
}

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (taskSections.length + 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">CNA Task Time Survey</h2>
            
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
                Experience Level <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border rounded-lg"
                value={respondentInfo.experienceLevel}
                onChange={(e) => setRespondentInfo({...respondentInfo, experienceLevel: e.target.value})}
              >
                <option value="">Select experience level...</option>
                <option value="0-1">Less than 1 year</option>
                <option value="1-2">1-2 years</option>
                <option value="2-5">2-5 years</option>
                <option value="5+">More than 5 years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Typical Patient Assignment <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border rounded-lg"
                value={respondentInfo.typicalPatientLoad}
                onChange={(e) => setRespondentInfo({...respondentInfo, typicalPatientLoad: parseInt(e.target.value)})}
              >
                <option value="0">Select typical patient load...</option>
                <option value="8">8 patients</option>
                <option value="10">10 patients</option>
                <option value="12">12 patients</option>
                <option value="14">14 patients</option>
                <option value="16">16 patients</option>
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
                <option value="ltc">Long-term Care</option>
                <option value="rehab">Rehabilitation</option>
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
              <div key={task.name} className="border-l-4 border-emerald-500 pl-4 py-2">
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
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 ml-auto"
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

export default CNASurvey;