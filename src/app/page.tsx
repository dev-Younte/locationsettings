"use client";

import { useEffect, useState, useCallback } from "react";
import UnifiedMap from "@/components/UnifiedMap";
import ControlPanel from "@/components/ControlPanel";
import RouteList from "@/components/RouteList";
import { Point, Route } from "@/types";
import { routeStorage } from "@/lib/storage";

export default function Home() {
  // Map and Route states
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
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

    // Grab initial location on load quietly
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(pt);
      },
      (err) => console.log("Quiet geolocation fetch failed", err),
      { enableHighAccuracy: true }
    );

    // Watch position to update the pulse marker
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

  // 3. Command: Move Map to Current GPS
  const handleMoveToCurrent = useCallback(() => {
    if (!navigator.geolocation) {
      showAlert("이 기기는 위치 정보를 지원하지 않습니다.", "error");
      return;
    }

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
  }, []);

  // 4. Command: Start / Stop Recording
  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      showAlert("경로 기록을 정지했습니다.");
    } else {
      // Start recording
      setIsRecording(true);
      setPoints([]);
      setSelectedRoute(null); // Clear selected history view
      showAlert("경로 기록을 시작합니다. 지도를 터치하여 그리세요.");
    }
  }, [isRecording]);

  // 5. Command: Manual Point Add (via Map Tap)
  const handleAddPoint = useCallback((pt: Point) => {
    setPoints((prev) => [...prev, pt]);
  }, []);

  // 6. Command: Add GPS point to path
  const handleAddCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showAlert("이 기기는 위치 정보를 지원하지 않습니다.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(pt);
        setPoints((prev) => [...prev, pt]);
        setCenterLocation(pt); // Center map on newly added point
        showAlert("현재 위치에 점이 추가되었습니다.");
      },
      (err) => {
        showAlert("GPS 좌표를 취득하는 데 실패했습니다.", "error");
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

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
      // User cancelled
      return;
    }

    const routeName = inputName.trim() || defaultName;
    const newRoute: Route = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: routeName,
      createdAt: new Date().toISOString(),
      points: points,
    };

    try {
      await routeStorage.saveRoute(newRoute);
      showAlert("성공적으로 경로를 저장했습니다!", "success");
      setPoints([]);
      setIsRecording(false);
      setSelectedRoute(newRoute); // Auto select saved route to display
      loadRoutes();
    } catch (err) {
      showAlert("경로를 저장하는 데 실패했습니다.", "error");
      console.error(err);
    }
  }, [points, loadRoutes]);

  // 10. Command: Select history route
  const handleSelectRoute = useCallback((route: Route | null) => {
    setSelectedRoute(route);
    if (route) {
      showAlert(`'${route.name}' 경로가 표시됩니다.`);
    }
  }, []);

  // 11. Command: Delete history route
  const handleDeleteRoute = useCallback(
    async (id: string) => {
      try {
        await routeStorage.deleteRoute(id);
        if (selectedRoute?.id === id) {
          setSelectedRoute(null);
        }
        showAlert("경로를 삭제했습니다.");
        loadRoutes();
      } catch (err) {
        showAlert("경로 삭제에 실패했습니다.", "error");
        console.error(err);
      }
    },
    [selectedRoute, loadRoutes]
  );

  // 12. Command: Rename history route
  const handleRenameRoute = useCallback(
    async (id: string, newName: string) => {
      try {
        await routeStorage.updateRouteName(id, newName);
        if (selectedRoute?.id === id) {
          setSelectedRoute((prev) => (prev ? { ...prev, name: newName } : null));
        }
        showAlert("경로 이름을 수정했습니다.");
        loadRoutes();
      } catch (err) {
        showAlert("이름 수정에 실패했습니다.", "error");
        console.error(err);
      }
    },
    [selectedRoute, loadRoutes]
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
        selectedRoute={selectedRoute}
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
        selectedRoute={selectedRoute}
        onSelectRoute={handleSelectRoute}
        onDeleteRoute={handleDeleteRoute}
        onRenameRoute={handleRenameRoute}
      />
    </main>
  );
}
