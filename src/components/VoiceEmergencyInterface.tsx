import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, AlertTriangle, MapPin, Users, Clock, Shield, CheckCircle, Loader, PhoneCall, ArrowRight, XCircle, Radio, Zap, Activity } from 'lucide-react';
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
    transferStatus,
    emergencyServiceCall,
    connectionPersistence
  } = useVapi();

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState({
    userConnection: 'stable',
    emergencyServiceConnection: 'idle',
    lastHealthCheck: Date.now()
  });

  useEffect(() => {
    // Auto-submit when emergency data is collected and dispatch is complete
    if (emergencyData.emergencyType && dispatchStatus === 'dispatched' && !hasSubmitted) {
      onEmergencyDataCollected(emergencyData);
      setHasSubmitted(true);
    }
  }, [emergencyData, dispatchStatus, hasSubmitted, onEmergencyDataCollected]);

  // Monitor connection health
  useEffect(() => {
    const healthInterval = setInterval(() => {
      setConnectionHealth(prev => ({
        ...prev,
        userConnection: isSessionActive ? 'stable' : 'disconnected',
        emergencyServiceConnection: transferStatus.emergencyServiceConnected ? 'connected' : 
                                   transferStatus.status === 'connecting' ? 'connecting' : 'idle',
        lastHealthCheck: Date.now()
      }));
    }, 5000);

    return () => clearInterval(healthInterval);
  }, [isSessionActive, transferStatus]);

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
      case 'connecting': return 'Connecting to Emergency System...';
      case 'connected': return 'Emergency System Active - Speak clearly';
      case 'transferring': return 'Connecting to Emergency Services...';
      case 'transferred': return 'Connected to Emergency Services';
      case 'ended': return vapiErrorMessage ? 'Emergency System Error' : 'Call Ended';
      default: return 'Emergency System Ready';
    }
  };

  const getTransferStatusColor = () => {
    switch (transferStatus.status) {
      case 'initiating': return 'bg-yellow-500';
      case 'connecting': return 'bg-blue-500';
      case 'connected': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getTransferStatusText = () => {
    switch (transferStatus.status) {
      case 'initiating': return 'Initiating Emergency Transfer...';
      case 'connecting': return 'Connecting to Emergency Services...';
      case 'connected': return 'Emergency Services Connected';
      case 'failed': return `Transfer Failed (Attempt ${transferStatus.attempts}/3)`;
      case 'completed': return 'Emergency Transfer Complete';
      default: return 'Transfer Ready';
    }
  };

  const twilioNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+14177644087';
  const emergencyNumber = import.meta.env.VITE_EMERGENCY_CONTACT_NUMBER || '+919714766855';

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-6 rounded-full relative">
            <Phone className="w-16 h-16 text-red-600" />
            {isSessionActive && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Activity className="w-3 h-3 text-white animate-pulse" />
              </div>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Emergency Response System</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI-powered emergency coordination with real-time call transfer, persistent connections, and comprehensive error handling for critical situations.
        </p>
        
        {/* Enhanced Call Transfer Flow */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-4xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">Emergency Call Protocol:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-center">1. AI Emergency Assistant</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Radio className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-center">2. Data Collection & Dispatch</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <PhoneCall className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-center">3. Concurrent Emergency Call</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-center">4. Three-Way Communication</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Dashboard */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Connection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">User Connection</span>
              <div className={`w-3 h-3 rounded-full ${
                connectionHealth.userConnection === 'stable' ? 'bg-green-500' : 
                connectionHealth.userConnection === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              } ${isSessionActive ? 'animate-pulse' : ''}`}></div>
            </div>
            <p className="text-xs text-gray-600 capitalize">{connectionHealth.userConnection}</p>
          </div>

          {/* Emergency Service Connection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Emergency Services</span>
              <div className={`w-3 h-3 rounded-full ${
                connectionHealth.emergencyServiceConnection === 'connected' ? 'bg-green-500' : 
                connectionHealth.emergencyServiceConnection === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>
            <p className="text-xs text-gray-600 capitalize">{connectionHealth.emergencyServiceConnection}</p>
          </div>

          {/* Three-Way Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Three-Way Active</span>
              <div className={`w-3 h-3 rounded-full ${
                transferStatus.threeWayActive ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>
            <p className="text-xs text-gray-600">{transferStatus.threeWayActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      {/* Voice Interface */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="text-center space-y-6">
          {/* Enhanced Status Indicator */}
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${isSessionActive ? 'animate-pulse' : ''}`}></div>
            <span className="text-lg font-medium text-gray-700">{getStatusText()}</span>
            {transferStatus.attempts > 0 && (
              <span className="text-sm text-gray-500">
                (Transfer Attempts: {transferStatus.attempts}/3)
              </span>
            )}
          </div>

          {/* Error Message Display */}
          {vapiErrorMessage && callStatus === 'ended' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Emergency System Error</h3>
              </div>
              <p className="text-red-800 text-sm mb-3">{vapiErrorMessage}</p>
              <div className="space-y-2 text-xs text-red-700">
                <p><strong>Emergency Troubleshooting:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>For immediate life-threatening emergencies, call 112 directly</li>
                  <li>Check internet connection and microphone permissions</li>
                  <li>System will auto-retry for emergency situations</li>
                  <li>Emergency services have been notified via backup systems</li>
                </ul>
              </div>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={startCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Retry Emergency System
                </button>
                <a
                  href="tel:112"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Call 112 Directly
                </a>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isSessionActive ? (
              <button
                onClick={startCall}
                className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full transition-all duration-200 hover:scale-105 shadow-lg relative"
              >
                <Phone className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Zap className="w-2 h-2 text-white" />
                </div>
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
                  title={transferStatus.threeWayActive ? 'Muting during emergency call' : 'Toggle microphone'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={endCall}
                  className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
                  title={transferStatus.status !== 'idle' ? 'Warning: Ending emergency call' : 'End call'}
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
                
                <button className="p-4 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <Volume2 className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Enhanced Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Emergency System Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 text-left">
              <div className="space-y-2">
                <p>• <strong>Instant Emergency Detection:</strong> Say "emergency" or "help" for immediate response</p>
                <p>• <strong>Persistent Connections:</strong> Maintains all connections until help arrives</p>
                <p>• <strong>Auto-Retry:</strong> Automatically retries failed transfers (up to 3 attempts)</p>
              </div>
              <div className="space-y-2">
                <p>• <strong>Three-Way Communication:</strong> Enables direct communication with emergency services</p>
                <p>• <strong>Real-Time Monitoring:</strong> Continuous connection health monitoring</p>
                <p>• <strong>Backup Systems:</strong> Multiple redundancy measures for critical situations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Status Display */}
      {transferStatus.status !== 'idle' && (
        <div className={`${getTransferStatusColor()} text-white rounded-xl p-6 text-center`}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            {transferStatus.status === 'connecting' && <Loader className="w-6 h-6 animate-spin" />}
            {transferStatus.status === 'connected' && <PhoneCall className="w-6 h-6" />}
            {transferStatus.status === 'failed' && <AlertTriangle className="w-6 h-6" />}
            <h3 className="text-xl font-bold">{getTransferStatusText()}</h3>
          </div>
          
          <div className="space-y-2 text-white/90">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span>User: {transferStatus.userConnected ? '✅ Connected' : '❌ Disconnected'}</span>
              <span>Emergency: {transferStatus.emergencyServiceConnected ? '✅ Connected' : '⏳ Connecting'}</span>
              <span>Three-Way: {transferStatus.threeWayActive ? '✅ Active' : '⏳ Pending'}</span>
            </div>
            
            {transferStatus.lastError && (
              <p className="text-sm bg-white/20 rounded-lg p-2 mt-2">
                Last Error: {transferStatus.lastError}
              </p>
            )}
            
            {emergencyServiceCall && (
              <div className="text-sm mt-3 bg-white/20 rounded-lg p-2">
                <p>Emergency Call ID: {emergencyServiceCall.callId}</p>
                <p>Connected to: {emergencyNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Transcript */}
      {transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Live Emergency Transcript</h3>
          <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
          </div>
          {transferStatus.threeWayActive && (
            <p className="text-xs text-green-600 mt-2">
              ✅ This conversation is being shared with emergency services in real-time
            </p>
          )}
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

              {emergencyData.transferAttempts && (
                <div className="flex items-center">
                  <Radio className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-sm text-gray-600">Transfer Attempts:</span>
                  <span className="ml-2 font-medium text-gray-900">{emergencyData.transferAttempts}/3</span>
                </div>
              )}
            </div>
          </div>
          
          {emergencyData.description && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Situation Description:</h4>
              <p className="text-sm text-gray-700">{emergencyData.description}</p>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <div className="flex items-center">
              <PhoneCall className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800 font-medium">
                {transferStatus.threeWayActive 
                  ? '✅ Three-way communication active with emergency services'
                  : transferStatus.emergencyServiceConnected
                  ? '✅ Emergency services connected - establishing three-way communication'
                  : transferStatus.status === 'connecting'
                  ? '⏳ Connecting to emergency services...'
                  : '📞 Emergency services will be contacted immediately'
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
            <strong>Life-threatening emergency?</strong> Call 112 (India Emergency) immediately. This system provides additional support and coordination.
          </p>
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Emergency System Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="space-y-1">
            <p>• <strong>Twilio Bridge:</strong> <span className="font-mono">{twilioNumber}</span></p>
            <p>• <strong>Emergency Contact:</strong> <span className="font-mono">{emergencyNumber}</span></p>
            <p>• <strong>Transfer Method:</strong> Concurrent call bridging</p>
          </div>
          <div className="space-y-1">
            <p>• <strong>Auto-Retry:</strong> Up to 3 attempts</p>
            <p>• <strong>Connection Monitoring:</strong> Real-time health checks</p>
            <p>• <strong>Backup Systems:</strong> Multiple redundancy layers</p>
          </div>
        </div>
      </div>
    </div>
  );
}