import React, { useState } from 'react';
import EmergencyClassification from './components/EmergencyClassification';
import LocationInput from './components/LocationInput';
import SituationAssessment from './components/SituationAssessment';
import EmergencyResponse from './components/EmergencyResponse';
import EmergencyDispatchDashboard from './components/EmergencyDispatchDashboard';
import VoiceEmergencyInterface from './components/VoiceEmergencyInterface';

type Step = 'voice' | 'classification' | 'location' | 'assessment' | 'response' | 'dispatch';

interface EmergencyData {
  emergencyType?: string;
  location?: {
    lat?: number;
    lng?: number;
    address: string;
  };
  assessment?: any;
}

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('voice');
  const [emergencyData, setEmergencyData] = useState<EmergencyData>({});

  const handleEmergencyDataCollected = (data: any) => {
    console.log('Emergency data collected:', data);
    setEmergencyData(data);
    setCurrentStep('dispatch');
  };

  const handleEmergencyTypeSelect = (type: string) => {
    setEmergencyData(prev => ({ ...prev, emergencyType: type }));
    setCurrentStep('location');
  };

  const handleLocationSet = (location: { lat?: number; lng?: number; address: string }) => {
    setEmergencyData(prev => ({ ...prev, location }));
  };

  const handleLocationNext = () => {
    setCurrentStep('assessment');
  };

  const handleAssessmentComplete = (assessment: any) => {
    setEmergencyData(prev => ({ ...prev, assessment }));
    setCurrentStep('response');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'voice':
        return (
          <VoiceEmergencyInterface 
            onEmergencyDataCollected={handleEmergencyDataCollected}
          />
        );
      case 'classification':
        return (
          <EmergencyClassification 
            onSelectEmergency={handleEmergencyTypeSelect}
          />
        );
      case 'location':
        return (
          <LocationInput 
            onLocationSet={handleLocationSet}
            onNext={handleLocationNext}
          />
        );
      case 'assessment':
        return (
          <SituationAssessment 
            emergencyType={emergencyData.emergencyType!}
            onAssessmentComplete={handleAssessmentComplete}
          />
        );
      case 'response':
        return (
          <EmergencyResponse 
            emergencyType={emergencyData.emergencyType!}
            location={emergencyData.location!}
            assessment={emergencyData.assessment!}
          />
        );
      case 'dispatch':
        return (
          <EmergencyDispatchDashboard 
            emergencyData={emergencyData}
          />
        );
      default:
        return (
          <VoiceEmergencyInterface 
            onEmergencyDataCollected={handleEmergencyDataCollected}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
}

export default App;