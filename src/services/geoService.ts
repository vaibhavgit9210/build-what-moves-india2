/**
 * Demo geolocation + reverse geocoding.
 *
 * We ask the browser for real coordinates (with the user's explicit consent,
 * never on page load), then map them to the NEAREST of six synthetic demo
 * addresses — no real geocoding service is called. If permission is denied
 * or unavailable, the caller falls back to manual entry / a demo city picker.
 */
import type { LocationInfo } from '@/lib/types';

export interface DemoCity {
  id: string;
  lat: number;
  lon: number;
  location: LocationInfo;
}

export const DEMO_CITIES: DemoCity[] = [
  {
    id: 'bengaluru',
    lat: 12.9352,
    lon: 77.6245,
    location: {
      method: 'auto',
      address: {
        house: '221, 4th Block',
        street: '80 Feet Road',
        locality: 'Koramangala',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pin: '560034',
      },
    },
  },
  {
    id: 'delhi',
    lat: 28.6139,
    lon: 77.209,
    location: {
      method: 'auto',
      address: {
        house: 'B-14',
        street: 'Patel Nagar Road',
        locality: 'West Patel Nagar',
        city: 'New Delhi',
        district: 'Central Delhi',
        state: 'Delhi',
        pin: '110008',
      },
    },
  },
  {
    id: 'mumbai',
    lat: 19.076,
    lon: 72.8777,
    location: {
      method: 'auto',
      address: {
        house: '502, Sagar Heights',
        street: 'SV Road',
        locality: 'Andheri West',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        pin: '400058',
      },
    },
  },
  {
    id: 'kolkata',
    lat: 22.5726,
    lon: 88.3639,
    location: {
      method: 'auto',
      address: {
        house: '17/2',
        street: 'Rashbehari Avenue',
        locality: 'Gariahat',
        city: 'Kolkata',
        district: 'Kolkata',
        state: 'West Bengal',
        pin: '700019',
      },
    },
  },
  {
    id: 'chennai',
    lat: 13.0827,
    lon: 80.2707,
    location: {
      method: 'auto',
      address: {
        house: '8, Plot 42',
        street: 'Lattice Bridge Road',
        locality: 'Adyar',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pin: '600020',
      },
    },
  },
  {
    id: 'guwahati',
    lat: 26.1445,
    lon: 91.7362,
    location: {
      method: 'auto',
      address: {
        house: 'House 23',
        street: 'GS Road',
        locality: 'Ganeshguri',
        city: 'Guwahati',
        district: 'Kamrup Metropolitan',
        state: 'Assam',
        pin: '781006',
      },
    },
  },
];

function nearestCity(lat: number, lon: number): DemoCity {
  let best = DEMO_CITIES[0];
  let bestD = Infinity;
  for (const c of DEMO_CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export type GeoError = 'denied' | 'unavailable' | 'timeout';

/**
 * Resolve a demo LocationInfo from the browser's geolocation.
 * Rejects with a GeoError string so the UI can offer manual entry.
 */
export function detectLocation(): Promise<LocationInfo> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject('unavailable' as GeoError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = nearestCity(latitude, longitude);
        resolve({ ...city.location, lat: latitude, lon: longitude, method: 'auto' });
      },
      (err) => {
        reject((err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable') as GeoError);
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  });
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
