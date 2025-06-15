import React from 'react';
import { AlertTriangle, Heart, Flame, Shield, HelpCircle } from 'lucide-react';

interface EmergencyType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}

const emergencyTypes: EmergencyType[] = [
  {
    id: 'medical',
    name: 'Medical Emergency',
    icon: Heart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    description: 'Heart attack, stroke, severe injury, unconsciousness'
  },
  {
    id: 'fire',
    name: 'Fire Emergency',
    icon: Flame,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    description: 'Fire, smoke, gas leak, explosion hazard'
  },
  {
    id: 'crime',
    name: 'Security Emergency',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    description: 'Break-in, assault, theft, suspicious activity'
  },
  {
    id: 'other',
    name: 'Other Emergency',
    icon: HelpCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    description: 'Natural disaster, accident, other urgent situations'
  }
];

interface EmergencyClassificationProps {
  onSelectEmergency: (type: string) => void;
}

export default function EmergencyClassification({ onSelectEmergency }: EmergencyClassificationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Emergency Classification</h2>
        </div>
        <p className="text-gray-600">Select the type of emergency you're reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emergencyTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelectEmergency(type.id)}
              className={`${type.bgColor} border-2 rounded-xl p-6 text-left transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-white shadow-sm ${type.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{type.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            <strong>Life-threatening emergency?</strong> Call 911 immediately while using this system for additional support.
          </p>
        </div>
      </div>
    </div>
  );
}