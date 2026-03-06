/**
 * Advanced device and network tracking utility.
 * Gathers device fingerprint, IP geolocation, and ISP data.
 */

export interface TrackingData {
  userAgent: string;
  language: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  platform: string;
  vendor: string;
  maxTouchPoints: number;
  ip_address?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  carrier_isp?: string;
  asn?: string;
}

let cachedTrackingData: TrackingData | null = null;
let fetchPromise: Promise<TrackingData> | null = null;

export const generateDeviceFingerprint = (): Partial<TrackingData> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = window.navigator as any;
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    platform: nav.platform || nav.userAgentData?.platform || 'Unknown',
    vendor: nav.vendor,
    maxTouchPoints: nav.maxTouchPoints,
  };
};

export const fetchTrackingData = async (): Promise<TrackingData> => {
  if (cachedTrackingData) return cachedTrackingData;

  // Prevent multiple simultaneous fetches
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const baseData = generateDeviceFingerprint();

    try {
      // Gather IP, ISP, and Geolocation (without explicitly prompting the user for HTML5 Geolocation)
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const ipData = await res.json();
        cachedTrackingData = {
          ...baseData,
          ip_address: ipData.ip,
          city: ipData.city,
          region: ipData.region,
          country: ipData.country_name,
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          carrier_isp: ipData.org,
          asn: ipData.asn,
        } as TrackingData;
        return cachedTrackingData;
      }
    } catch (e) {
      console.warn('Could not fetch IP tracking data:', e);
    }

    cachedTrackingData = baseData as TrackingData;
    return cachedTrackingData;
  })();

  return fetchPromise;
};
