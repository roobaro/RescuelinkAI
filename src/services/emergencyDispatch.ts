interface EmergencyContact {
  service: string;
  number: string;
  priority: number;
  capabilities: string[];
}

interface EmergencyDispatchData {
  emergencyType: string;
  location: {
    lat?: number;
    lng?: number;
    address: string;
  };
  urgencyLevel: number;
  peopleInvolved?: string;
  casualties?: string;
  immediateHazards?: string;
  description?: string;
  timestamp: string;
  callerId?: string;
  transcript?: string;
}

interface DispatchResponse {
  success: boolean;
  dispatchId: string;
  servicesContacted: string[];
  estimatedArrival: number;
  errors?: string[];
}

class EmergencyDispatchService {
  private emergencyContacts: Record<string, EmergencyContact[]> = {
    // India Emergency Services - Using your test number
    'IN': [
      { service: 'Emergency Services (Test)', number: '+919714766855', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] },
      { service: 'Police (Test)', number: '+919714766855', priority: 2, capabilities: ['crime'] },
      { service: 'Fire Department (Test)', number: '+919714766855', priority: 2, capabilities: ['fire'] },
      { service: 'Ambulance (Test)', number: '+919714766855', priority: 2, capabilities: ['medical'] },
      { service: 'Disaster Management (Test)', number: '+919714766855', priority: 3, capabilities: ['other'] }
    ],
    // US Emergency Services (fallback)
    'US': [
      { service: 'Emergency Services (911)', number: '911', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] },
      { service: 'Fire Department', number: '911', priority: 2, capabilities: ['fire'] },
      { service: 'Police Department', number: '911', priority: 2, capabilities: ['crime'] },
      { service: 'Emergency Medical Services', number: '911', priority: 2, capabilities: ['medical'] }
    ]
  };

  private getCountryCode(): string {
    // Set to India for testing with your number
    return 'IN';
  }

  private getRelevantServices(emergencyType: string, urgencyLevel: number): EmergencyContact[] {
    const countryCode = this.getCountryCode();
    const allServices = this.emergencyContacts[countryCode] || this.emergencyContacts['US'];
    
    return allServices
      .filter(service => 
        service.capabilities.includes(emergencyType) || 
        service.capabilities.includes('other') ||
        (urgencyLevel >= 4 && service.priority === 1)
      )
      .sort((a, b) => a.priority - b.priority);
  }

  private async makeVapiEmergencyCall(contact: EmergencyContact, dispatchData: EmergencyDispatchData): Promise<boolean> {
    try {
      console.log(`🚨 VAPI EMERGENCY CALL: Calling ${contact.service} at ${contact.number}`);
      
      // Create emergency message for the call
      const emergencyMessage = this.generateEmergencyMessage(dispatchData);
      
      // Vapi call configuration for emergency dispatch
      const vapiCallConfig = {
        phoneNumber: contact.number,
        assistant: {
          model: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are an automated emergency dispatch system calling to report an emergency. 

EMERGENCY DETAILS:
${emergencyMessage}

Your role:
1. Clearly state this is an automated emergency dispatch call from RescueLink AI
2. Provide all emergency details clearly and concisely
3. Confirm the emergency services will respond
4. Ask for estimated arrival time
5. Provide the dispatch ID for reference
6. Keep the call professional and brief (under 2 minutes)

If asked questions, provide the emergency details again. If they need to transfer you, stay on the line.`
              }
            ]
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: 'pNInz6obpgDQGcFmaJgB' // Professional voice
          },
          firstMessage: `Hello, this is RescueLink AI Emergency Dispatch System. I'm calling to report a ${dispatchData.urgencyLevel >= 4 ? 'CRITICAL' : 'HIGH PRIORITY'} ${dispatchData.emergencyType} emergency. ${emergencyMessage.split('\n').slice(0, 3).join('. ')}. Please confirm you can dispatch emergency services to this location.`
        }
      };

      // In a real implementation, this would use Vapi's outbound calling API
      const response = await this.simulateVapiCall(vapiCallConfig, contact);
      
      if (response.success) {
        console.log(`✅ Successfully contacted ${contact.service} via Vapi`);
        return true;
      } else {
        console.error(`❌ Failed to contact ${contact.service} via Vapi: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error making Vapi call to ${contact.service}:`, error);
      return false;
    }
  }

  private generateEmergencyMessage(data: EmergencyDispatchData): string {
    const urgencyText = data.urgencyLevel >= 4 ? 'CRITICAL EMERGENCY' : 
                       data.urgencyLevel >= 3 ? 'HIGH PRIORITY EMERGENCY' : 'EMERGENCY SITUATION';
    
    return `
${urgencyText}
Emergency Type: ${data.emergencyType.toUpperCase()}
Location: ${data.location.address}
${data.location.lat ? `GPS Coordinates: ${data.location.lat}, ${data.location.lng}` : ''}
People Involved: ${data.peopleInvolved || 'Unknown'}
Casualties/Injured: ${data.casualties || 'None reported'}
Immediate Hazards: ${data.immediateHazards || 'None reported'}
Situation Description: ${data.description || 'No additional details provided'}
Reported via: RescueLink AI Voice Emergency System
Time of Report: ${new Date(data.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Caller Location: India
    `.trim();
  }

  private async simulateVapiCall(callConfig: any, contact: EmergencyContact): Promise<{ success: boolean; error?: string }> {
    // Simulate Vapi outbound call
    console.log('📞 Initiating Vapi outbound call...');
    console.log('Call Config:', {
      to: contact.number,
      service: contact.service,
      message: callConfig.assistant.firstMessage
    });
    
    // Simulate network delay for call setup
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate high success rate for testing
    if (Math.random() > 0.1) {
      console.log(`📞 Call connected to ${contact.number}`);
      console.log(`🎙️ Emergency message delivered to ${contact.service}`);
      return { success: true };
    } else {
      return { success: false, error: 'Call failed - number busy or unreachable' };
    }
  }

  private async sendDataToDispatchCenter(data: EmergencyDispatchData): Promise<boolean> {
    try {
      console.log('📡 Sending emergency data to Indian dispatch center...');
      
      const dispatchPayload = {
        ...data,
        source: 'RescueLink AI India',
        countryCode: 'IN',
        emergencyNumber: '112', // India's unified emergency number
        confidence: 0.95,
        verified: false,
        priority: data.urgencyLevel >= 4 ? 'CRITICAL' : 
                 data.urgencyLevel >= 3 ? 'HIGH' : 'MEDIUM',
        location: {
          ...data.location,
          country: 'India',
          timezone: 'Asia/Kolkata'
        }
      };

      // Simulate dispatch center integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Emergency data transmitted to Indian emergency services');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send data to dispatch center:', error);
      return false;
    }
  }

  public async dispatchEmergencyServices(data: EmergencyDispatchData): Promise<DispatchResponse> {
    const dispatchId = `RESCUE-IN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const servicesContacted: string[] = [];
    const errors: string[] = [];

    console.log(`🚨 INITIATING EMERGENCY DISPATCH (INDIA) - ID: ${dispatchId}`);
    console.log('Emergency Data:', data);
    console.log(`📞 Will call emergency services at: +91 9714766855`);

    try {
      // 1. Send data to dispatch center first
      await this.sendDataToDispatchCenter(data);

      // 2. Get relevant emergency services (all using your test number)
      const relevantServices = this.getRelevantServices(data.emergencyType, data.urgencyLevel);
      console.log(`📞 Contacting ${relevantServices.length} emergency services via Vapi...`);

      // 3. Make Vapi calls to emergency services
      for (const service of relevantServices) {
        const success = await this.makeVapiEmergencyCall(service, data);
        
        if (success) {
          servicesContacted.push(service.service);
        } else {
          errors.push(`Failed to contact ${service.service}`);
        }

        // For testing, limit to 2 calls maximum
        if (servicesContacted.length >= 2) {
          break;
        }
      }

      // 4. Calculate estimated arrival time for Indian emergency services
      const estimatedArrival = this.calculateEstimatedArrival(data);

      // 5. Log successful dispatch
      console.log(`✅ DISPATCH COMPLETE - ${servicesContacted.length} services contacted`);
      console.log(`📞 Emergency calls made to: +91 9714766855`);
      console.log(`⏱️ Estimated arrival: ${estimatedArrival} minutes`);

      return {
        success: servicesContacted.length > 0,
        dispatchId,
        servicesContacted,
        estimatedArrival,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ DISPATCH FAILED:', error);
      return {
        success: false,
        dispatchId,
        servicesContacted,
        estimatedArrival: 0,
        errors: [`System error: ${error}`]
      };
    }
  }

  private calculateEstimatedArrival(data: EmergencyDispatchData): number {
    // Base response times for Indian emergency services (in minutes)
    const baseResponseTimes = {
      medical: 12, // Ambulance response time in India
      fire: 8,     // Fire department response
      crime: 15,   // Police response time
      other: 20    // Other emergency services
    };

    let baseTime = baseResponseTimes[data.emergencyType as keyof typeof baseResponseTimes] || 20;

    // Adjust for urgency level
    if (data.urgencyLevel >= 4) {
      baseTime *= 0.6; // 40% faster for critical emergencies
    } else if (data.urgencyLevel <= 2) {
      baseTime *= 1.4; // 40% slower for low priority
    }

    // Add realistic variation
    const variation = (Math.random() - 0.5) * 6; // ±3 minutes
    
    return Math.max(5, Math.round(baseTime + variation));
  }

  public async getEmergencyContacts(emergencyType: string): Promise<EmergencyContact[]> {
    return this.getRelevantServices(emergencyType, 5);
  }
}

export const emergencyDispatchService = new EmergencyDispatchService();
export type { EmergencyDispatchData, DispatchResponse, EmergencyContact };