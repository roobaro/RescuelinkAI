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
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'dispatching' | 'dispatched' | 'failed'>('idle');

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
            content: `You are RescueLink's AI Emergency Response Assistant. Your role is to:

1. IMMEDIATELY assess the emergency type (medical/fire/crime/other)
2. Collect critical information in this order:
   - Emergency type and brief description
   - Exact location (ask for address or landmarks)
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
   "I'm now contacting emergency services and dispatching help to your location. Please stay on the line and follow any safety instructions I provide."

6. Provide immediate safety instructions based on emergency type:
   - Medical: Basic first aid, don't move injured unless in danger
   - Fire: Evacuate safely, stay low, don't use elevators
   - Crime: Move to safety, don't confront, preserve scene if safe
   - Other: Follow evacuation orders, avoid hazards

Remember: You are the first critical link in emergency response. Emergency services will be automatically contacted and dispatched once data is collected. Stay calm, be clear, and prioritize life safety.`
          }
        ]
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'pNInz6obpgDQGcFmaJgB' // Professional, calm voice
      },
      firstMessage: "Hello, this is RescueLink Emergency Response. I'm here to help you right now. Can you tell me what type of emergency you're experiencing - is this medical, fire, crime, or another type of emergency?"
    } : undefined
  };

  useEffect(() => {
    if (!vapiConfig.publicKey) {
      console.error('Vapi public key not found. Please add VITE_VAPI_PUBLIC_KEY to your .env file');
      return;
    }

    const vapiInstance = new Vapi(vapiConfig.publicKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setCallStatus('connected');
      setIsSessionActive(true);
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
              
              // Automatically dispatch emergency services
              dispatchEmergencyServices(collectedData);
            }
          } catch (error) {
            console.error('Error parsing emergency data:', error);
          }
        }
      }

      if (message.type === 'function-call') {
        console.log('Function call received:', message);
      }
    });

    vapiInstance.on('error', (error: any) => {
      console.error('Vapi error:', error);
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
      return;
    }
    
    try {
      setCallStatus('connecting');
      setTranscript('');
      setEmergencyData({});
      setDispatchStatus('idle');
      
      // Use custom assistant ID if provided, otherwise use inline assistant config
      if (vapiConfig.assistantId) {
        await vapi.start(vapiConfig.assistantId);
      } else if (vapiConfig.assistant) {
        await vapi.start(vapiConfig.assistant);
      } else {
        throw new Error('No assistant configuration available');
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('ended');
    }
  }, [vapi, vapiConfig.assistantId, vapiConfig.assistant]);

  const endCall = useCallback(() => {
    if (!vapi) return;
    
    vapi.stop();
    setCallStatus('ended');
    setIsSessionActive(false);
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
        console.log(`Services contacted: ${response.servicesContacted.join(', ')}`);
        console.log(`Estimated arrival: ${response.estimatedArrival} minutes`);
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
    submitToEmergencyServices,
    dispatchEmergencyServices,
    isConfigured: !!vapiConfig.publicKey
  };
};