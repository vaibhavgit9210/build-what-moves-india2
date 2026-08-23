/**
 * Leaflet + OpenStreetMap pin picker. Tap or click anywhere to choose the
 * place; the parent snaps it to the nearest synthetic demo area (no real
 * geocoding service is called in this prototype). The pin is an SVG circle
 * marker, so no image assets are needed. Loaded lazily: Leaflet only ships
 * to browsers that open the map.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '@/i18n';

const INDIA_CENTER: [number, number] = [22.6, 79.5];

export default function LocationMap({
  lat,
  lon,
  onPick,
}: {
  lat?: number;
  lon?: number;
  onPick: (lat: number, lon: number) => void;
}) {
  const { t } = useI18n();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const div = divRef.current;
    if (!div || mapRef.current) return;

    const placePin = (map: L.Map, la: number, lo: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([la, lo]);
      } else {
        markerRef.current = L.circleMarker([la, lo], {
          radius: 10,
          color: '#1d3557',
          weight: 3,
          fillColor: '#e63946',
          fillOpacity: 0.9,
        }).addTo(map);
      }
    };

    const map = L.map(div, { center: INDIA_CENTER, zoom: 4 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      placePin(map, e.latlng.lat, e.latlng.lng);
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });
    if (lat != null && lon != null) {
      placePin(map, lat, lon);
      map.setView([lat, lon], 10);
    }
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount-only: later pin moves come from map clicks, not props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={divRef}
      role="application"
      aria-label={t('flow.location.mapAria')}
      className="h-72 sm:h-96 w-full rounded-md border-2 border-border hc-border z-0"
    />
  );
}
