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
    // US Emergency Services
    'US': [
      { service: 'Emergency Services (911)', number: '911', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] },
      { service: 'Fire Department', number: '911', priority: 2, capabilities: ['fire'] },
      { service: 'Police Department', number: '911', priority: 2, capabilities: ['crime'] },
      { service: 'Emergency Medical Services', number: '911', priority: 2, capabilities: ['medical'] },
      { service: 'Poison Control', number: '1-800-222-1222', priority: 3, capabilities: ['medical'] },
      { service: 'Crisis Hotline', number: '988', priority: 3, capabilities: ['other'] }
    ],
    // UK Emergency Services
    'UK': [
      { service: 'Emergency Services (999)', number: '999', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] },
      { service: 'NHS Direct', number: '111', priority: 3, capabilities: ['medical'] }
    ],
    // Canada Emergency Services
    'CA': [
      { service: 'Emergency Services (911)', number: '911', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] }
    ],
    // Australia Emergency Services
    'AU': [
      { service: 'Emergency Services (000)', number: '000', priority: 1, capabilities: ['medical', 'fire', 'crime', 'other'] },
      { service: 'Police', number: '000', priority: 2, capabilities: ['crime'] },
      { service: 'Fire & Rescue', number: '000', priority: 2, capabilities: ['fire'] },
      { service: 'Ambulance', number: '000', priority: 2, capabilities: ['medical'] }
    ]
  };

  private getCountryCode(): string {
    // In a real implementation, this would detect user's location
    // For now, defaulting to US
    return 'US';
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

  private async makeEmergencyCall(contact: EmergencyContact, dispatchData: EmergencyDispatchData): Promise<boolean> {
    try {
      console.log(`🚨 EMERGENCY DISPATCH: Calling ${contact.service} at ${contact.number}`);
      
      // In a real implementation, this would use a telephony service like:
      // - Twilio Voice API
      // - Vonage Voice API
      // - AWS Connect
      // - Or integrate with local emergency dispatch systems
      
      const callData = {
        to: contact.number,
        from: '+1234567890', // Your verified phone number
        message: this.generateEmergencyMessage(dispatchData),
        priority: contact.priority,
        service: contact.service
      };

      // Simulate API call to telephony service
      const response = await this.simulateEmergencyCall(callData);
      
      if (response.success) {
        console.log(`✅ Successfully contacted ${contact.service}`);
        return true;
      } else {
        console.error(`❌ Failed to contact ${contact.service}: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error calling ${contact.service}:`, error);
      return false;
    }
  }

  private generateEmergencyMessage(data: EmergencyDispatchData): string {
    const urgencyText = data.urgencyLevel >= 4 ? 'CRITICAL' : 
                       data.urgencyLevel >= 3 ? 'HIGH PRIORITY' : 'STANDARD';
    
    return `
EMERGENCY DISPATCH - ${urgencyText}
Type: ${data.emergencyType.toUpperCase()}
Location: ${data.location.address}
${data.location.lat ? `GPS: ${data.location.lat}, ${data.location.lng}` : ''}
People Involved: ${data.peopleInvolved || 'Unknown'}
Casualties: ${data.casualties || 'None reported'}
Immediate Hazards: ${data.immediateHazards || 'None reported'}
Description: ${data.description || 'No additional details'}
Reported via: RescueLink AI Voice System
Time: ${new Date(data.timestamp).toLocaleString()}
    `.trim();
  }

  private async simulateEmergencyCall(callData: any): Promise<{ success: boolean; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate 95% success rate
    if (Math.random() > 0.05) {
      return { success: true };
    } else {
      return { success: false, error: 'Network timeout or busy signal' };
    }
  }

  private async sendDataToDispatchCenter(data: EmergencyDispatchData): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with:
      // - Local 911 dispatch centers
      // - Emergency management systems
      // - Hospital networks
      // - Fire department dispatch systems
      
      console.log('📡 Sending data to emergency dispatch center...');
      
      const dispatchPayload = {
        ...data,
        source: 'RescueLink AI',
        confidence: 0.95,
        verified: false, // Would be true after human verification
        priority: data.urgencyLevel >= 4 ? 'CRITICAL' : 
                 data.urgencyLevel >= 3 ? 'HIGH' : 'MEDIUM'
      };

      // Simulate dispatch center API
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Emergency data transmitted to dispatch center');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send data to dispatch center:', error);
      return false;
    }
  }

  public async dispatchEmergencyServices(data: EmergencyDispatchData): Promise<DispatchResponse> {
    const dispatchId = `RESCUE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const servicesContacted: string[] = [];
    const errors: string[] = [];

    console.log(`🚨 INITIATING EMERGENCY DISPATCH - ID: ${dispatchId}`);
    console.log('Emergency Data:', data);

    try {
      // 1. Send data to dispatch center first
      await this.sendDataToDispatchCenter(data);

      // 2. Get relevant emergency services
      const relevantServices = this.getRelevantServices(data.emergencyType, data.urgencyLevel);
      console.log(`📞 Contacting ${relevantServices.length} emergency services...`);

      // 3. Contact emergency services in priority order
      for (const service of relevantServices) {
        const success = await this.makeEmergencyCall(service, data);
        
        if (success) {
          servicesContacted.push(service.service);
        } else {
          errors.push(`Failed to contact ${service.service}`);
        }

        // For critical emergencies, try multiple services
        if (data.urgencyLevel >= 4 && servicesContacted.length >= 2) {
          break;
        } else if (servicesContacted.length >= 1) {
          break;
        }
      }

      // 4. Calculate estimated arrival time based on emergency type and location
      const estimatedArrival = this.calculateEstimatedArrival(data);

      // 5. Log successful dispatch
      console.log(`✅ DISPATCH COMPLETE - ${servicesContacted.length} services contacted`);
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
    // Base response times by emergency type (in minutes)
    const baseResponseTimes = {
      medical: 8,
      fire: 6,
      crime: 12,
      other: 15
    };

    let baseTime = baseResponseTimes[data.emergencyType as keyof typeof baseResponseTimes] || 15;

    // Adjust for urgency level
    if (data.urgencyLevel >= 4) {
      baseTime *= 0.7; // 30% faster for critical
    } else if (data.urgencyLevel <= 2) {
      baseTime *= 1.3; // 30% slower for low priority
    }

    // Add some randomness for realism
    const variation = (Math.random() - 0.5) * 4; // ±2 minutes
    
    return Math.max(3, Math.round(baseTime + variation));
  }

  public async getEmergencyContacts(emergencyType: string): Promise<EmergencyContact[]> {
    return this.getRelevantServices(emergencyType, 5);
  }
}

export const emergencyDispatchService = new EmergencyDispatchService();
export type { EmergencyDispatchData, DispatchResponse, EmergencyContact };