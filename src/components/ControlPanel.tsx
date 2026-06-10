"use client";

import { Play, Square, Navigation, MapPin, Undo2, Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "./ControlPanel.module.css";

interface ControlPanelProps {
  isRecording: boolean;
  onToggleRecord: () => void;
  onAddCurrentLocation: () => void;
  onUndoPoint: () => void;
  onReset: () => void;
  onSave: () => void;
  onMoveToCurrent: () => void;
  canUndo: boolean;
  canSave: boolean;
  canReset: boolean;
  canAddCurrent: boolean;
  alertMessage: { text: string; type: "success" | "error" } | null;
}

export default function ControlPanel({
  isRecording,
  onToggleRecord,
  onAddCurrentLocation,
  onUndoPoint,
  onReset,
  onSave,
  onMoveToCurrent,
  canUndo,
  canSave,
  canReset,
  canAddCurrent,
  alertMessage,
}: ControlPanelProps) {
  return (
    <div className={styles.panelContainer}>
      {/* Alert toast notification */}
      {alertMessage && (
        <div
          className={`${styles.floatingAlert} ${
            alertMessage.type === "success" ? styles.alertSuccess : styles.alertError
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Main control panel */}
      <div className={`${styles.controlPanel} glass-panel`}>
        <div className={styles.mainRow}>
          <button
            onClick={onToggleRecord}
            className={`${styles.recordBtn} ${
              isRecording ? styles.recording : styles.notRecording
            } btn-interactive`}
          >
            {isRecording ? (
              <>
                <Square size={18} fill="currentColor" />
                기록 종료
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                경로 기록 시작
              </>
            )}
          </button>

          <button
            onClick={onMoveToCurrent}
            className={`${styles.actionBtn} ${styles.locationBtn} btn-interactive`}
            title="현재 위치로 이동"
          >
            <Navigation size={20} fill="currentColor" />
          </button>
        </div>

        <div className={styles.subGrid}>
          <button
            onClick={onAddCurrentLocation}
            disabled={!canAddCurrent}
            className={`${styles.actionBtn} ${styles.utilityBtn} btn-interactive`}
          >
            <MapPin size={18} className={canAddCurrent ? styles.accentText : ""} />
            GPS 점 추가
          </button>

          <button
            onClick={onUndoPoint}
            disabled={!canUndo}
            className={`${styles.actionBtn} ${styles.utilityBtn} btn-interactive`}
          >
            <Undo2 size={18} />
            이전 점 취소
          </button>

          <button
            onClick={onSave}
            disabled={!canSave}
            className={`${styles.actionBtn} ${styles.utilityBtn} btn-interactive`}
          >
            <Save size={18} />
            경로 저장
          </button>

          <button
            onClick={onReset}
            disabled={!canReset}
            className={`${styles.actionBtn} ${styles.utilityBtn} btn-interactive`}
          >
            <RotateCcw size={18} className={canReset ? styles.dangerText : ""} />
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
