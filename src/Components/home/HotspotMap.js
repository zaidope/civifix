import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { useMap, useMapEvents } from "react-leaflet";
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { ExternalLink, ArrowUp } from "lucide-react";
import { API_URL } from "../../config";

// Strict geographic bounding box for India to restrict map panning and optimize user view scope
const INDIA_BOUNDS = L.latLngBounds(
  L.latLng(6.5, 68.0),
  L.latLng(35.5, 97.5)
);

function MapController({ setZoomLevel, setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    if (setMapInstance) setMapInstance(map);
    map.setMaxBounds(INDIA_BOUNDS);
    map.options.minZoom = 5;
  }, [map, setMapInstance]);

  useMapEvents({
    zoomend: () => setZoomLevel(map.getZoom()),
  });

  return null;
}

function getZoneColor(total) {
  if (total <= 5) return "#22c55e";
  if (total <= 15) return "#eab308";
  return "#ef4444";
}

const ComplaintMarker = React.memo(({ comp }) => {
  const isResolved = comp.status === "Resolved";
  const color = isResolved ? "#22c55e" : "#ef4444";

  const markerHtml =
    '<div style="' +
    "background-color:" + color + ";" +
    "width:14px;height:14px;border-radius:50%;" +
    "border:2px solid white;" +
    "box-shadow:0 0 6px rgba(0,0,0,0.4);" +
    "transition:transform 0.2s ease;cursor:pointer;" +
    '" class="custom-pinpoint-marker-inner"></div>';

  const compIcon = new L.DivIcon({
    className: "custom-pinpoint-marker",
    html: markerHtml,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const statusClass = isResolved
    ? "bg-green-100 text-green-700"
    : "bg-yellow-100 text-yellow-700";

  const trackUrl = "/track-status?id=" + comp._id;

  return (
    <Marker position={[comp.latitude, comp.longitude]} icon={compIcon}>
      <Popup>
        <div className="text-sm min-w-[200px]">
          <div className="flex items-center justify-between mb-2 border-b pb-2">
            <span className="font-bold text-gray-800">{comp.category}</span>
            <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + statusClass}>
              {comp.status}
            </span>
          </div>
          <p className="text-gray-600 italic mb-3 line-clamp-3">"{comp.description}"</p>
          <Link
            to={trackUrl}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md transition-colors text-xs font-semibold"
          >
            Track Status <ExternalLink size={12} />
          </Link>
        </div>
      </Popup>
    </Marker>
  );
});

function HotspotMap() {
  const [zones, setZones] = useState([]);
  const [publicComplaints, setPublicComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    const el = document.getElementById("hotspot-map-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapVisible) return;
    async function fetchData() {
      try {
        const [zonesRes, compRes] = await Promise.all([
          fetch(API_URL + "/api/zones"),
          fetch(API_URL + "/public-complaints"),
        ]);
        if (zonesRes.ok) setZones(await zonesRes.json());
        if (compRes.ok) setPublicComplaints(await compRes.json());
      } catch (err) {
        /* fail silently */
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [mapVisible]);

  const defaultCenter = useMemo(() => {
    const firstActive =
      zones.find((z) => {
        const lat = parseFloat(z.center_lat);
        const lon = parseFloat(z.center_lon);
        return !isNaN(lat) && !isNaN(lon) && (z.total_issues || 0) > 0;
      }) || zones[0];

    if (firstActive) {
      const lat = parseFloat(firstActive.center_lat);
      const lon = parseFloat(firstActive.center_lon);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
    return [12.9716, 77.5946];
  }, [zones]);

  const filteredComplaints = useMemo(
    () =>
      publicComplaints
        .filter((c) => {
          const lat = parseFloat(c.latitude);
          const lon = parseFloat(c.longitude);
          return !isNaN(lat) && !isNaN(lon);
        })
        .map((c) => ({
          ...c,
          latitude: parseFloat(c.latitude),
          longitude: parseFloat(c.longitude),
        })),
    [publicComplaints]
  );

  const filteredZones = useMemo(
    () =>
      zones
        .filter((z) => {
          const lat = parseFloat(z.center_lat);
          const lon = parseFloat(z.center_lon);
          return !isNaN(lat) && !isNaN(lon) && (z.total_issues || 0) > 0;
        })
        .map((z) => ({
          ...z,
          center_lat: parseFloat(z.center_lat),
          center_lon: parseFloat(z.center_lon),
        })),
    [zones]
  );

  const handleSetZoomLevel = useCallback((z) => setZoomLevel(z), []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── CSS injected as a string ── */
  const mapStyles = [
    ".custom-pinpoint-marker-inner:hover{transform:scale(1.3)!important;box-shadow:0 0 10px rgba(0,0,0,.2)!important}",
    ".custom-pulse-marker{display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border-radius:50%;animation:markerPulse 2s infinite ease-in-out;text-shadow:0 1px 3px rgba(0,0,0,.3)}",
    "@keyframes markerPulse{0%{transform:scale(.95);opacity:.9}50%{transform:scale(1.1);opacity:1}100%{transform:scale(.95);opacity:.9}}",
  ].join("\n");

  return (
    <section id="hotspot-map-section" className="relative w-full h-screen bg-white">
      <style>{mapStyles}</style>

      {/* Top gradient blending hero → map */}
      <div
        className="absolute top-0 left-0 w-full h-40 z-[1000] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #0A0A0A 0%, rgba(10,10,10,0.6) 50%, transparent 100%)",
        }}
      />

      {/* Back-to-top FAB */}
      <button
        onClick={scrollToTop}
        className="absolute bottom-8 right-8 z-[1000] bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-gray-50 text-gray-800 p-4 rounded-full flex items-center justify-center transition-all hover:-translate-y-1"
        title="Scroll back to top"
      >
        <ArrowUp size={24} className="text-indigo-600" />
      </button>

      {/* Map container */}
      <div className="w-full h-full relative z-10">
        {!mapVisible ? (
          <div className="w-full h-full bg-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Loading map…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Floating info panel */}
            <div className="absolute top-10 left-6 z-[1000] max-w-xs md:max-w-sm bg-white/95 backdrop-blur-md border border-gray-100 p-5 rounded-2xl shadow-2xl text-left pointer-events-auto">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="bg-indigo-100 p-1.5 rounded-lg">📍</span>
                Civic Issue Hotspots
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Live view of active grievance zones.
              </p>
              {!loading && (
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-700 font-semibold">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]" />
                    Low (≤ 5)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_4px_#facc15]" />
                    Medium (6–15)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
                    {"High (> 15)"}
                  </span>
                </div>
              )}
            </div>

            <MapContainer
              key="hotspot-map"
              center={defaultCenter}
              zoom={13}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              zoomControl={true}
              maxBounds={INDIA_BOUNDS}
              maxBoundsViscosity={0.8}
              minZoom={5}
              style={{ height: "100%", width: "100%", background: "#f8fafc" }}
              preferCanvas={true}
            >
              <MapController
                setZoomLevel={handleSetZoomLevel}
                setMapInstance={setMapInstance}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                updateWhenZooming={false}
                updateWhenIdle={true}
              />

              {zoomLevel <= 13
                ? filteredZones.map((zone) => {
                    const total = zone.total_issues || 0;
                    const color = getZoneColor(total);

                    const customIcon = new L.DivIcon({
                      className: "",
                      html:
                        '<div class="custom-pulse-marker" style="background-color:' +
                        color +
                        ";color:white;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,.3);cursor:pointer;" +
                        '" title="Click to view complaints">' +
                        total +
                        "</div>",
                      iconSize: [36, 36],
                      iconAnchor: [18, 18],
                    });

                    const handleZoneClick = () => {
                      setZoomLevel(15);
                      if (mapInstance) {
                        mapInstance.flyTo(
                          [zone.center_lat, zone.center_lon],
                          15,
                          { duration: 0.8 }
                        );
                      }
                    };

                    return (
                      <React.Fragment key={zone.zone_id}>
                        <Circle
                          center={[zone.center_lat, zone.center_lon]}
                          radius={2500}
                          pathOptions={{
                            color,
                            fillColor: color,
                            fillOpacity: 0.15,
                            weight: 1.5,
                          }}
                          eventHandlers={{ click: handleZoneClick }}
                        />
                        <Marker
                          position={[zone.center_lat, zone.center_lon]}
                          icon={customIcon}
                          eventHandlers={{ click: handleZoneClick }}
                        />
                      </React.Fragment>
                    );
                  })
                : filteredComplaints.slice(0, 120).map((comp) => (
                    <ComplaintMarker key={comp._id} comp={comp} />
                  ))}
            </MapContainer>
          </>
        )}
      </div>
    </section>
  );
}

export default React.memo(HotspotMap);
