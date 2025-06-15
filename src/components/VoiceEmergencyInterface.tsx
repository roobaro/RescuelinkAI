import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, AlertTriangle, MapPin, Users, Clock, Shield, CheckCircle, Loader, PhoneCall, ArrowRight, XCircle } from 'lucide-react';
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
    vapiErrorMessage,
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
      case 'transferring': return 'bg-blue-500';
      case 'transferred': return 'bg-purple-500';
      case 'ended': return vapiErrorMessage ? 'bg-red-500' : 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting to Emergency Services...';
      case 'connected': return 'Connected - Speak clearly';
      case 'transferring': return 'Transferring to Emergency Services...';
      case 'transferred': return 'Transferred to Emergency Services';
      case 'ended': return vapiErrorMessage ? 'Call Error' : 'Call Ended';
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
      case 'dispatching': return 'Transferring call to +91 9714766855...';
      case 'dispatched': return 'Call transferred successfully to Emergency Services';
      case 'failed': return 'Transfer failed - Emergency services notified separately';
      default: return 'Awaiting Emergency Data';
    }
  };

  const twilioNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+14177644087';
  const emergencyNumber = import.meta.env.VITE_EMERGENCY_CONTACT_NUMBER || '+919714766855';

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
          Speak naturally with our AI assistant to report your emergency. We'll collect all necessary details and transfer you directly to emergency services.
        </p>
        
        {/* Call Transfer Flow */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-3xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">Call Transfer Process:</h3>
          <div className="flex items-center justify-center space-x-2 text-sm text-blue-800">
            <div className="flex items-center space-x-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">1</span>
              </div>
              <span>AI Assistant</span>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="flex items-center space-x-1">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">2</span>
              </div>
              <span>Twilio ({twilioNumber})</span>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="flex items-center space-x-1">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">3</span>
              </div>
              <span>Emergency ({emergencyNumber})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Interface */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="text-center space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${isSessionActive ? 'animate-pulse' : ''}`}></div>
            <span className="text-lg font-medium text-gray-700">{getStatusText()}</span>
          </div>

          {/* Error Message Display */}
          {vapiErrorMessage && callStatus === 'ended' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Call Error</h3>
              </div>
              <p className="text-red-800 text-sm mb-3">{vapiErrorMessage}</p>
              <div className="space-y-2 text-xs text-red-700">
                <p><strong>Troubleshooting tips:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Check your internet connection and try again</li>
                  <li>Ensure microphone permissions are granted</li>
                  <li>If the problem persists, contact support</li>
                  <li>For immediate emergencies, call 112 directly</li>
                </ul>
              </div>
              <button
                onClick={startCall}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

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
              <p>• Once data is collected, you'll be transferred directly to emergency services</p>
              <p>• The call will be bridged from Twilio ({twilioNumber}) to emergency services ({emergencyNumber})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Transfer Status */}
      {(callStatus === 'transferring' || callStatus === 'transferred') && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            {callStatus === 'transferring' && <Loader className="w-6 h-6 animate-spin" />}
            {callStatus === 'transferred' && <PhoneCall className="w-6 h-6" />}
            <h3 className="text-xl font-bold">
              {callStatus === 'transferring' ? 'Transferring Call...' : 'Call Transferred Successfully'}
            </h3>
          </div>
          
          <div className="space-y-2 text-white/90">
            <p>Your call is being transferred to emergency services</p>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span>From: {twilioNumber}</span>
              <ArrowRight className="w-4 h-4" />
              <span>To: {emergencyNumber}</span>
            </div>
            {callStatus === 'transferred' && (
              <p className="text-sm mt-3 bg-white/20 rounded-lg p-2">
                ✅ You are now connected directly to emergency services. Stay on the line.
              </p>
            )}
          </div>
        </div>
      )}

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
              <p className="font-mono text-sm">Call transferred to: {emergencyNumber}</p>
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
                {callStatus === 'transferred' 
                  ? '✅ You are now connected directly to emergency services'
                  : dispatchStatus === 'dispatched' 
                  ? '✅ Call transfer initiated - connecting to emergency services'
                  : '⏳ Preparing to transfer call to emergency services...'
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

      {/* Configuration Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Call Transfer Configuration</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• Twilio Number: <span className="font-mono font-bold">{twilioNumber}</span></p>
          <p>• Emergency Contact: <span className="font-mono font-bold">{emergencyNumber}</span></p>
          <p>• Transfer Method: Direct call bridging via Twilio</p>
          <p>• This system will transfer your call directly to emergency services after collecting information</p>
        </div>
      </div>
    </div>
  );
}