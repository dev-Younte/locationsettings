"use client";

import { useState } from "react";
import { Route } from "@/types";
import { FolderHeart, X, Edit2, Trash2, Check, MapPin, Calendar, CheckSquare, Square } from "lucide-react";
import styles from "./RouteList.module.css";

interface RouteListProps {
  routes: Route[];
  selectedRoutes: Route[];
  onToggleSelectRoute: (route: Route) => void;
  onUpdateRouteColor: (id: string, color: string) => void;
  onDeleteRoute: (id: string) => void;
  onRenameRoute: (id: string, newName: string) => void;
}

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#FACC15", "#84CC16", "#10B981", "#059669",
  "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#D946EF", "#EC4899", "#F43F5E", "#64748B", "#94A3B8", "#78350F", "#4D7C0F"
];

export default function RouteList({
  routes,
  selectedRoutes,
  onToggleSelectRoute,
  onUpdateRouteColor,
  onDeleteRoute,
  onRenameRoute,
}: RouteListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [activePickerId, setActivePickerId] = useState<string | null>(null);

  const handleStartRename = (e: React.MouseEvent, route: Route) => {
    e.stopPropagation();
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
    onToggleSelectRoute(route);
  };

  const handleToggleColorPicker = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActivePickerId((prev) => (prev === id ? null : id));
  };

  const handleSelectColor = (e: React.MouseEvent, id: string, color: string) => {
    e.stopPropagation();
    onUpdateRouteColor(id, color);
    setActivePickerId(null);
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
              const isSelected = selectedRoutes.some((r) => r.id === route.id);
              const isEditing = editingId === route.id;
              const routeColor = route.color || "#3B82F6";
              const isPickerOpen = activePickerId === route.id;

              return (
                <div
                  key={route.id}
                  onClick={() => handleItemClick(route)}
                  className={`${styles.routeItem} ${isSelected ? styles.selected : ""}`}
                >
                  <div className={styles.itemHeader}>
                    {/* Checkbox Indicator */}
                    <div className={`${styles.checkContainer} ${isSelected ? styles.checked : ""}`}>
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>

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
                      {/* Color Picker Dropdown */}
                      <div className={styles.colorPickerContainer}>
                        <div
                          className={styles.colorIndicator}
                          style={{ backgroundColor: routeColor }}
                          onClick={(e) => handleToggleColorPicker(e, route.id)}
                          title="경로 색상 변경"
                        />
                        {isPickerOpen && (
                          <div className={`${styles.colorDropdown} glass-panel`}>
                            {PRESET_COLORS.map((c) => (
                              <div
                                key={c}
                                className={`${styles.colorOption} ${
                                  routeColor === c ? styles.activeOption : ""
                                }`}
                                style={{ backgroundColor: c }}
                                onClick={(e) => handleSelectColor(e, route.id, c)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

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
