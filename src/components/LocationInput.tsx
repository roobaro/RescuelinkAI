import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface LocationInputProps {
  onLocationSet: (location: { lat?: number; lng?: number; address: string }) => void;
  onNext: () => void;
}

export default function LocationInput({ onLocationSet, onNext }: LocationInputProps) {
  const [address, setAddress] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setGpsLocation(location);
        setAddress(`GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
        onLocationSet({ ...location, address: `GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(`Location access denied: ${error.message}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    onLocationSet({ address: newAddress });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-blue-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Location Information</h2>
        </div>
        <p className="text-gray-600">Help us locate you for faster emergency response</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Navigation className={`w-5 h-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
          <span>{isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}</span>
        </button>

        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{locationError}</p>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or enter manually</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address or Landmark
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter your location or nearest landmark"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={!address.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
          >
            Continue to Assessment
          </button>
        </form>
      </div>

      {gpsLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">Location Detected</p>
              <p className="text-sm text-green-700">
                Lat: {gpsLocation.lat.toFixed(6)}, Lng: {gpsLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}