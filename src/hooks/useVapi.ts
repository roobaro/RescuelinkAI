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
            content: `You are RescueLink's AI Emergency Response Assistant for India. Your role is to:

1. IMMEDIATELY assess the emergency type (medical/fire/crime/other)
2. Collect critical information in this order:
   - Emergency type and brief description
   - Exact location (ask for address, landmarks, or area name)
   - Number of people involved/injured
   - Urgency level (1-5 scale, where 5 is life-threatening)
   - Immediate hazards or dangers
   - Any casualties or unconscious persons

3. Communication guidelines:
   - Speak clearly and calmly with empathy
   - Ask one question at a time
   - Confirm understanding of critical details
   - Provide reassurance and clear instructions
   - Keep responses under 30 seconds
   - Use simple, direct language
   - Be culturally sensitive for Indian context

4. Once you have collected the essential information, say "EMERGENCY_DATA_COLLECTED" followed by a JSON object with the collected data in this format:
   {
     "emergencyType": "medical|fire|crime|other",
     "location": {"address": "full address or description"},
     "urgencyLevel": 1-5,
     "peopleInvolved": "number",
     "casualties": "number",
     "immediateHazards": "description",
     "description": "brief situation summary"
   }

5. After data collection, inform the caller:
   "I have all the information needed. I'm now transferring you directly to emergency services who will provide immediate assistance. Please stay on the line - you'll be connected to emergency services at +91 9714766855 in just a moment."

6. When the user requests transfer or asks to speak to emergency services, call the transferToEmergencyServices function.

7. Provide immediate safety instructions based on emergency type:
   - Medical: Basic first aid, don't move injured unless in danger, call 102 for ambulance if needed
   - Fire: Evacuate safely, stay low, call 101 for fire services if needed
   - Crime: Move to safety, don't confront, call 100 for police if needed
   - Other: Follow evacuation orders, avoid hazards, call 112 for unified emergency services

Remember: You can transfer calls directly to emergency services using the Twilio integration. Stay calm, be clear, and prioritize life safety.`
          }
        ]
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'pNInz6obpgDQGcFmaJgB' // Professional, calm voice
      },
      firstMessage: "Hello, this is RescueLink Emergency Response for India. I'm here to help you right now. Can you tell me what type of emergency you're experiencing - is this medical, fire, crime, or another type of emergency? I can also transfer you directly to emergency services if needed.",
      functions: [
        {
          name: 'transferToEmergencyServices',
          description: 'Transfer the current call to emergency services when emergency data is collected or user requests transfer',
          parameters: {
            type: 'object',
            properties: {
              emergencyData: {
                type: 'object',
                description: 'The collected emergency information'
              },
              reason: {
                type: 'string',
                description: 'Reason for transfer (data_collected, user_request, critical_emergency)'
              }
            },
            required: ['reason']
          }
        }
      ]
    } : undefined
  };

  useEffect(() => {
    if (!vapiConfig.publicKey) {
      console.error('Vapi public key not found. Please add VITE_VAPI_PUBLIC_KEY to your .env file');
      setVapiErrorMessage('Vapi API key not configured. Please check your environment variables.');
      return;
    }

    const vapiInstance = new Vapi(vapiConfig.publicKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setCallStatus('connected');
      setIsSessionActive(true);
      setVapiErrorMessage(''); // Clear any previous error messages
    });

    vapiInstance.on('call-end', () => {
      console.log('Call ended');
      setCallStatus('ended');
      setIsSessionActive(false);
    });

    vapiInstance.on('speech-start', () => {
      console.log('User started speaking');
    });

    vapiInstance.on('speech-end', () => {
      console.log('User stopped speaking');
    });

    vapiInstance.on('message', (message: any) => {
      console.log('Vapi message:', message);
      
      if (message.type === 'transcript' && message.transcript) {
        setTranscript(prev => prev + '\n' + message.transcript);
        
        // Check if emergency data collection is complete
        if (message.transcript.includes('EMERGENCY_DATA_COLLECTED')) {
          try {
            const jsonMatch = message.transcript.match(/\{[^}]*\}/);
            if (jsonMatch) {
              const collectedData = JSON.parse(jsonMatch[0]);
              console.log('Emergency data collected:', collectedData);
              setEmergencyData(collectedData);
              
              // Automatically initiate call transfer
              initiateCallTransfer(collectedData, 'data_collected');
            }
          } catch (error) {
            console.error('Error parsing emergency data:', error);
          }
        }
      }

      if (message.type === 'function-call') {
        console.log('Function call received:', message);
        
        if (message.functionCall?.name === 'transferToEmergencyServices') {
          const { emergencyData: funcEmergencyData, reason } = message.functionCall.parameters;
          initiateCallTransfer(funcEmergencyData || emergencyData, reason);
        }
      }
    });

    vapiInstance.on('error', (error: any) => {
      console.error('Vapi error:', error);
      
      // Enhanced error handling for ejection and other common issues
      let errorMessage = 'Call ended unexpectedly';
      
      if (error && typeof error === 'object') {
        if (error.errorMsg) {
          errorMessage = error.errorMsg;
        } else if (error.error && error.error.msg) {
          errorMessage = error.error.msg;
        } else if (error.error && error.error.type) {
          switch (error.error.type) {
            case 'ejected':
              errorMessage = 'Call was terminated by Vapi. This may be due to: API key issues, account limits reached, or assistant configuration problems. Please check your Vapi dashboard for more details.';
              break;
            case 'network':
              errorMessage = 'Network connection lost. Please check your internet connection and try again.';
              break;
            case 'timeout':
              errorMessage = 'Call timed out. Please try starting a new call.';
              break;
            case 'authentication':
              errorMessage = 'Authentication failed. Please verify your Vapi API key is correct and active.';
              break;
            case 'quota_exceeded':
              errorMessage = 'API quota exceeded. Please check your Vapi account credits and usage limits.';
              break;
            case 'assistant_not_found':
              errorMessage = 'Assistant configuration not found. Please check your assistant ID or configuration.';
              break;
            case 'invalid_request':
              errorMessage = 'Invalid request sent to Vapi. Please check your assistant configuration.';
              break;
            default:
              errorMessage = `Call error (${error.error.type}): ${error.error.msg || 'Unknown error occurred'}`;
          }
        }
      }
      
      setVapiErrorMessage(errorMessage);
      setCallStatus('ended');
      setIsSessionActive(false);
    });

    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
      }
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!vapi) {
      console.error('Vapi instance not initialized');
      setVapiErrorMessage('Vapi service not available. Please refresh the page and try again.');
      return;
    }

    if (!vapiConfig.publicKey) {
      setVapiErrorMessage('Vapi API key not configured. Please check your environment variables.');
      return;
    }
    
    try {
      setCallStatus('connecting');
      setTranscript('');
      setEmergencyData({});
      setDispatchStatus('idle');
      setVapiErrorMessage(''); // Clear any previous error messages
      
      // Use custom assistant ID if provided, otherwise use inline assistant config
      if (vapiConfig.assistantId) {
        console.log('Starting call with assistant ID:', vapiConfig.assistantId);
        await vapi.start(vapiConfig.assistantId);
      } else if (vapiConfig.assistant) {
        console.log('Starting call with inline assistant configuration');
        await vapi.start(vapiConfig.assistant);
      } else {
        throw new Error('No assistant configuration available');
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('ended');
      
      // Enhanced error handling for start call failures
      let startErrorMessage = 'Failed to start call';
      
      if (error instanceof Error) {
        if (error.message.includes('assistant')) {
          startErrorMessage = 'Assistant configuration error. Please check your Vapi assistant settings.';
        } else if (error.message.includes('auth')) {
          startErrorMessage = 'Authentication failed. Please verify your Vapi API key.';
        } else if (error.message.includes('network')) {
          startErrorMessage = 'Network error. Please check your internet connection.';
        } else {
          startErrorMessage = `Failed to start call: ${error.message}`;
        }
      }
      
      setVapiErrorMessage(startErrorMessage);
    }
  }, [vapi, vapiConfig.assistantId, vapiConfig.assistant, vapiConfig.publicKey]);

  const endCall = useCallback(() => {
    if (!vapi) return;
    
    vapi.stop();
    setCallStatus('ended');
    setIsSessionActive(false);
    setVapiErrorMessage(''); // Clear error message on manual end
  }, [vapi]);

  const toggleMute = useCallback(() => {
    if (!vapi) return;
    
    if (isMuted) {
      vapi.setMuted(false);
    } else {
      vapi.setMuted(true);
    }
    setIsMuted(!isMuted);
  }, [vapi, isMuted]);

  const initiateCallTransfer = useCallback(async (data: EmergencyData, reason: string) => {
    console.log(`🔄 Initiating call transfer - Reason: ${reason}`);
    setCallStatus('transferring');
    setDispatchStatus('dispatching');

    try {
      // First, dispatch emergency services data
      if (data.emergencyType && data.location?.address) {
        const dispatchData: EmergencyDispatchData = {
          emergencyType: data.emergencyType,
          location: data.location,
          urgencyLevel: data.urgencyLevel || 3,
          peopleInvolved: data.peopleInvolved,
          casualties: data.casualties,
          immediateHazards: data.immediateHazards,
          description: data.description,
          timestamp: new Date().toISOString(),
          transcript: transcript
        };

        const response = await emergencyDispatchService.dispatchEmergencyServices(dispatchData);
        
        if (response.success) {
          console.log('✅ Emergency services dispatched successfully');
          setDispatchStatus('dispatched');
          
          // Update emergency data with dispatch info
          setEmergencyData(prev => ({
            ...prev,
            dispatchId: response.dispatchId,
            servicesContacted: response.servicesContacted,
            estimatedArrival: response.estimatedArrival
          }));
        }
      }

      // Now initiate the actual call transfer using Twilio
      const transferResult = await transferCallToEmergencyServices(data);
      
      if (transferResult.success) {
        console.log('📞 Call transfer initiated successfully');
        setCallStatus('transferred');
        
        // Notify the user about the transfer
        if (vapi) {
          // The call will be transferred, so we don't end it here
          console.log('🔄 Call being transferred to emergency services...');
        }
      } else {
        console.error('❌ Call transfer failed');
        setCallStatus('connected'); // Return to connected state
        setDispatchStatus('failed');
      }

    } catch (error) {
      console.error('❌ Error during call transfer:', error);
      setCallStatus('connected');
      setDispatchStatus('failed');
    }
  }, [vapi, transcript]);

  const transferCallToEmergencyServices = useCallback(async (data: EmergencyData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📞 Initiating Twilio call transfer...');
      
      const twilioNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+14177644087';
      const emergencyNumber = import.meta.env.VITE_EMERGENCY_CONTACT_NUMBER || '+919714766855';
      
      // Create transfer request
      const transferRequest = {
        from: twilioNumber,
        to: emergencyNumber,
        emergencyData: data,
        transferReason: 'emergency_data_collected',
        timestamp: new Date().toISOString(),
        callId: `transfer-${Date.now()}`
      };

      console.log('🔄 Transfer Request:', transferRequest);
      
      // In a real implementation, this would call your backend API that handles Twilio transfers
      // For now, we'll simulate the transfer process
      const transferResponse = await simulateTwilioTransfer(transferRequest);
      
      if (transferResponse.success) {
        console.log('✅ Twilio transfer successful');
        console.log(`📞 Call transferred from ${twilioNumber} to ${emergencyNumber}`);
        return { success: true };
      } else {
        console.error('❌ Twilio transfer failed:', transferResponse.error);
        return { success: false, error: transferResponse.error };
      }
      
    } catch (error) {
      console.error('❌ Transfer error:', error);
      return { success: false, error: String(error) };
    }
  }, []);

  const simulateTwilioTransfer = async (transferRequest: any): Promise<{ success: boolean; error?: string }> => {
    // Simulate Twilio API call for transfer
    console.log('📡 Calling Twilio API for call transfer...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate high success rate for testing
    if (Math.random() > 0.1) {
      console.log('📞 Twilio transfer completed successfully');
      console.log(`🔄 Call bridged: ${transferRequest.from} → ${transferRequest.to}`);
      return { success: true };
    } else {
      return { success: false, error: 'Transfer failed - emergency line busy' };
    }
  };

  const dispatchEmergencyServices = useCallback(async (data: EmergencyData) => {
    if (!data.emergencyType || !data.location?.address) {
      console.error('Insufficient data for emergency dispatch');
      return;
    }

    setDispatchStatus('dispatching');
    
    try {
      const dispatchData: EmergencyDispatchData = {
        emergencyType: data.emergencyType,
        location: data.location,
        urgencyLevel: data.urgencyLevel || 3,
        peopleInvolved: data.peopleInvolved,
        casualties: data.casualties,
        immediateHazards: data.immediateHazards,
        description: data.description,
        timestamp: new Date().toISOString(),
        transcript: transcript
      };

      console.log('🚨 Dispatching emergency services...');
      const response = await emergencyDispatchService.dispatchEmergencyServices(dispatchData);
      
      if (response.success) {
        console.log('✅ Emergency services dispatched successfully');
        setDispatchStatus('dispatched');
        
        // Update emergency data with dispatch info
        setEmergencyData(prev => ({
          ...prev,
          dispatchId: response.dispatchId,
          servicesContacted: response.servicesContacted,
          estimatedArrival: response.estimatedArrival
        }));
      } else {
        console.error('❌ Failed to dispatch emergency services');
        setDispatchStatus('failed');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error dispatching emergency services:', error);
      setDispatchStatus('failed');
    }
  }, [transcript]);

  const submitToEmergencyServices = useCallback(async (data: EmergencyData) => {
    // This method is kept for backward compatibility
    return dispatchEmergencyServices(data);
  }, [dispatchEmergencyServices]);

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
    submitToEmergencyServices,
    dispatchEmergencyServices,
    initiateCallTransfer,
    isConfigured: !!vapiConfig.publicKey
  };
};