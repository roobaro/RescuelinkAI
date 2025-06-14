import React, { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, Clock, Users, AlertTriangle, CheckCircle, Truck, PhoneCall, Radio } from 'lucide-react';

interface EmergencyDispatchDashboardProps {
  emergencyData: any;
}

export default function EmergencyDispatchDashboard({ emergencyData }: EmergencyDispatchDashboardProps) {
  const [dispatchStatus, setDispatchStatus] = useState<'processing' | 'dispatched' | 'en-route' | 'arrived'>('processing');
  const [responseTime, setResponseTime] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState(emergencyData.estimatedArrival || 8);
  const [activeServices, setActiveServices] = useState<string[]>([]);

  useEffect(() => {
    // If services were already contacted, start with dispatched status
    if (emergencyData.servicesContacted && emergencyData.servicesContacted.length > 0) {
      setDispatchStatus('dispatched');
      setActiveServices(emergencyData.servicesContacted);
    } else {
      // Simulate dispatch process for demo
      const timer1 = setTimeout(() => {
        setDispatchStatus('dispatched');
        setActiveServices(getEmergencyServices());
      }, 2000);
      
      const timer2 = setTimeout(() => setDispatchStatus('en-route'), 5000);
      const timer3 = setTimeout(() => setDispatchStatus('arrived'), 30000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [emergencyData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResponseTime(prev => prev + 1);
      if (dispatchStatus === 'en-route' && estimatedArrival > 0) {
        setEstimatedArrival(prev => Math.max(0, prev - 0.1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatchStatus, estimatedArrival]);

  const getStatusColor = () => {
    switch (dispatchStatus) {
      case 'processing': return 'bg-yellow-500';
      case 'dispatched': return 'bg-blue-500';
      case 'en-route': return 'bg-orange-500';
      case 'arrived': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (dispatchStatus) {
      case 'processing': return 'Processing Emergency Request';
      case 'dispatched': return 'Emergency Services Dispatched';
      case 'en-route': return 'Emergency Services En Route';
      case 'arrived': return 'Emergency Services On Scene';
      default: return 'Unknown Status';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = () => {
    if (emergencyData.urgencyLevel >= 4) return 'text-red-600 bg-red-50';
    if (emergencyData.urgencyLevel >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getEmergencyServices = () => {
    const services = [];
    if (emergencyData.emergencyType === 'medical') services.push('Emergency Medical Services', 'Ambulance');
    if (emergencyData.emergencyType === 'fire') services.push('Fire Department', 'Hazmat Team');
    if (emergencyData.emergencyType === 'crime') services.push('Police Department', 'K-9 Unit');
    if (emergencyData.casualties > 0) services.push('Paramedic Team');
    if (emergencyData.urgencyLevel >= 4) services.push('Emergency Services (911)');
    return services.length > 0 ? services : ['Emergency Response Team'];
  };

  const getEmergencyNumbers = () => {
    const numbers = [];
    if (emergencyData.urgencyLevel >= 4) numbers.push({ service: '911 Emergency', number: '911', status: 'contacted' });
    if (emergencyData.emergencyType === 'medical') numbers.push({ service: 'Local Hospital', number: '(555) 123-4567', status: 'notified' });
    if (emergencyData.emergencyType === 'fire') numbers.push({ service: 'Fire Department', number: '(555) 234-5678', status: 'dispatched' });
    if (emergencyData.emergencyType === 'crime') numbers.push({ service: 'Police Department', number: '(555) 345-6789', status: 'en-route' });
    return numbers;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-12 h-12 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Dispatch Center</h1>
            <p className="text-lg text-gray-600">Real-time emergency response coordination</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`${getStatusColor()} text-white rounded-xl p-6 text-center`}>
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <h2 className="text-xl font-bold">{getStatusText()}</h2>
        </div>
        <p className="text-white/90">Response Time: {formatTime(responseTime)}</p>
        {emergencyData.dispatchId && (
          <p className="text-white/80 text-sm mt-1">Dispatch ID: {emergencyData.dispatchId}</p>
        )}
      </div>

      {/* Emergency Services Contacted */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <PhoneCall className="w-5 h-5 mr-2" />
          Emergency Services Contacted
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getEmergencyNumbers().map((contact, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{contact.service}</p>
                  <p className="text-sm text-gray-600">{contact.number}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contact.status === 'contacted' ? 'bg-green-100 text-green-800' :
                  contact.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                  contact.status === 'en-route' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contact.status}
                </span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Emergency Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${getUrgencyColor()}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Priority Level</span>
                <span className="text-2xl font-bold">{emergencyData.urgencyLevel}/5</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Emergency Type</p>
                <p className="font-medium capitalize">{emergencyData.emergencyType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{emergencyData.location?.address || 'Location pending'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">People Involved</p>
                <p className="font-medium">{emergencyData.peopleInvolved || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">ETA</p>
                <p className="font-medium">
                  {dispatchStatus === 'arrived' ? 'On Scene' : `${Math.ceil(estimatedArrival)} min`}
                </p>
              </div>
            </div>
            
            {emergencyData.casualties && (
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Casualties</p>
                  <p className="font-medium text-red-600">{emergencyData.casualties}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispatched Services */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
          <Radio className="w-5 h-5 mr-2" />
          Active Emergency Response Units
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeServices.length > 0 ? activeServices : getEmergencyServices()).map((service, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{service}</p>
                <p className="text-sm text-gray-600">
                  {dispatchStatus === 'arrived' ? 'On Scene' : 
                   dispatchStatus === 'en-route' ? 'En Route' : 
                   dispatchStatus === 'dispatched' ? 'Dispatched' : 'Preparing'}
                </p>
              </div>
              <CheckCircle className={`w-5 h-5 ${
                dispatchStatus !== 'processing' ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
          ))}
        </div>
      </div>

      {/* Additional Details */}
      {(emergencyData.description || emergencyData.immediateHazards) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div className="space-y-4">
            {emergencyData.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Situation Description</h4>
                <p className="text-gray-700 bg-white p-3 rounded-lg border">{emergencyData.description}</p>
              </div>
            )}
            
            {emergencyData.immediateHazards && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Immediate Hazards</h4>
                <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">{emergencyData.immediateHazards}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Emergency Contact Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Voice connection active</span>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Location shared with responders</span>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Emergency services contacted & dispatched</span>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Direct line to emergency operators maintained</span>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}