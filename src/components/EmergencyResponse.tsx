import React, { useState, useEffect } from 'react';
import { Phone, Mic, MicOff, Volume2, Clock, MapPin, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

interface EmergencyResponseProps {
  emergencyType: string;
  location: any;
  assessment: any;
}

const EmergencyResponse: React.FC<EmergencyResponseProps> = ({ emergencyType, location, assessment }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'dispatched'>('connecting');
  const [instructions, setInstructions] = useState<string[]>([]);

  useEffect(() => {
    // Simulate connection and response process
    const timer1 = setTimeout(() => {
      setIsConnected(true);
      setStatus('connected');
      generateInstructions();
    }, 3000);

    const timer2 = setTimeout(() => {
      setStatus('dispatched');
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      const interval = setInterval(() => {
        setResponseTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const generateInstructions = () => {
    const baseInstructions = [
      "Emergency services have been notified and are on their way",
      "Stay calm and remain in a safe location",
      "Keep this line open for further instructions"
    ];

    const typeSpecificInstructions: { [key: string]: string[] } = {
      medical: [
        "Do not move the injured person unless they are in immediate danger",
        "If the person is conscious, keep them comfortable and talking",
        "Apply pressure to any bleeding wounds with clean cloth"
      ],
      fire: [
        "Evacuate the building immediately if safe to do so",
        "Stay low to avoid smoke if evacuating",
        "Do not use elevators, use stairs only"
      ],
      crime: [
        "Move to a secure location if possible",
        "Do not confront any suspects",
        "Preserve the scene if it's safe to do so"
      ],
      other: [
        "Follow any evacuation orders from authorities",
        "Stay away from damaged structures or hazardous areas",
        "Listen for updates from emergency services"
      ]
    };

    setInstructions([...baseInstructions, ...typeSpecificInstructions[emergencyType] || []]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = () => {
    if (assessment.urgencyLevel >= 4) return 'text-red-600';
    if (assessment.urgencyLevel >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEmergencyIcon = () => {
    switch (emergencyType) {
      case 'medical': return '🏥';
      case 'fire': return '🔥';
      case 'crime': return '🚨';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <div className="text-4xl mr-2">{getEmergencyIcon()}</div>
          <h2 className="text-2xl font-bold text-gray-900">Emergency Response Active</h2>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          status === 'connected' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {status === 'connecting' && <Loader className="w-4 h-4 mr-1 animate-spin" />}
          {status === 'connected' && <Phone className="w-4 h-4 mr-1" />}
          {status === 'dispatched' && <CheckCircle className="w-4 h-4 mr-1" />}
          {status === 'connecting' && 'Connecting to Emergency Services...'}
          {status === 'connected' && 'Connected to Emergency Services'}
          {status === 'dispatched' && 'Emergency Services Dispatched'}
        </div>
      </div>

      {/* Emergency Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <AlertTriangle className={`w-5 h-5 mr-2 ${getUrgencyColor()}`} />
              <span className="text-sm text-gray-600">Urgency Level:</span>
              <span className={`ml-2 font-medium ${getUrgencyColor()}`}>
                {assessment.urgencyLevel}/5
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Location:</span>
              <span className="ml-2 font-medium text-gray-900 truncate">
                {location.address}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Response Time:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatTime(responseTime)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {assessment.peopleInvolved && (
              <div className="text-sm">
                <span className="text-gray-600">People Involved:</span>
                <span className="ml-2 font-medium">{assessment.peopleInvolved}</span>
              </div>
            )}
            {assessment.casualties && (
              <div className="text-sm">
                <span className="text-gray-600">Casualties:</span>
                <span className="ml-2 font-medium text-red-600">{assessment.casualties}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voice Interface */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Communication</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full transition-colors ${
                isMuted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <div className={`inline-block w-16 h-16 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          } flex items-center justify-center`}>
            <Phone className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-gray-600">
            {isConnected ? 'Connected to Emergency Operator' : 'Connecting...'}
          </p>
          {isConnected && (
            <p className="text-xs text-gray-500">
              {isMuted ? 'Microphone muted' : 'Microphone active'}
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      {instructions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Emergency Instructions</h3>
          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">{instruction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Support Information</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• This session is being recorded for quality assurance</p>
          <p>• Emergency services have been automatically notified</p>
          <p>• Your location has been shared with responders</p>
          <p>• Stay on the line until help arrives</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyResponse;