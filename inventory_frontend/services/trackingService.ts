// Tracking functionality temporarily disabled
// TODO: Re-enable when ready to implement real tracking with production credentials

export interface TrackingInfo {
  trackingNumber: string;
  carrier: 'FedEx' | 'UPS' | 'USPS' | 'Unknown';
  status: string;
  estimatedDelivery?: string;
  currentLocation?: string;
  lastUpdate?: string;
  events: TrackingEvent[];
  isDelivered: boolean;
  error?: string;
}

export interface TrackingEvent {
  date: string;
  time: string;
  description: string;
  location?: string;
}

class TrackingService {
  async trackPackage(trackingNumber: string): Promise<TrackingInfo> {
    return {
      trackingNumber,
      carrier: 'Unknown',
      status: 'Tracking temporarily disabled',
      events: [],
      isDelivered: false,
      error: 'Tracking functionality is currently disabled'
    };
  }
}

export const trackingService = new TrackingService(); 