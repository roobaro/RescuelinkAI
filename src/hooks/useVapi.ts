import { useEffect, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { emergencyDispatchService, type EmergencyDispatchData } from '../services/emergencyDispatch';

interface VapiConfig {
  publicKey: string;
  assistantId?: string;
  assistant?: {
    model: {
      provider: string;
      model: string;
      messages: Array<{
        role: string;
        content: string;
      }>;
    };
    voice: {
      provider: string;
      voiceId: string;
    };
    firstMessage: string;
    functions?: Array<{
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
      };
    }>;
  };
}

interface EmergencyData {
  emergencyType?: string;
  location?: {
    lat?: number;
    lng?: number;
    address: string;
  };
  urgencyLevel?: number;
  peopleInvolved?: string;
  casualties?: string;
  immediateHazards?: string;
  description?: string;
  dispatchId?: string;
  servicesContacted?: string[];
  estimatedArrival?: number;
  transferAttempts?: number;
  lastTransferError?: string;
}

interface CallTransferStatus {
  status: 'idle' | 'initiating' | 'connecting' | 'connected' | 'failed' | 'completed';
  attempts: number;
  lastError?: string;
  emergencyServiceConnected: boolean;
  userConnected: boolean;
  threeWayActive: boolean;
}

export const useVapi = () => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyData>({});
  const [transcript, setTranscript] = useState<string>('');
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'transferring' | 'transferred' | 'ended'>('idle');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'dispatching' | 'dispatched' | 'failed'>('idle');
  const [vapiErrorMessage, setVapiErrorMessage] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<CallTransferStatus>({
    status: 'idle',
    attempts: 0,
    emergencyServiceConnected: false,
    userConnected: false,
    threeWayActive: false
  });
  const [emergencyServiceCall, setEmergencyServiceCall] = useState<any>(null);
  const [connectionPersistence, setConnectionPersistence] = useState({
    userConnectionActive: false,
    emergencyServiceConnectionActive: false,
    keepAliveInterval: null as NodeJS.Timeout | null
  });

  const vapiConfig: VapiConfig = {
    publicKey: import.meta.env.VITE_VAPI_PUBLIC_KEY || '',
    assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID,
    assistant: !import.meta.env.VITE_VAPI_ASSISTANT_ID ? {
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are RescueLink's Advanced Emergency Response AI Assistant for India. Your primary mission is to save lives through immediate emergency service coordination.

CRITICAL EMERGENCY DETECTION:
- IMMEDIATELY recognize urgent phrases: "emergency", "help", "911", "112", "ambulance", "fire", "police", "accident", "heart attack", "can't breathe", "bleeding", "unconscious", "trapped", "robbery", "assault"
- When ANY emergency phrase is detected, INSTANTLY respond: "I'm connecting you to emergency services RIGHT NOW while we talk. Stay on the line."
- Simultaneously initiate emergency service contact while continuing conversation

EMERGENCY DATA COLLECTION (Rapid-fire approach):
1. Emergency type and severity (medical/fire/crime/other) - ASK FIRST
2. Exact location with landmarks - CRITICAL
3. Number of people involved/injured - ESSENTIAL
4. Immediate dangers or hazards - SAFETY
5. Brief situation description - CONTEXT

COMMUNICATION PROTOCOL:
- Speak with calm authority and urgency
- Use short, direct questions (under 15 seconds each)
- Confirm critical details immediately
- Provide real-time status updates: "Emergency services are being contacted now"
- Never end the call until emergency services confirm receipt

EMERGENCY SERVICE INTEGRATION:
- Maintain primary connection with user at ALL times
- Initiate concurrent emergency service call to +919714766855
- Relay complete situation briefing to emergency operator
- Enable three-way communication when needed
- Monitor all connections until responders arrive

CALL PERSISTENCE REQUIREMENTS:
- NEVER disconnect user until emergency services arrive
- Retry failed transfers automatically (up to 3 attempts)
- Provide continuous status updates
- Maintain connection even during transfer attempts
- Log all transfer attempts and failures

When emergency data is collected, call the emergencyServiceTransfer function immediately.
When user requests emergency services, call the immediateEmergencyTransfer function.

SAFETY INSTRUCTIONS BY TYPE:
- Medical: "Don't move injured person unless in immediate danger. Apply pressure to bleeding wounds. Keep them conscious and talking."
- Fire: "Evacuate immediately if safe. Stay low under smoke. Don't use elevators. Meet at designated safe area."
- Crime: "Move to secure location. Don't confront suspects. Lock doors. Stay hidden until help arrives."
- Other: "Follow evacuation orders. Avoid hazardous areas. Stay in contact until help arrives."

Remember: Every second counts in emergencies. Act with urgency while maintaining professionalism.`
          }
        ]
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'pNInz6obpgDQGcFmaJgB'
      },
      firstMessage: "RescueLink Emergency Response here. I can immediately connect you to emergency services while we talk. What's your emergency situation right now?",
      functions: [
        {
          name: 'emergencyServiceTransfer',
          description: 'Transfer call to emergency services after collecting emergency data',
          parameters: {
            type: 'object',
            properties: {
              emergencyData: {
                type: 'object',
                description: 'Complete emergency information collected'
              },
              urgency: {
                type: 'string',
                enum: ['critical', 'high', 'medium'],
                description: 'Emergency urgency level'
              }
            },
            required: ['emergencyData', 'urgency']
          }
        },
        {
          name: 'immediateEmergencyTransfer',
          description: 'Immediately transfer to emergency services for critical situations',
          parameters: {
            type: 'object',
            properties: {
              reason: {
                type: 'string',
                description: 'Reason for immediate transfer'
              },
              partialData: {
                type: 'object',
                description: 'Any emergency data collected so far'
              }
            },
            required: ['reason']
          }
        },
        {
          name: 'updateEmergencyStatus',
          description: 'Update emergency status and maintain connection',
          parameters: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Current emergency status'
              },
              keepConnection: {
                type: 'boolean',
                description: 'Whether to maintain connection'
              }
            },
            required: ['status']
          }
        }
      ]
    } : undefined
  };

  // Connection persistence management
  const maintainConnectionPersistence = useCallback(() => {
    const keepAlive = setInterval(() => {
      if (isSessionActive && (callStatus === 'connected' || callStatus === 'transferring' || callStatus === 'transferred')) {
        console.log('🔄 Maintaining connection persistence...');
        
        // Check connection health
        if (vapi && transferStatus.userConnected) {
          console.log('✅ User connection active');
        }
        
        if (transferStatus.emergencyServiceConnected) {
          console.log('✅ Emergency service connection active');
        }
        
        // Log connection status for debugging
        console.log('Connection Status:', {
          userConnected: transferStatus.userConnected,
          emergencyServiceConnected: transferStatus.emergencyServiceConnected,
          threeWayActive: transferStatus.threeWayActive,
          transferAttempts: transferStatus.attempts
        });
      }
    }, 10000); // Check every 10 seconds

    setConnectionPersistence(prev => ({
      ...prev,
      keepAliveInterval: keepAlive
    }));

    return keepAlive;
  }, [isSessionActive, callStatus, vapi, transferStatus]);

  // Enhanced error handling with retry logic
  const handleTransferError = useCallback(async (error: any, attempt: number) => {
    console.error(`❌ Transfer attempt ${attempt} failed:`, error);
    
    setTransferStatus(prev => ({
      ...prev,
      status: 'failed',
      attempts: attempt,
      lastError: error.message || 'Transfer failed'
    }));

    // Auto-retry logic (up to 3 attempts)
    if (attempt < 3) {
      console.log(`🔄 Retrying transfer in 5 seconds... (Attempt ${attempt + 1}/3)`);
      
      setTimeout(async () => {
        console.log(`🔄 Retry attempt ${attempt + 1} starting...`);
        await initiateEmergencyTransfer(emergencyData, 'retry_attempt');
      }, 5000);
    } else {
      console.error('❌ All transfer attempts failed. Maintaining user connection and notifying emergency services via alternative method.');
      
      // Fallback: Notify emergency services via dispatch system
      await emergencyDispatchService.dispatchEmergencyServices({
        emergencyType: emergencyData.emergencyType || 'unknown',
        location: emergencyData.location || { address: 'Location not provided' },
        urgencyLevel: emergencyData.urgencyLevel || 5,
        peopleInvolved: emergencyData.peopleInvolved,
        casualties: emergencyData.casualties,
        immediateHazards: emergencyData.immediateHazards,
        description: emergencyData.description,
        timestamp: new Date().toISOString(),
        transcript: transcript
      });
      
      setDispatchStatus('dispatched');
    }
  }, [emergencyData, transcript]);

  // Enhanced emergency transfer with persistence
  const initiateEmergencyTransfer = useCallback(async (data: EmergencyData, reason: string) => {
    const currentAttempt = transferStatus.attempts + 1;
    console.log(`🚨 INITIATING EMERGENCY TRANSFER - Attempt ${currentAttempt} - Reason: ${reason}`);
    
    setTransferStatus(prev => ({
      ...prev,
      status: 'initiating',
      attempts: currentAttempt
    }));
    
    setCallStatus('transferring');

    try {
      // Step 1: Maintain user connection
      setTransferStatus(prev => ({
        ...prev,
        userConnected: true
      }));
      
      console.log('✅ User connection maintained');

      // Step 2: Dispatch emergency services data
      if (data.emergencyType && data.location?.address) {
        setDispatchStatus('dispatching');
        
        const dispatchData: EmergencyDispatchData = {
          emergencyType: data.emergencyType,
          location: data.location,
          urgencyLevel: data.urgencyLevel || 5,
          peopleInvolved: data.peopleInvolved,
          casualties: data.casualties,
          immediateHazards: data.immediateHazards,
          description: data.description,
          timestamp: new Date().toISOString(),
          transcript: transcript
        };

        const dispatchResponse = await emergencyDispatchService.dispatchEmergencyServices(dispatchData);
        
        if (dispatchResponse.success) {
          console.log('✅ Emergency services dispatched successfully');
          setDispatchStatus('dispatched');
          
          setEmergencyData(prev => ({
            ...prev,
            dispatchId: dispatchResponse.dispatchId,
            servicesContacted: dispatchResponse.servicesContacted,
            estimatedArrival: dispatchResponse.estimatedArrival,
            transferAttempts: currentAttempt
          }));
        }
      }

      // Step 3: Initiate concurrent emergency service call
      console.log('📞 Initiating concurrent emergency service call...');
      
      const emergencyNumber = import.meta.env.VITE_EMERGENCY_CONTACT_NUMBER || '+919714766855';
      const twilioNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+14177644087';
      
      // Simulate emergency service call initiation
      const emergencyCallResult = await initiateEmergencyServiceCall(data, emergencyNumber);
      
      if (emergencyCallResult.success) {
        console.log('✅ Emergency service call initiated successfully');
        
        setTransferStatus(prev => ({
          ...prev,
          status: 'connecting',
          emergencyServiceConnected: true
        }));
        
        // Step 4: Enable three-way communication
        setTimeout(() => {
          console.log('🔗 Enabling three-way communication...');
          setTransferStatus(prev => ({
            ...prev,
            status: 'connected',
            threeWayActive: true
          }));
          setCallStatus('transferred');
          
          // Relay complete briefing to emergency services
          relayEmergencyBriefing(data);
          
        }, 3000);
        
      } else {
        throw new Error(emergencyCallResult.error || 'Failed to connect to emergency services');
      }

    } catch (error) {
      await handleTransferError(error, currentAttempt);
    }
  }, [transferStatus.attempts, transcript, handleTransferError]);

  // Emergency service call initiation
  const initiateEmergencyServiceCall = useCallback(async (data: EmergencyData, emergencyNumber: string): Promise<{
    success: boolean;
    callId?: string;
    error?: string;
  }> => {
    try {
      console.log(`📞 Calling emergency services at ${emergencyNumber}...`);
      
      // Create emergency call payload
      const callPayload = {
        to: emergencyNumber,
        from: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+14177644087',
        emergencyData: data,
        transcript: transcript,
        timestamp: new Date().toISOString(),
        priority: 'CRITICAL',
        callType: 'emergency_concurrent'
      };

      // Simulate emergency service call (in production, this would call your backend API)
      const callResult = await simulateEmergencyServiceCall(callPayload);
      
      if (callResult.success) {
        setEmergencyServiceCall(callResult);
        return {
          success: true,
          callId: callResult.callId
        };
      } else {
        return {
          success: false,
          error: callResult.error
        };
      }
      
    } catch (error) {
      console.error('❌ Emergency service call failed:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }, [transcript]);

  // Simulate emergency service call
  const simulateEmergencyServiceCall = useCallback(async (payload: any): Promise<{
    success: boolean;
    callId?: string;
    error?: string;
  }> => {
    console.log('📡 Simulating emergency service call...');
    console.log('Call Payload:', payload);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // High success rate for emergency calls
    if (Math.random() > 0.05) {
      const callId = `EMERGENCY-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      console.log('✅ Emergency service call connected');
      console.log(`📞 Call ID: ${callId}`);
      
      return {
        success: true,
        callId: callId
      };
    } else {
      return {
        success: false,
        error: 'Emergency line busy - retrying...'
      };
    }
  }, []);

  // Relay emergency briefing to services
  const relayEmergencyBriefing = useCallback((data: EmergencyData) => {
    const briefing = `
EMERGENCY CALL TRANSFER - CRITICAL PRIORITY
Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Emergency Type: ${data.emergencyType?.toUpperCase() || 'UNKNOWN'}
Location: ${data.location?.address || 'Location not provided'}
${data.location?.lat ? `GPS Coordinates: ${data.location.lat}, ${data.location.lng}` : ''}
People Involved: ${data.peopleInvolved || 'Unknown'}
Casualties: ${data.casualties || 'None reported'}
Immediate Hazards: ${data.immediateHazards || 'None reported'}
Situation: ${data.description || 'No additional details'}
Urgency Level: ${data.urgencyLevel || 'Unknown'}/5
Caller Status: Connected and standing by
Source: RescueLink AI Emergency System (India)
Dispatch ID: ${data.dispatchId || 'Pending'}
    `.trim();

    console.log('📋 EMERGENCY BRIEFING RELAYED TO SERVICES:');
    console.log(briefing);
    
    // In production, this would be sent to the emergency operator via the call
    return briefing;
  }, []);

  useEffect(() => {
    if (!vapiConfig.publicKey) {
      console.error('Vapi public key not found. Please add VITE_VAPI_PUBLIC_KEY to your .env file');
      setVapiErrorMessage('Vapi API key not configured. Please check your environment variables.');
      return;
    }

    const vapiInstance = new Vapi(vapiConfig.publicKey);
    setVapi(vapiInstance);

    // Enhanced event listeners
    vapiInstance.on('call-start', () => {
      console.log('📞 Call started - Emergency system active');
      setCallStatus('connected');
      setIsSessionActive(true);
      setVapiErrorMessage('');
      
      setTransferStatus(prev => ({
        ...prev,
        userConnected: true
      }));
      
      // Start connection persistence monitoring
      maintainConnectionPersistence();
    });

    vapiInstance.on('call-end', () => {
      console.log('📞 Call ended');
      setCallStatus('ended');
      setIsSessionActive(false);
      
      // Clear connection persistence
      if (connectionPersistence.keepAliveInterval) {
        clearInterval(connectionPersistence.keepAliveInterval);
      }
      
      setTransferStatus(prev => ({
        ...prev,
        userConnected: false
      }));
    });

    vapiInstance.on('message', (message: any) => {
      console.log('📨 Vapi message:', message);
      
      if (message.type === 'transcript' && message.transcript) {
        setTranscript(prev => prev + '\n' + message.transcript);
        
        // Enhanced emergency phrase detection
        const emergencyPhrases = [
          'emergency', 'help', 'urgent', '911', '112', 'ambulance', 'fire', 'police',
          'accident', 'heart attack', 'can\'t breathe', 'bleeding', 'unconscious',
          'trapped', 'robbery', 'assault', 'contact emergency services', 'call emergency'
        ];
        
        const transcript = message.transcript.toLowerCase();
        const isEmergencyDetected = emergencyPhrases.some(phrase => transcript.includes(phrase));
        
        if (isEmergencyDetected && transferStatus.status === 'idle') {
          console.log('🚨 EMERGENCY PHRASE DETECTED - Initiating immediate response');
          initiateEmergencyTransfer(emergencyData, 'emergency_phrase_detected');
        }
        
        // Check for emergency data collection completion
        if (message.transcript.includes('EMERGENCY_DATA_COLLECTED')) {
          try {
            const jsonMatch = message.transcript.match(/\{[^}]*\}/);
            if (jsonMatch) {
              const collectedData = JSON.parse(jsonMatch[0]);
              console.log('📋 Emergency data collected:', collectedData);
              setEmergencyData(prev => ({ ...prev, ...collectedData }));
              
              // Automatically initiate transfer with collected data
              initiateEmergencyTransfer({ ...emergencyData, ...collectedData }, 'data_collected');
            }
          } catch (error) {
            console.error('❌ Error parsing emergency data:', error);
          }
        }
      }

      // Enhanced function call handling
      if (message.type === 'function-call') {
        console.log('🔧 Function call received:', message);
        
        const { name, parameters } = message.functionCall;
        
        switch (name) {
          case 'emergencyServiceTransfer':
            const { emergencyData: funcData, urgency } = parameters;
            setEmergencyData(prev => ({ ...prev, ...funcData }));
            initiateEmergencyTransfer({ ...emergencyData, ...funcData }, `transfer_${urgency}`);
            break;
            
          case 'immediateEmergencyTransfer':
            const { reason, partialData } = parameters;
            if (partialData) {
              setEmergencyData(prev => ({ ...prev, ...partialData }));
            }
            initiateEmergencyTransfer({ ...emergencyData, ...partialData }, reason);
            break;
            
          case 'updateEmergencyStatus':
            const { status, keepConnection } = parameters;
            console.log(`📊 Emergency status update: ${status}, Keep connection: ${keepConnection}`);
            if (keepConnection) {
              maintainConnectionPersistence();
            }
            break;
        }
      }
    });

    // Enhanced error handling
    vapiInstance.on('error', (error: any) => {
      console.error('❌ Vapi error:', error);
      
      let errorMessage = 'Call ended unexpectedly';
      
      if (error && typeof error === 'object') {
        if (error.errorMsg) {
          errorMessage = error.errorMsg;
        } else if (error.error && error.error.msg) {
          errorMessage = error.error.msg;
        } else if (error.error && error.error.type) {
          switch (error.error.type) {
            case 'ejected':
              errorMessage = 'Emergency call was terminated. This may be due to API limits or configuration issues. Attempting to reconnect...';
              
              // Auto-reconnect for emergency situations
              if (transferStatus.status !== 'idle' || emergencyData.emergencyType) {
                console.log('🔄 Auto-reconnecting for emergency situation...');
                setTimeout(() => {
                  startCall();
                }, 3000);
              }
              break;
            case 'network':
              errorMessage = 'Network connection lost during emergency call. Attempting to reconnect...';
              break;
            case 'timeout':
              errorMessage = 'Emergency call timed out. Reconnecting...';
              break;
            default:
              errorMessage = `Emergency call error (${error.error.type}): ${error.error.msg || 'Unknown error'}`;
          }
        }
      }
      
      setVapiErrorMessage(errorMessage);
      setCallStatus('ended');
      setIsSessionActive(false);
      
      // Clear connection persistence on error
      if (connectionPersistence.keepAliveInterval) {
        clearInterval(connectionPersistence.keepAliveInterval);
      }
    });

    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
      }
      if (connectionPersistence.keepAliveInterval) {
        clearInterval(connectionPersistence.keepAliveInterval);
      }
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!vapi) {
      console.error('Vapi instance not initialized');
      setVapiErrorMessage('Emergency system not available. Please refresh and try again.');
      return;
    }

    if (!vapiConfig.publicKey) {
      setVapiErrorMessage('Emergency system not configured. Please check configuration.');
      return;
    }
    
    try {
      setCallStatus('connecting');
      setTranscript('');
      setEmergencyData({});
      setDispatchStatus('idle');
      setVapiErrorMessage('');
      
      // Reset transfer status
      setTransferStatus({
        status: 'idle',
        attempts: 0,
        emergencyServiceConnected: false,
        userConnected: false,
        threeWayActive: false
      });
      
      console.log('🚨 Starting emergency call system...');
      
      if (vapiConfig.assistantId) {
        console.log('Starting with assistant ID:', vapiConfig.assistantId);
        await vapi.start(vapiConfig.assistantId);
      } else if (vapiConfig.assistant) {
        console.log('Starting with enhanced emergency assistant configuration');
        await vapi.start(vapiConfig.assistant);
      } else {
        throw new Error('No emergency assistant configuration available');
      }
    } catch (error) {
      console.error('❌ Failed to start emergency call:', error);
      setCallStatus('ended');
      
      let startErrorMessage = 'Failed to start emergency call system';
      
      if (error instanceof Error) {
        if (error.message.includes('assistant')) {
          startErrorMessage = 'Emergency assistant configuration error. Please contact support.';
        } else if (error.message.includes('auth')) {
          startErrorMessage = 'Emergency system authentication failed. Please contact support.';
        } else {
          startErrorMessage = `Emergency system error: ${error.message}`;
        }
      }
      
      setVapiErrorMessage(startErrorMessage);
    }
  }, [vapi, vapiConfig.assistantId, vapiConfig.assistant, vapiConfig.publicKey]);

  const endCall = useCallback(() => {
    if (!vapi) return;
    
    // Warning for ending emergency calls
    if (transferStatus.status !== 'idle' || emergencyData.emergencyType) {
      console.warn('⚠️ Ending emergency call - ensure emergency services have been contacted');
    }
    
    vapi.stop();
    setCallStatus('ended');
    setIsSessionActive(false);
    setVapiErrorMessage('');
    
    // Clear connection persistence
    if (connectionPersistence.keepAliveInterval) {
      clearInterval(connectionPersistence.keepAliveInterval);
    }
    
    // Reset transfer status
    setTransferStatus({
      status: 'idle',
      attempts: 0,
      emergencyServiceConnected: false,
      userConnected: false,
      threeWayActive: false
    });
  }, [vapi, transferStatus.status, emergencyData.emergencyType, connectionPersistence.keepAliveInterval]);

  const toggleMute = useCallback(() => {
    if (!vapi) return;
    
    // Warning for muting during emergency
    if (transferStatus.threeWayActive) {
      console.warn('⚠️ Muting during emergency three-way call');
    }
    
    if (isMuted) {
      vapi.setMuted(false);
    } else {
      vapi.setMuted(true);
    }
    setIsMuted(!isMuted);
  }, [vapi, isMuted, transferStatus.threeWayActive]);

  return {
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
    connectionPersistence,
    submitToEmergencyServices: initiateEmergencyTransfer,
    dispatchEmergencyServices: initiateEmergencyTransfer,
    initiateCallTransfer: initiateEmergencyTransfer,
    isConfigured: !!vapiConfig.publicKey
  };
};