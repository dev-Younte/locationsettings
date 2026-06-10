"use client";

import { useEffect, useState, useCallback } from "react";
import UnifiedMap from "@/components/UnifiedMap";
import ControlPanel from "@/components/ControlPanel";
import RouteList from "@/components/RouteList";
import { Point, Route } from "@/types";
import { routeStorage } from "@/lib/storage";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#FACC15", "#84CC16", "#10B981", "#059669",
  "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#D946EF", "#EC4899", "#F43F5E", "#64748B", "#94A3B8", "#78350F", "#4D7C0F"
];

export default function Home() {
  // Map and Route states
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<Route[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  // Geolocation states
  const [currentLocation, setCurrentLocation] = useState<Point | null>(null);
  const [centerLocation, setCenterLocation] = useState<Point | null>(null);

  // UI feedback state
  const [alertMessage, setAlertMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // 1. Fetch initial routes
  const loadRoutes = useCallback(async () => {
    try {
      const data = await routeStorage.getRoutes();
      setRoutes(data);
      
      // Update selectedRoutes reference from fresh data to sync name/color changes
      setSelectedRoutes((prevSelected) => {
        return prevSelected
          .map((item) => data.find((r) => r.id === item.id))
          .filter((item): item is Route => !!item);
      });
    } catch (err) {
      console.error("Failed to load routes from storage", err);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Alert handler helper
  const showAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // 2. Track current location (passive background updates if available)
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    // Grab initial location quietly on load
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(pt);
      },
      (err) => console.log("Quiet geolocation fetch failed", err),
      { enableHighAccuracy: true }
    );

    // Watch position to update the pulse marker in real-time
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(pt);
      },
      (err) => console.log("Geolocation watching error", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 3. Command: Move Map to Current GPS (Instant response using cache)
  const handleMoveToCurrent = useCallback(() => {
    // 1. Check if we already have a cached location in memory
    if (currentLocation) {
      setCenterLocation(currentLocation);
      showAlert("현재 위치로 즉시 이동했습니다.");
      
      // Verify/refresh in background quietly
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(pt);
          },
          (err) => console.log("Background refresh failed", err),
          { enableHighAccuracy: true }
        );
      }
      return;
    }

    // 2. Fallback to active query if no cache is present
    if (!navigator.geolocation) {
      showAlert("이 기기는 위치 정보를 지원하지 않습니다.", "error");
      return;
    }

    showAlert("GPS 신호를 잡는 중입니다...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(pt);
        setCenterLocation(pt);
        showAlert("현재 위치로 이동했습니다.");
      },
      (err) => {
        console.error(err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            showAlert("위치 정보 권한이 거부되었습니다.", "error");
            break;
          case err.POSITION_UNAVAILABLE:
            showAlert("위치 정보를 사용할 수 없습니다.", "error");
            break;
          case err.TIMEOUT:
            showAlert("위치 정보 가져오기 시간 초과.", "error");
            break;
          default:
            showAlert("위치 정보를 가져오는 데 실패했습니다.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [currentLocation]);

  // 4. Command: Start / Stop Recording
  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      showAlert("경로 기록을 정지했습니다.");
    } else {
      setIsRecording(true);
      setPoints([]);
      setSelectedRoutes([]); // Clear selected history view
      showAlert("경로 기록을 시작합니다. 지도를 터치하여 그리세요.");
    }
  }, [isRecording]);

  // 5. Command: Manual Point Add (via Map Tap)
  const handleAddPoint = useCallback((pt: Point) => {
    setPoints((prev) => [...prev, pt]);
  }, []);

  // 6. Command: Add GPS point to path (Instant response using cache)
  const handleAddCurrentLocation = useCallback(() => {
    // 1. Check if we have cached position in memory
    if (currentLocation) {
      setPoints((prev) => [...prev, currentLocation]);
      setCenterLocation(currentLocation);
      showAlert("현재 위치에 점이 즉시 추가되었습니다.");

      // Background verify
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(pt);
          },
          (err) => console.log("Background refresh failed", err),
          { enableHighAccuracy: true }
        );
      }
      return;
    }

    // 2. Fallback to active query if no cache is present
    if (!navigator.geolocation) {
      showAlert("이 기기는 위치 정보를 지원하지 않습니다.", "error");
      return;
    }

    showAlert("GPS 신호를 잡는 중입니다...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(pt);
        setPoints((prev) => [...prev, pt]);
        setCenterLocation(pt);
        showAlert("현재 위치에 점이 추가되었습니다.");
      },
      (err) => {
        showAlert("GPS 좌표를 취득하는 데 실패했습니다.", "error");
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [currentLocation]);

  // 7. Command: Undo Last Point
  const handleUndoPoint = useCallback(() => {
    setPoints((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      showAlert("마지막으로 추가한 점을 삭제했습니다.");
      return next;
    });
  }, []);

  // 8. Command: Reset Drawing Path
  const handleReset = useCallback(() => {
    if (confirm("현재 작성 중인 경로를 초기화하시겠습니까?")) {
      setPoints([]);
      setIsRecording(false);
      showAlert("경로가 초기화되었습니다.");
    }
  }, []);

  // 9. Command: Save path to Storage
  const handleSave = useCallback(async () => {
    if (points.length < 2) {
      showAlert("경로를 완성하려면 최소 2개 이상의 점이 필요합니다.", "error");
      return;
    }

    const defaultName = `플로깅 경로 - ${new Date().toLocaleDateString("ko-KR")} ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
    const inputName = prompt("경로의 이름을 입력해 주세요:", defaultName);

    if (inputName === null) {
      return;
    }

    const routeName = inputName.trim() || defaultName;
    const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

    const newRoute: Route = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: routeName,
      createdAt: new Date().toISOString(),
      points: points,
      color: randomColor,
    };

    try {
      await routeStorage.saveRoute(newRoute);
      showAlert("성공적으로 경로를 저장했습니다!", "success");
      setPoints([]);
      setIsRecording(false);
      setSelectedRoutes([newRoute]); // Auto select saved route to display
      loadRoutes();
    } catch (err) {
      showAlert("경로를 저장하는 데 실패했습니다.", "error");
      console.error(err);
    }
  }, [points, loadRoutes]);

  // 10. Command: Toggle history route (Multi-select)
  const handleToggleSelectRoute = useCallback((route: Route) => {
    setSelectedRoutes((prev) => {
      const isSelected = prev.some((r) => r.id === route.id);
      if (isSelected) {
        showAlert(`'${route.name}' 경로 선택을 해제했습니다.`);
        return prev.filter((r) => r.id !== route.id);
      } else {
        showAlert(`'${route.name}' 경로가 표시됩니다.`);
        return [...prev, route];
      }
    });
  }, []);

  // 11. Command: Update Route color chip
  const handleUpdateRouteColor = useCallback(
    async (id: string, color: string) => {
      try {
        await routeStorage.updateRouteColor(id, color);
        await loadRoutes();
      } catch (err) {
        showAlert("색상 수정에 실패했습니다.", "error");
        console.error(err);
      }
    },
    [loadRoutes]
  );

  // 12. Command: Delete history route
  const handleDeleteRoute = useCallback(
    async (id: string) => {
      try {
        await routeStorage.deleteRoute(id);
        setSelectedRoutes((prev) => prev.filter((r) => r.id !== id));
        showAlert("경로를 삭제했습니다.");
        loadRoutes();
      } catch (err) {
        showAlert("경로 삭제에 실패했습니다.", "error");
        console.error(err);
      }
    },
    [loadRoutes]
  );

  // 13. Command: Rename history route
  const handleRenameRoute = useCallback(
    async (id: string, newName: string) => {
      try {
        await routeStorage.updateRouteName(id, newName);
        showAlert("경로 이름을 수정했습니다.");
        await loadRoutes();
      } catch (err) {
        showAlert("이름 수정에 실패했습니다.", "error");
        console.error(err);
      }
    },
    [loadRoutes]
  );

  const handleCenterCleared = useCallback(() => {
    setCenterLocation(null);
  }, []);

  return (
    <main style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Background Map View */}
      <UnifiedMap
        isRecording={isRecording}
        points={points}
        currentLocation={currentLocation}
        selectedRoutes={selectedRoutes}
        onAddPoint={handleAddPoint}
        centerLocation={centerLocation}
        onCenterCleared={handleCenterCleared}
      />

      {/* Floating Bottom Control Panel */}
      <ControlPanel
        isRecording={isRecording}
        onToggleRecord={handleToggleRecord}
        onAddCurrentLocation={handleAddCurrentLocation}
        onUndoPoint={handleUndoPoint}
        onReset={handleReset}
        onSave={handleSave}
        onMoveToCurrent={handleMoveToCurrent}
        canUndo={points.length > 0}
        canSave={points.length >= 2}
        canReset={points.length > 0 || isRecording}
        canAddCurrent={isRecording}
        alertMessage={alertMessage}
      />

      {/* Saved Route Management Drawer */}
      <RouteList
        routes={routes}
        selectedRoutes={selectedRoutes}
        onToggleSelectRoute={handleToggleSelectRoute}
        onUpdateRouteColor={handleUpdateRouteColor}
        onDeleteRoute={handleDeleteRoute}
        onRenameRoute={handleRenameRoute}
      />
    </main>
  );
}
