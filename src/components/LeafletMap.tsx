"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Point, Route } from "@/types";

interface LeafletMapProps {
  isRecording: boolean;
  points: Point[];
  currentLocation: Point | null;
  selectedRoute: Route | null;
  onAddPoint: (pt: Point) => void;
  centerLocation: Point | null;
  onCenterCleared: () => void;
}

export default function LeafletMap({
  isRecording,
  points,
  currentLocation,
  selectedRoute,
  onAddPoint,
  centerLocation,
  onCenterCleared,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Layer groups for overlay management
  const activeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentLocationLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Seoul City Hall default
    const map = L.map(mapContainerRef.current, {
      center: [37.5665, 126.978],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Position zoom control to right center if possible, or leave default top-left
    map.zoomControl.setPosition("topright");

    // Initialize layer groups
    activeLayerGroupRef.current = L.layerGroup().addTo(map);
    selectedLayerGroupRef.current = L.layerGroup().addTo(map);
    currentLocationLayerGroupRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Map Tap/Click event binding
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      if (isRecording) {
        onAddPoint({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    };

    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, [isRecording, onAddPoint]);

  // 3. Render active points & polyline
  useEffect(() => {
    const map = mapRef.current;
    const activeGroup = activeLayerGroupRef.current;
    if (!map || !activeGroup) return;

    // Clear active points/polyline
    activeGroup.clearLayers();

    if (points.length === 0) return;

    // Add markers
    points.forEach((pt, idx) => {
      const isLast = idx === points.length - 1;
      const customIcon = L.divIcon({
        className: "custom-point-marker-wrapper",
        html: `<div class="custom-point-marker ${isLast ? "last" : ""}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(activeGroup);
    });

    // Add polyline
    const latlngs = points.map((pt) => [pt.lat, pt.lng] as [number, number]);
    L.polyline(latlngs, {
      color: "hsl(200, 100%, 50%)",
      weight: 4,
      opacity: 0.8,
    }).addTo(activeGroup);
  }, [points]);

  // 4. Render selected route
  useEffect(() => {
    const map = mapRef.current;
    const selectedGroup = selectedLayerGroupRef.current;
    if (!map || !selectedGroup) return;

    selectedGroup.clearLayers();

    if (!selectedRoute || selectedRoute.points.length === 0) return;

    const routePoints = selectedRoute.points;
    const latlngs = routePoints.map((pt) => [pt.lat, pt.lng] as [number, number]);

    // Start Marker (Green)
    const startIcon = L.divIcon({
      className: "custom-start-marker",
      html: '<div style="width: 14px; height: 14px; background: hsl(142, 76%, 36%); border: 2px solid #fff; border-radius: 50%;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker(latlngs[0], { icon: startIcon }).addTo(selectedGroup);

    // End Marker (Red)
    if (latlngs.length > 1) {
      const endIcon = L.divIcon({
        className: "custom-end-marker",
        html: '<div style="width: 14px; height: 14px; background: hsl(346, 84%, 61%); border: 2px solid #fff; border-radius: 50%;"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(selectedGroup);
    }

    // Polyline
    L.polyline(latlngs, {
      color: "hsl(142, 76%, 36%)",
      weight: 5,
      opacity: 0.9,
    }).addTo(selectedGroup);

    // Fit map bounds to show route
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [selectedRoute]);

  // 5. Render current location marker
  useEffect(() => {
    const currentGroup = currentLocationLayerGroupRef.current;
    if (!currentGroup) return;

    currentGroup.clearLayers();

    if (!currentLocation) return;

    const pulseIcon = L.divIcon({
      className: "pulse-marker-wrapper",
      html: '<div class="pulse-marker"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([currentLocation.lat, currentLocationLocationlng(currentLocation)], { icon: pulseIcon }).addTo(currentGroup);
  }, [currentLocation]);

  // Helper function because Leaflet expects number keys or lat/lng
  function currentLocationLocationlng(currLoc: Point) {
    return currLoc.lng;
  }

  // 6. Handle centerLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerLocation) return;

    map.panTo([centerLocation.lat, centerLocation.lng]);
    onCenterCleared();
  }, [centerLocation, onCenterCleared]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />;
}
