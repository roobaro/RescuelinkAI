import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, AlertTriangle, MapPin, Users, Clock, Shield, CheckCircle, Loader, PhoneCall } from 'lucide-react';
import { useVapi } from '../hooks/useVapi';

interface VoiceEmergencyInterfaceProps {
  onEmergencyDataCollected: (data: any) => void;
}

export default function VoiceEmergencyInterface({ onEmergencyDataCollected }: VoiceEmergencyInterfaceProps) {
  const {
    startCall,
    endCall,
    toggleMute,
    isSessionActive,
    isMuted,
    emergencyData,
    transcript,
    callStatus,
    dispatchStatus,
    submitToEmergencyServices
  } = useVapi();

  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // Auto-submit when emergency data is collected and dispatch is complete
    if (emergencyData.emergencyType && dispatchStatus === 'dispatched' && !hasSubmitted) {
      onEmergencyDataCollected(emergencyData);
      setHasSubmitted(true);
    }
  }, [emergencyData, dispatchStatus, hasSubmitted, onEmergencyDataCollected]);

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'bg-yellow-500';
      case 'connected': return 'bg-green-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting to Emergency Services...';
      case 'connected': return 'Connected - Speak clearly';
      case 'ended': return 'Call Ended';
      default: return 'Ready to Connect';
    }
  };

  const getDispatchStatusColor = () => {
    switch (dispatchStatus) {
      case 'dispatching': return 'bg-blue-500';
      case 'dispatched': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getDispatchStatusText = () => {
    switch (dispatchStatus) {
      case 'dispatching': return 'Calling Emergency Services at +91 9714766855...';
      case 'dispatched': return 'Emergency Services Called Successfully';
      case 'failed': return 'Emergency Call Failed - Retry Required';
      default: return 'Awaiting Emergency Data';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-6 rounded-full">
            <Phone className="w-16 h-16 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Voice Emergency Response</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Speak naturally with our AI assistant to report your emergency. We'll collect all necessary details and automatically call emergency services at <span className="font-mono font-bold text-blue-600">+91 9714766855</span>.
        </p>
      </div>

      {/* Voice Interface */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="text-center space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${isSessionActive ? 'animate-pulse' : ''}`}></div>
            <span className="text-lg font-medium text-gray-700">{getStatusText()}</span>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isSessionActive ? (
              <button
                onClick={startCall}
                className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Phone className="w-8 h-8" />
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-colors ${
                    isMuted 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={endCall}
                  className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
                
                <button className="p-4 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <Volume2 className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
            <div className="space-y-2 text-sm text-blue-800 text-left">
              <p>• Click the red phone button to start speaking with our AI assistant</p>
              <p>• Describe your emergency clearly - the AI will ask follow-up questions</p>
              <p>• Provide your location, number of people involved, and urgency level</p>
              <p>• Emergency services will automatically call <span className="font-mono font-bold">+91 9714766855</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Dispatch Status */}
      {dispatchStatus !== 'idle' && (
        <div className={`${getDispatchStatusColor()} text-white rounded-xl p-6 text-center`}>
          <div className="flex items-center justify-center space-x-3 mb-2">
            {dispatchStatus === 'dispatching' && <Loader className="w-5 h-5 animate-spin" />}
            {dispatchStatus === 'dispatched' && <PhoneCall className="w-5 h-5" />}
            {dispatchStatus === 'failed' && <AlertTriangle className="w-5 h-5" />}
            <h3 className="text-xl font-bold">{getDispatchStatusText()}</h3>
          </div>
          {dispatchStatus === 'dispatched' && emergencyData.servicesContacted && (
            <div className="space-y-1 text-white/90">
              <p>Services Contacted: {emergencyData.servicesContacted.join(', ')}</p>
              <p className="font-mono text-sm">Emergency services will call: +91 9714766855</p>
              {emergencyData.estimatedArrival && (
                <p>Estimated Arrival: {emergencyData.estimatedArrival} minutes</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Transcript */}
      {transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Conversation Transcript</h3>
          <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      {/* Collected Emergency Data */}
      {emergencyData.emergencyType && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Emergency Information Collected</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                <span className="text-sm text-gray-600">Emergency Type:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{emergencyData.emergencyType}</span>
              </div>
              
              {emergencyData.location && (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="ml-2 font-medium text-gray-900">{emergencyData.location.address}</span>
                </div>
              )}
              
              {emergencyData.urgencyLevel && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                  <span className="text-sm text-gray-600">Urgency Level:</span>
                  <span className="ml-2 font-medium text-gray-900">{emergencyData.urgencyLevel}/5</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {emergencyData.peopleInvolved && (
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-sm text-gray-600">People Involved:</span>
                  <span className="ml-2 font-medium text-gray-900">{emergencyData.peopleInvolved}</span>
                </div>
              )}
              
              {emergencyData.casualties && (
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  <span className="text-sm text-gray-600">Casualties:</span>
                  <span className="ml-2 font-medium text-red-600">{emergencyData.casualties}</span>
                </div>
              )}

              {emergencyData.dispatchId && (
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  <span className="text-sm text-gray-600">Dispatch ID:</span>
                  <span className="ml-2 font-medium text-gray-900 font-mono text-xs">{emergencyData.dispatchId}</span>
                </div>
              )}
            </div>
          </div>
          
          {emergencyData.description && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
              <p className="text-sm text-gray-700">{emergencyData.description}</p>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <div className="flex items-center">
              <PhoneCall className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800 font-medium">
                {dispatchStatus === 'dispatched' 
                  ? '✅ Emergency services have been called and will contact +91 9714766855'
                  : '⏳ Calling emergency services with this information...'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            <strong>Life-threatening emergency?</strong> Call 112 (India Emergency) immediately while using this system for additional support and coordination.
          </p>
        </div>
      </div>

      {/* Test Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Testing Information</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• This is a test system configured for India (+91 country code)</p>
          <p>• Emergency services will call: <span className="font-mono font-bold">+91 9714766855</span></p>
          <p>• All emergency calls will be made using Vapi voice technology</p>
          <p>• Real emergency services integration ready for production deployment</p>
        </div>
      </div>
    </div>
  );
}