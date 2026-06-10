"use client";

import { useEffect, useRef } from "react";
import { Point, Route } from "@/types";

interface NaverMapProps {
  isRecording: boolean;
  points: Point[];
  currentLocation: Point | null;
  selectedRoute: Route | null;
  onAddPoint: (pt: Point) => void;
  centerLocation: Point | null;
  onCenterCleared: () => void;
}

export default function NaverMap({
  isRecording,
  points,
  currentLocation,
  selectedRoute,
  onAddPoint,
  centerLocation,
  onCenterCleared,
}: NaverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);

  // Overlay references to clean up
  const activeMarkersRef = useRef<any[]>([]);
  const activePolylineRef = useRef<any>(null);
  const selectedMarkersRef = useRef<any[]>([]);
  const selectedPolylineRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const naver = (window as any).naver;
    if (!naver || !naver.maps) return;

    // Default center (Seoul, City Hall)
    const initialCenter = new naver.maps.LatLng(37.5665, 126.978);
    const mapOptions = {
      center: initialCenter,
      zoom: 16,
      logoControl: false,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER,
      },
    };

    const map = new naver.maps.Map(mapContainerRef.current, mapOptions);
    mapRef.current = map;

    return () => {
      if (clickListenerRef.current) {
        naver.maps.Event.removeListener(clickListenerRef.current);
      }
    };
  }, []);

  // 2. Bind Map Click Listener
  useEffect(() => {
    const map = mapRef.current;
    const naver = (window as any).naver;
    if (!map || !naver) return;

    // Remove existing listener
    if (clickListenerRef.current) {
      naver.maps.Event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // Only allow manual tapping when recording
    if (isRecording) {
      clickListenerRef.current = naver.maps.Event.addListener(map, "click", (e: any) => {
        const latlng = e.coord;
        onAddPoint({
          lat: latlng.y,
          lng: latlng.x,
        });
      });
    }
  }, [isRecording, onAddPoint]);

  // 3. Update active path (markers and polyline)
  useEffect(() => {
    const map = mapRef.current;
    const naver = (window as any).naver;
    if (!map || !naver) return;

    // Clean up active markers
    activeMarkersRef.current.forEach((marker) => marker.setMap(null));
    activeMarkersRef.current = [];

    // Clean up active polyline
    if (activePolylineRef.current) {
      activePolylineRef.current.setMap(null);
      activePolylineRef.current = null;
    }

    if (points.length === 0) return;

    // Add path points markers
    points.forEach((pt, idx) => {
      const isLast = idx === points.length - 1;
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pt.lat, pt.lng),
        map: map,
        icon: {
          content: `<div class="custom-point-marker ${isLast ? "last" : ""}"></div>`,
          anchor: new naver.maps.Point(6, 6),
        },
      });
      activeMarkersRef.current.push(marker);
    });

    // Add polyline
    const path = points.map((pt) => new naver.maps.LatLng(pt.lat, pt.lng));
    const polyline = new naver.maps.Polyline({
      map: map,
      path: path,
      strokeColor: "hsl(200, 100%, 50%)",
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: "solid",
    });
    activePolylineRef.current = polyline;
  }, [points]);

  // 4. Update selected route (markers and polyline)
  useEffect(() => {
    const map = mapRef.current;
    const naver = (window as any).naver;
    if (!map || !naver) return;

    // Clean up selected overlays
    selectedMarkersRef.current.forEach((marker) => marker.setMap(null));
    selectedMarkersRef.current = [];

    if (selectedPolylineRef.current) {
      selectedPolylineRef.current.setMap(null);
      selectedPolylineRef.current = null;
    }

    if (!selectedRoute || selectedRoute.points.length === 0) return;

    const routePoints = selectedRoute.points;

    // Start/End points markers
    const startPt = routePoints[0];
    const endPt = routePoints[routePoints.length - 1];

    const startMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(startPt.lat, startPt.lng),
      map: map,
      icon: {
        content: '<div style="width: 14px; height: 14px; background: hsl(142, 76%, 36%); border: 2px solid #fff; border-radius: 50%;"></div>',
        anchor: new naver.maps.Point(7, 7),
      },
    });

    const endMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(endPt.lat, endPt.lng),
      map: map,
      icon: {
        content: '<div style="width: 14px; height: 14px; background: hsl(346, 84%, 61%); border: 2px solid #fff; border-radius: 50%;"></div>',
        anchor: new naver.maps.Point(7, 7),
      },
    });

    selectedMarkersRef.current.push(startMarker, endMarker);

    // Selected polyline
    const path = routePoints.map((pt) => new naver.maps.LatLng(pt.lat, pt.lng));
    const polyline = new naver.maps.Polyline({
      map: map,
      path: path,
      strokeColor: "hsl(142, 76%, 36%)",
      strokeWeight: 5,
      strokeOpacity: 0.9,
    });
    selectedPolylineRef.current = polyline;

    // Fit map bounds to show the entire saved route
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(routePoints[0].lat, routePoints[0].lng),
      new naver.maps.LatLng(routePoints[0].lat, routePoints[0].lng)
    );
    routePoints.forEach((pt) => {
      bounds.extend(new naver.maps.LatLng(pt.lat, pt.lng));
    });
    map.fitBounds(bounds);
  }, [selectedRoute]);

  // 5. Update Current Location Marker
  useEffect(() => {
    const map = mapRef.current;
    const naver = (window as any).naver;
    if (!map || !naver) return;

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
      currentLocationMarkerRef.current = null;
    }

    if (!currentLocation) return;

    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(currentLocation.lat, currentLocation.lng),
      map: map,
      icon: {
        content: '<div class="pulse-marker"></div>',
        anchor: new naver.maps.Point(8, 8),
      },
      zIndex: 999,
    });
    currentLocationMarkerRef.current = marker;
  }, [currentLocation]);

  // 6. Handle programmatically centering map
  useEffect(() => {
    const map = mapRef.current;
    const naver = (window as any).naver;
    if (!map || !naver || !centerLocation) return;

    const center = new naver.maps.LatLng(centerLocation.lat, centerLocation.lng);
    map.panTo(center);
    onCenterCleared();
  }, [centerLocation, onCenterCleared]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />;
}
