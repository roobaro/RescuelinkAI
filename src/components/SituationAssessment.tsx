import React, { useState } from 'react';
import { AlertTriangle, Users, Clock, Thermometer } from 'lucide-react';

interface SituationAssessmentProps {
  emergencyType: string;
  onAssessmentComplete: (assessment: any) => void;
}

const urgencyLevels = [
  { level: 5, label: 'Critical', color: 'bg-red-600', description: 'Life-threatening, immediate response required' },
  { level: 4, label: 'High', color: 'bg-red-500', description: 'Serious injury or immediate danger' },
  { level: 3, label: 'Medium', color: 'bg-yellow-500', description: 'Requires prompt attention' },
  { level: 2, label: 'Low', color: 'bg-blue-500', description: 'Non-urgent but needs response' },
  { level: 1, label: 'Minimal', color: 'bg-green-500', description: 'Advisory or information only' }
];

export default function SituationAssessment({ emergencyType, onAssessmentComplete }: SituationAssessmentProps) {
  const [assessment, setAssessment] = useState({
    urgencyLevel: 0,
    peopleInvolved: '',
    casualties: '',
    immediateHazards: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssessmentComplete(assessment);
  };

  const updateAssessment = (field: string, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  };

  const getEmergencyColor = () => {
    switch (emergencyType) {
      case 'medical': return 'text-blue-600';
      case 'fire': return 'text-orange-600';
      case 'crime': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className={`w-8 h-8 mr-2 ${getEmergencyColor()}`} />
          <h2 className="text-2xl font-bold text-gray-900">Situation Assessment</h2>
        </div>
        <p className="text-gray-600">Help us understand the severity and nature of the emergency</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Urgency Level */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Urgency Level <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgencyLevels.map((level) => (
              <button
                key={level.level}
                type="button"
                onClick={() => updateAssessment('urgencyLevel', level.level)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  assessment.urgencyLevel === level.level
                    ? `${level.color} text-white border-transparent`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{level.label}</span>
                  <span className="text-sm">Level {level.level}</span>
                </div>
                <p className={`text-sm ${
                  assessment.urgencyLevel === level.level ? 'text-white' : 'text-gray-600'
                }`}>
                  {level.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* People Involved */}
        <div className="space-y-2">
          <label htmlFor="people" className="block text-sm font-medium text-gray-700">
            <Users className="w-4 h-4 inline mr-1" />
            Number of People Involved
          </label>
          <input
            type="number"
            id="people"
            min="1"
            value={assessment.peopleInvolved}
            onChange={(e) => updateAssessment('peopleInvolved', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter number of people"
          />
        </div>

        {/* Casualties */}
        <div className="space-y-2">
          <label htmlFor="casualties" className="block text-sm font-medium text-gray-700">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Injured or Unconscious Persons
          </label>
          <input
            type="number"
            id="casualties"
            min="0"
            value={assessment.casualties}
            onChange={(e) => updateAssessment('casualties', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Number of injured/unconscious"
          />
        </div>

        {/* Immediate Hazards */}
        <div className="space-y-2">
          <label htmlFor="hazards" className="block text-sm font-medium text-gray-700">
            <Thermometer className="w-4 h-4 inline mr-1" />
            Immediate Hazards or Dangers
          </label>
          <textarea
            id="hazards"
            value={assessment.immediateHazards}
            onChange={(e) => updateAssessment('immediateHazards', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe any immediate dangers (fire, smoke, structural damage, etc.)"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4 inline mr-1" />
            Brief Description of the Situation
          </label>
          <textarea
            id="description"
            value={assessment.description}
            onChange={(e) => updateAssessment('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide a brief description of what happened and current situation"
          />
        </div>

        <button
          type="submit"
          disabled={!assessment.urgencyLevel}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
        >
          Initiate Emergency Response
        </button>
      </form>
    </div>
  );
}