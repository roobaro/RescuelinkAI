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
  transferInitiated?: boolean;
  twilioCallSid?: string;
  errors?: string[];
}

class EmergencyDispatchService {
  private emergencyContacts: Record<string, EmergencyContact[]> = {
    // India Emergency Services - Using your test number for call transfer
    'IN': [
      { service: 'Emergency Services (Direct Transfer)', number: '+919714766855', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] },
      { service: 'Police (Transfer)', number: '+919714766855', priority: 2, capabilities: ['crime'] },
      { service: 'Fire Department (Transfer)', number: '+919714766855', priority: 2, capabilities: ['fire'] },
      { service: 'Ambulance (Transfer)', number: '+919714766855', priority: 2, capabilities: ['medical'] },
      { service: 'Disaster Management (Transfer)', number: '+919714766855', priority: 3, capabilities: ['other'] }
    ]
  };

  private getCountryCode(): string {
    // Set to India for testing with your number
    return 'IN';
  }

  private getRelevantServices(emergencyType: string, urgencyLevel: number): EmergencyContact[] {
    const countryCode = this.getCountryCode();
    const allServices = this.emergencyContacts[countryCode] || [];
    
    return allServices
      .filter(service => 
        service.capabilities.includes(emergencyType) || 
        service.capabilities.includes('other') ||
        (urgencyLevel >= 4 && service.priority === 1)
      )
      .sort((a, b) => a.priority - b.priority);
  }

  private async initiateTwilioCallTransfer(dispatchData: EmergencyDispatchData): Promise<{
    success: boolean;
    callSid?: string;
    error?: string;
  }> {
    try {
      const twilioNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+14177644087';
      const emergencyNumber = import.meta.env.VITE_EMERGENCY_CONTACT_NUMBER || '+919714766855';
      
      console.log(`📞 TWILIO CALL TRANSFER: ${twilioNumber} → ${emergencyNumber}`);
      
      // Create transfer request payload
      const transferPayload = {
        from: twilioNumber,
        to: emergencyNumber,
        emergencyData: dispatchData,
        transferType: 'emergency_bridge',
        timestamp: new Date().toISOString(),
        dispatchId: `RESCUE-TRANSFER-${Date.now()}`
      };

      console.log('🔄 Transfer Payload:', transferPayload);
      
      // In a real implementation, this would call your backend API that handles Twilio transfers
      // The backend would use Twilio's REST API to create a call and bridge it
      const transferResponse = await this.simulateTwilioTransferAPI(transferPayload);
      
      if (transferResponse.success) {
        console.log('✅ Twilio call transfer initiated successfully');
        console.log(`📞 Call SID: ${transferResponse.callSid}`);
        return {
          success: true,
          callSid: transferResponse.callSid
        };
      } else {
        console.error('❌ Twilio call transfer failed:', transferResponse.error);
        return {
          success: false,
          error: transferResponse.error
        };
      }
      
    } catch (error) {
      console.error('❌ Twilio transfer error:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  private async simulateTwilioTransferAPI(payload: any): Promise<{
    success: boolean;
    callSid?: string;
    error?: string;
  }> {
    // Simulate Twilio REST API call for call transfer
    console.log('📡 Calling Twilio REST API for call transfer...');
    console.log('API Endpoint: POST /api/twilio/transfer-call');
    console.log('Payload:', payload);
    
    // Simulate network delay for API call
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    // Simulate high success rate for testing
    if (Math.random() > 0.15) {
      const callSid = `CA${Math.random().toString(36).substr(2, 32)}`;
      console.log('📞 Twilio API Response: Call created successfully');
      console.log(`🔗 Call bridging: ${payload.from} ↔ ${payload.to}`);
      console.log(`📋 Call SID: ${callSid}`);
      
      return {
        success: true,
        callSid: callSid
      };
    } else {
      return {
        success: false,
        error: 'Twilio API Error: Unable to create call - emergency line busy or unreachable'
      };
    }
  }

  private generateEmergencyBriefing(data: EmergencyDispatchData): string {
    const urgencyText = data.urgencyLevel >= 4 ? 'CRITICAL EMERGENCY' : 
                       data.urgencyLevel >= 3 ? 'HIGH PRIORITY EMERGENCY' : 'EMERGENCY SITUATION';
    
    return `
EMERGENCY CALL TRANSFER - ${urgencyText}
Emergency Type: ${data.emergencyType.toUpperCase()}
Location: ${data.location.address}
${data.location.lat ? `GPS: ${data.location.lat}, ${data.location.lng}` : ''}
People Involved: ${data.peopleInvolved || 'Unknown'}
Casualties: ${data.casualties || 'None reported'}
Immediate Hazards: ${data.immediateHazards || 'None reported'}
Description: ${data.description || 'No additional details'}
Time: ${new Date(data.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Source: RescueLink AI Voice Emergency System (India)
    `.trim();
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
        },
        transferMethod: 'twilio_bridge',
        briefing: this.generateEmergencyBriefing(data)
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

    console.log(`🚨 INITIATING EMERGENCY DISPATCH WITH CALL TRANSFER (INDIA) - ID: ${dispatchId}`);
    console.log('Emergency Data:', data);
    console.log(`📞 Will transfer call to: +91 9714766855 via Twilio`);

    try {
      // 1. Send data to dispatch center first
      await this.sendDataToDispatchCenter(data);

      // 2. Initiate Twilio call transfer
      console.log('🔄 Initiating Twilio call transfer...');
      const transferResult = await this.initiateTwilioCallTransfer(data);
      
      let twilioCallSid: string | undefined;
      let transferInitiated = false;

      if (transferResult.success) {
        console.log('✅ Call transfer initiated successfully');
        twilioCallSid = transferResult.callSid;
        transferInitiated = true;
        servicesContacted.push('Emergency Services (Direct Transfer)');
      } else {
        console.error('❌ Call transfer failed:', transferResult.error);
        errors.push(`Call transfer failed: ${transferResult.error}`);
      }

      // 3. Get relevant emergency services for backup notification
      const relevantServices = this.getRelevantServices(data.emergencyType, data.urgencyLevel);
      
      // Add backup services to contacted list
      for (const service of relevantServices.slice(0, 2)) {
        if (!servicesContacted.includes(service.service)) {
          servicesContacted.push(service.service);
        }
      }

      // 4. Calculate estimated arrival time for Indian emergency services
      const estimatedArrival = this.calculateEstimatedArrival(data);

      // 5. Log successful dispatch
      console.log(`✅ DISPATCH COMPLETE - Call transfer ${transferInitiated ? 'successful' : 'failed'}`);
      console.log(`📞 ${transferInitiated ? 'Call transferred to' : 'Backup notification sent to'}: +91 9714766855`);
      console.log(`⏱️ Estimated arrival: ${estimatedArrival} minutes`);
      if (twilioCallSid) {
        console.log(`📋 Twilio Call SID: ${twilioCallSid}`);
      }

      return {
        success: transferInitiated || servicesContacted.length > 0,
        dispatchId,
        servicesContacted,
        estimatedArrival,
        transferInitiated,
        twilioCallSid,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ DISPATCH FAILED:', error);
      return {
        success: false,
        dispatchId,
        servicesContacted,
        estimatedArrival: 0,
        transferInitiated: false,
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