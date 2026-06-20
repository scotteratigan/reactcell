import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { buildBoard, getCascadeRun, type CardMap } from "./gameEngine";
import type { GameAction } from "./gameReducer";

// How far (in px) the pointer must travel before a press becomes a drag rather
// than a click. Keeps taps/clicks feeling responsive while avoiding accidental
// drags.
const DRAG_THRESHOLD = 6;

export interface DragState {
  // The card grabbed plus any cards riding along beneath it (a tableau run).
  keys: string[];
  // Current pointer position (viewport coords) for the floating preview.
  x: number;
  y: number;
  // Pointer offset within the grabbed card so the preview tracks the grab point.
  offsetX: number;
  offsetY: number;
}

interface PendingDrag {
  pointerId: number;
  objKey: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  // The card's own location string (e.g. "cascade3"), so a drop back onto its
  // own pile can be treated as a no-op cancel.
  sourceLocation: string;
}

const locationOf = (cards: CardMap, key: string): string => {
  const card = cards[key];
  return `${card.location}${card.column ?? ""}`;
};

const dropLocationAt = (x: number, y: number): string | null => {
  const el = document.elementFromPoint(x, y);
  const zone = el?.closest<HTMLElement>("[data-drop-location]");
  return zone?.dataset.dropLocation ?? null;
};

export function useCardDrag(cards: CardMap, dispatch: (action: GameAction) => void) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverLocation, setHoverLocation] = useState<string | null>(null);
  // True for the brief window between finishing a drag and the synthetic click
  // that follows pointerup, so the click can be swallowed instead of selecting.
  const justDraggedRef = useRef(false);
  const pendingRef = useRef<PendingDrag | null>(null);
  const draggingRef = useRef(false);

  // Latest cards map, read inside the window listeners without re-subscribing.
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const endDrag = useCallback(() => {
    pendingRef.current = null;
    draggingRef.current = false;
    setDragState(null);
    setHoverLocation(null);
  }, []);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;

      if (!draggingRef.current) {
        const moved = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (moved < DRAG_THRESHOLD) return;
        const current = cardsRef.current;
        const run = getCascadeRun(current, buildBoard(current), pending.objKey);
        draggingRef.current = true;
        setDragState({
          keys: run,
          x: event.clientX,
          y: event.clientY,
          offsetX: pending.offsetX,
          offsetY: pending.offsetY,
        });
      } else {
        setDragState((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
      }
      setHoverLocation(dropLocationAt(event.clientX, event.clientY));
      event.preventDefault();
    };

    const handleUp = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;

      if (draggingRef.current) {
        const target = dropLocationAt(event.clientX, event.clientY);
        if (target && target !== pending.sourceLocation) {
          dispatch({ type: "DROP", fromKey: pending.objKey, location: target });
        }
        // Swallow the click that fires right after this pointerup so it does not
        // also trigger selection. Cleared by the board's click-capture handler,
        // with a fallback for environments that emit no click (e.g. touch).
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 0);
      }
      endDrag();
    };

    const handleCancel = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      endDrag();
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
    };
  }, [dispatch, endDrag]);

  const onPointerDownCard = useCallback((objKey: string, event: ReactPointerEvent<HTMLElement>) => {
    // Only start tracking on the primary (left) mouse button, touch, or pen.
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pendingRef.current = {
      pointerId: event.pointerId,
      objKey,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      sourceLocation: locationOf(cardsRef.current, objKey),
    };
    draggingRef.current = false;
  }, []);

  return { dragState, hoverLocation, justDraggedRef, onPointerDownCard };
}
