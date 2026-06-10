"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Point, Route } from "@/types";

// Disable SSR for map components to avoid window-not-defined errors
const NaverMap = dynamic(() => import("./NaverMap"), { ssr: false });
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export interface MapViewProps {
  isRecording: boolean;
  points: Point[];
  currentLocation: Point | null;
  selectedRoutes: Route[];
  onAddPoint: (pt: Point) => void;
  centerLocation: Point | null;
  onCenterCleared: () => void;
}

export default function UnifiedMap(props: MapViewProps) {
  const [mapType, setMapType] = useState<"naver" | "leaflet" | "checking">("checking");

  useEffect(() => {
    const naverClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    // 1. If Client ID is not provided, fallback to leaflet immediately
    if (!naverClientId) {
      console.log("Ploggo: Naver Client ID missing. Falling back to Leaflet + OSM.");
      setMapType("leaflet");
      return;
    }

    // 2. Poll for window.naver loading state
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds max
    
    const interval = setInterval(() => {
      attempts++;
      const naver = (window as any).naver;
      if (naver && naver.maps) {
        console.log("Ploggo: Naver Maps API loaded successfully.");
        setMapType("naver");
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.log("Ploggo: Naver Maps API script load timed out. Falling back to Leaflet + OSM.");
        setMapType("leaflet");
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (mapType === "checking") {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-secondary)",
        gap: "12px",
        fontFamily: "var(--font-inter)"
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          border: "3px solid var(--border-color)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ fontSize: "14px", fontWeight: 500 }}>지도를 불러오는 중입니다...</p>
        
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return mapType === "naver" ? (
    <NaverMap {...props} />
  ) : (
    <LeafletMap {...props} />
  );
}
