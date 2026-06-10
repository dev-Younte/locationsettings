"use client";

import { useState } from "react";
import { Route } from "@/types";
import { FolderHeart, X, Edit2, Trash2, Check, MapPin, Calendar } from "lucide-react";
import styles from "./RouteList.module.css";

interface RouteListProps {
  routes: Route[];
  selectedRoute: Route | null;
  onSelectRoute: (route: Route | null) => void;
  onDeleteRoute: (id: string) => void;
  onRenameRoute: (id: string, newName: string) => void;
}

export default function RouteList({
  routes,
  selectedRoute,
  onSelectRoute,
  onDeleteRoute,
  onRenameRoute,
}: RouteListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartRename = (e: React.MouseEvent, route: Route) => {
    e.stopPropagation(); // Prevent item selection
    setEditingId(route.id);
    setEditName(route.name);
  };

  const handleSaveRename = (e: React.FormEvent | React.FocusEvent, id: string) => {
    e.preventDefault();
    if (editName.trim()) {
      onRenameRoute(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("정말 이 플로깅 경로를 삭제하시겠습니까?")) {
      onDeleteRoute(id);
    }
  };

  const handleItemClick = (route: Route) => {
    if (selectedRoute?.id === route.id) {
      onSelectRoute(null); // Toggle off
    } else {
      onSelectRoute(route);
      setIsOpen(false); // Close drawer on mobile to view map
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${styles.toggleBtn} glass-panel btn-interactive`}
      >
        <FolderHeart size={16} fill={routes.length > 0 ? "currentColor" : "none"} />
        <span>경로 목록 ({routes.length})</span>
      </button>

      {/* Overlay Backdrop */}
      <div
        className={`${styles.drawerOverlay} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ""} glass-panel`}>
        <div className={styles.header}>
          <h2>저장된 경로</h2>
          <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.listContent}>
          {routes.length === 0 ? (
            <div className={styles.emptyState}>
              <FolderHeart size={40} strokeWidth={1} />
              <p>저장된 플로깅 경로가 없습니다.</p>
              <p style={{ opacity: 0.6 }}>활동을 마치고 경로를 저장해보세요.</p>
            </div>
          ) : (
            routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              const isEditing = editingId === route.id;

              return (
                <div
                  key={route.id}
                  onClick={() => handleItemClick(route)}
                  className={`${styles.routeItem} ${isSelected ? styles.selected : ""}`}
                >
                  <div className={styles.itemHeader}>
                    <div className={styles.nameContainer}>
                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleSaveRename(e, route.id)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={(e) => handleSaveRename(e, route.id)}
                            className={styles.renameInput}
                            autoFocus
                            maxLength={30}
                          />
                        </form>
                      ) : (
                        <span className={styles.routeName}>{route.name}</span>
                      )}
                    </div>

                    <div className={styles.actions}>
                      {isEditing ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveRename(e, route.id);
                          }}
                          className={styles.actionIconBtn}
                        >
                          <Check size={14} className={styles.accentText} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleStartRename(e, route)}
                          className={styles.actionIconBtn}
                          title="이름 수정"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, route.id)}
                        className={`${styles.actionIconBtn} ${styles.deleteHover}`}
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.routeMeta}>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <Calendar size={11} />
                      {formatDate(route.createdAt)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <MapPin size={11} />
                      {route.points.length}개 점
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
