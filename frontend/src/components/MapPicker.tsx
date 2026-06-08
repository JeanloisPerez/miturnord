/**
 * MapPicker — Interactive map component for selecting a branch location.
 *
 * Features:
 * - Click anywhere on the map to drop a pin
 * - Drag the pin to adjust
 * - Address search with Nominatim (OpenStreetMap geocoder, free, no API key)
 * - Auto-fills address, lat, lng fields
 * - Read-only view mode (displays a static pin on the saved location)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, MapPin } from 'lucide-react';

// Fix Leaflet default icon (broken in Vite/bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Santo Domingo, DR as default center
const DR_CENTER: [number, number] = [18.4861, -69.9312];

export interface MapLocation {
    lat: number;
    lng: number;
    address: string;
}

interface MapPickerProps {
    value?: MapLocation | null;
    onChange?: (loc: MapLocation) => void;
    readOnly?: boolean;
    height?: number;
    placeholder?: string;
    helperText?: string;
    autoLocateOnMount?: boolean;
}

// Inner component that handles map click events
function PinHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Centers the map on coordinates programmatically
function MapController({ center }: { center?: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 16);
    }, [center, map]);
    return null;
}

export default function MapPicker({
    value,
    onChange,
    readOnly = false,
    height = 320,
    placeholder = 'Buscar direcciÃ³n en RepÃºblica Dominicana...',
    helperText,
    autoLocateOnMount = false,
}: MapPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        value ? [value.lat, value.lng] : null
    );
    const [flyTo, setFlyTo] = useState<[number, number] | undefined>();
    const [search, setSearch] = useState(value?.address ?? '');
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const [searchError, setSearchError] = useState('');
    const autoLocateTried = useRef(false);

    // Reverse geocode a lat/lng to an address string using Nominatim
    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'es' } }
            );
            const data = await res.json();
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }, []);

    // Handle map click → drop pin + reverse geocode
    const handleMapClick = useCallback(async (lat: number, lng: number) => {
        if (readOnly) return;
        setPosition([lat, lng]);
        const address = await reverseGeocode(lat, lng);
        setSearch(address);
        onChange?.({ lat, lng, address });
    }, [readOnly, reverseGeocode, onChange]);

    // Forward geocode: search address → move map + pin
    const handleSearch = useCallback(async () => {
        if (!search.trim()) return;
        setSearching(true);
        setSearchError('');
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1&countrycodes=do`,
                { headers: { 'Accept-Language': 'es' } }
            );
            const data = await res.json();
            if (data.length === 0) {
                setSearchError('No se encontró esa dirección. Intenta ser más específico.');
                return;
            }
            const { lat, lon, display_name } = data[0];
            const numLat = Number(lat);
            const numLng = Number(lon);
            setPosition([numLat, numLng]);
            setFlyTo([numLat, numLng]);
            setSearch(display_name);
            onChange?.({ lat: numLat, lng: numLng, address: display_name });
        } catch {
            setSearchError('Error al buscar. Verifica tu conexión.');
        } finally {
            setSearching(false);
        }
    }, [search, onChange]);

    const handleUseCurrentLocation = useCallback(() => {
        if (readOnly) return;
        if (!navigator.geolocation) {
            setSearchError('Tu navegador no permite obtener la ubicaciÃ³n actual.');
            return;
        }

        setLocating(true);
        setSearchError('');
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const lat = coords.latitude;
                const lng = coords.longitude;
                setPosition([lat, lng]);
                setFlyTo([lat, lng]);
                const address = await reverseGeocode(lat, lng);
                setSearch(address);
                onChange?.({ lat, lng, address });
                setLocating(false);
            },
            () => {
                setSearchError('No se pudo obtener tu ubicaciÃ³n. Revisa el permiso del navegador.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [readOnly, reverseGeocode, onChange]);

    useEffect(() => {
        if (!autoLocateOnMount || readOnly || value || autoLocateTried.current) return;
        autoLocateTried.current = true;
        handleUseCurrentLocation();
    }, [autoLocateOnMount, handleUseCurrentLocation, readOnly, value]);

    // Handle Enter key in search input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
    };

    const mapCenter: [number, number] = position ?? DR_CENTER;

    return (
        <div className="space-y-2">
            {!readOnly && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        aria-label={placeholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar dirección en República Dominicana..."
                        className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locating}
                        className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
                        title="Usar mi ubicaciÃ³n actual"
                    >
                        <LocateFixed size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searching || locating}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
                    >
                        {searching ? '...' : 'Buscar'}
                    </button>
                </div>
            )}

            {searchError && <p className="text-red-500 text-xs">{searchError}</p>}

            {!readOnly && (
                <p className="text-gray-400 text-xs flex items-center gap-1.5">
                    <MapPin size={12} className="shrink-0" />
                    {position ? 'Pin colocado. Puedes moverlo haciendo clic en el mapa.' : helperText || 'Haz clic en el mapa para colocar el pin de la sucursal.'}
                </p>
            )}

            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
                <MapContainer
                    center={mapCenter}
                    zoom={position ? 16 : 12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={!readOnly}
                    dragging={!readOnly || true}
                    zoomControl={!readOnly}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                    />
                    {!readOnly && <PinHandler onPick={handleMapClick} />}
                    {flyTo && <MapController center={flyTo} />}
                    {position && (
                        <Marker
                            position={position}
                            draggable={!readOnly}
                            eventHandlers={{
                                dragend: async (e) => {
                                    const latlng = (e.target as any).getLatLng();
                                    const address = await reverseGeocode(latlng.lat, latlng.lng);
                                    setPosition([latlng.lat, latlng.lng]);
                                    setSearch(address);
                                    onChange?.({ lat: latlng.lat, lng: latlng.lng, address });
                                },
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            {position && (
                <div className="flex items-center gap-4 text-xs text-gray-400 px-1">
                    <span>Lat: {position[0].toFixed(6)}</span>
                    <span>Lng: {position[1].toFixed(6)}</span>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => {
                                setPosition(null);
                                setSearch('');
                                onChange?.({ lat: 0, lng: 0, address: '' });
                            }}
                            className="text-red-400 hover:text-red-600 ml-auto transition"
                        >
                            Quitar pin
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
