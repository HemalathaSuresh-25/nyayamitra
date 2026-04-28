'use client';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, Navigation, Phone, Info } from 'lucide-react';

// Fix for default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Colored Icons
const createColoredIcon = (color: string) => L.icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RedIcon = createColoredIcon('red');    // Police
const BlueIcon = createColoredIcon('blue');   // Courts
const GreenIcon = createColoredIcon('green'); // Legal Aid

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);
  return null;
}

export default function LocationFinder() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Please enable location permissions to find nearby offices.");
        }
      );
    }
  }, []);

  const findNearby = async (type: string, label: string) => {
    if (!userLocation) {
      alert("Please wait for your location to be detected.");
      return;
    }

    setIsSearching(true);
    setActiveType(label);
    setError(null);
    const [lat, lng] = userLocation;
    
    const radius = label === 'Court' ? 30000 : 10000;
    
    // Improved Overpass Query with dynamic radius
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="${type}"](around:${radius}, ${lat}, ${lng});
        way["amenity"="${type}"](around:${radius}, ${lat}, ${lng});
        node["office"="${type}"](around:${radius}, ${lat}, ${lng});
        way["office"="${type}"](around:${radius}, ${lat}, ${lng});
        node["social_facility"="legal_aid"](around:${radius}, ${lat}, ${lng});
        way["social_facility"="legal_aid"](around:${radius}, ${lat}, ${lng});
      );
      out center;
    `;

    try {
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      const formattedPlaces = data.elements
        .filter((el: any) => (el.lat && el.lon) || el.center)
        .map((el: any) => {
          const plat = el.lat || el.center?.lat;
          const plon = el.lon || el.center?.lon;
          // Calculate simple Euclidean distance for sorting
          const dist = Math.sqrt(Math.pow(plat - lat, 2) + Math.pow(plon - lng, 2));
          
          return {
            name: el.tags.name || el.tags.operator || `${label} Office`,
            lat: plat,
            lon: plon,
            address: el.tags["addr:full"] || el.tags["addr:street"] || "Address not available",
            phone: el.tags.phone || el.tags["contact:phone"] || "N/A",
            type: label,
            distance: dist
          };
        })
        .sort((a: any, b: any) => a.distance - b.distance);

      // Mark the nearest one as recommended
      if (formattedPlaces.length > 0) {
        formattedPlaces[0].isRecommended = true;
      }

      setPlaces(formattedPlaces);
      if (formattedPlaces.length === 0) {
        setError(`No ${label} found within ${radius/1000}km radius.`);
      }
    } catch (err) {
      console.error("Overpass API error:", err);
      setError("Failed to fetch nearby offices. The server might be busy.");
    } finally {
      setIsSearching(false);
    }
  };

  const getDirections = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <header>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Nearby Legal Authorities</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Locate police stations, courts, and legal aid centers near you.</p>
      </header>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => findNearby('police', 'Police')} 
          disabled={isSearching}
          className="btn-secondary" 
          style={{ 
            flex: 1, border: activeType === 'Police' ? '1px solid var(--accent)' : 'var(--glass-border)',
            background: activeType === 'Police' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          {isSearching && activeType === 'Police' ? <Loader2 size={16} className="animate-spin" /> : '🔴 Police'}
        </button>
        <button 
          onClick={() => findNearby('courthouse', 'Court')} 
          disabled={isSearching}
          className="btn-secondary" 
          style={{ 
            flex: 1, border: activeType === 'Court' ? '1px solid var(--primary)' : 'var(--glass-border)',
            background: activeType === 'Court' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          {isSearching && activeType === 'Court' ? <Loader2 size={16} className="animate-spin" /> : '🔵 Courts'}
        </button>
        <button 
          onClick={() => findNearby('social_facility', 'Legal Aid')} 
          disabled={isSearching}
          className="btn-secondary" 
          style={{ 
            flex: 1, border: activeType === 'Legal Aid' ? '1px solid var(--success)' : 'var(--glass-border)',
            background: activeType === 'Legal Aid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          {isSearching && activeType === 'Legal Aid' ? <Loader2 size={16} className="animate-spin" /> : '🟢 Legal Aid'}
        </button>
      </div>

      {error && (
        <div className="animate-fade-in" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', fontSize: '0.85rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: 'var(--glass-border)', minHeight: '400px', position: 'relative' }}>
        {userLocation ? (
          <MapContainer 
            center={userLocation} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={userLocation} icon={DefaultIcon}>
              <Popup>You are here</Popup>
            </Marker>
            
            {places.map((place, i) => (
              <Marker 
                key={i} 
                position={[place.lat, place.lon]} 
                icon={place.type === 'Police' ? RedIcon : place.type === 'Court' ? BlueIcon : GreenIcon}
              >
                <Popup>
                  <div style={{ padding: '4px', minWidth: '180px' }}>
                    {place.isRecommended && (
                      <div style={{ 
                        background: '#10b981', 
                        color: 'white', 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        width: 'fit-content',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Nearest / Recommended
                      </div>
                    )}
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{place.name}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#666', display: 'flex', gap: '4px' }}><MapPin size={12} /> {place.address}</p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#666', display: 'flex', gap: '4px' }}><Phone size={12} /> {place.phone}</p>
                    <button 
                      onClick={() => getDirections(place.lat, place.lon)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Navigation size={14} /> Get Directions
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <RecenterMap position={userLocation} />
          </MapContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
            <Loader2 size={32} className="animate-spin" />
            <p>Accessing GPS location...</p>
          </div>
        )}
      </div>
    <style jsx>{`
      @media (max-width: 768px) {
        .type-btns { flex-direction: column !important; gap: 8px !important; }
        .type-btns button { width: 100% !important; padding: 12px !important; }
        .map-container { min-height: 300px !important; }
        header h2 { font-size: 1.2rem !important; }
      }
    `}</style>
    </div>
  );
}


