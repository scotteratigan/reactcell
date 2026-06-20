import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { CardMap } from "./gameEngine";

// FLIP (First-Last-Invert-Play) flight animation for cards that move via
// clicking, double-click-to-foundation, undo, or the endgame auto-complete.
// Drag-and-drop moves are skipped because the floating drag preview already
// conveys the motion.
const FLIP_DURATION_MS = 200;
const FLIP_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
// Above stacked cards (which use small positive z-indexes) but below the win
// overlay (z-index 50) and drag preview (z-index 1000) so a flying card never
// covers them.
const FLIP_Z_INDEX = "40";
// Sub-pixel layout jitter shouldn't trigger a flight.
const MIN_FLIGHT_PX = 1;

interface Point {
  x: number;
  y: number;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// True when the card's place on the board changed between two snapshots.
const didMove = (before: CardMap[string], after: CardMap[string]): boolean =>
  before.location !== after.location ||
  before.column !== after.column ||
  before.position !== after.position;

export interface CardFlip {
  // Call immediately before dispatching a move whose motion should NOT be
  // animated (i.e. a drag drop). Applies to the very next board change only.
  skipNextFlip: () => void;
}

export function useCardFlip(
  boardRef: RefObject<HTMLElement | null>,
  cards: CardMap,
  dealing: boolean,
): CardFlip {
  // Last known resting (untransformed) viewport position of each card, keyed by
  // card key, so we can compute a card's start offset when it next moves.
  const prevRectsRef = useRef<Map<string, Point>>(new Map());
  // The board snapshot from the previous render, used to detect which cards
  // moved this render.
  const prevCardsRef = useRef<CardMap>(cards);
  // Currently-running flight per card, so a card moved again mid-flight can be
  // snapped to rest before we re-measure it.
  const animationsRef = useRef<Map<string, Animation>>(new Map());
  const skipNextRef = useRef(false);

  const skipNextFlip = useCallback(() => {
    skipNextRef.current = true;
  }, []);

  useLayoutEffect(() => {
    const root = boardRef.current;
    if (!root) return;

    const prevCards = prevCardsRef.current;
    const prevRects = prevRectsRef.current;
    const nextRects = new Map(prevRects);

    const nodeByKey = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-card-key]").forEach((node) => {
      const key = node.dataset.cardKey;
      if (key) nodeByKey.set(key, node);
    });

    const rectOf = (node: HTMLElement): Point => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    };

    const movedKeys: string[] = [];
    nodeByKey.forEach((_node, key) => {
      const before = prevCards[key];
      const after = cards[key];
      if (before && after && didMove(before, after)) movedKeys.push(key);
    });

    // When nothing moved (e.g. the deal just finished) we only refresh resting
    // positions so the next real move starts from accurate coordinates. We also
    // refresh-without-animating while dealing, after a drag drop, and when the
    // user prefers reduced motion.
    const animate = !skipNextRef.current && !dealing && !prefersReducedMotion();
    skipNextRef.current = false;

    if (!animate || movedKeys.length === 0) {
      nodeByKey.forEach((node, key) => nextRects.set(key, rectOf(node)));
      prevRectsRef.current = nextRects;
      prevCardsRef.current = cards;
      return;
    }

    for (const key of movedKeys) {
      const node = nodeByKey.get(key)!;
      // Snap any in-flight animation for this card so we measure its true new
      // resting position rather than a mid-flight transformed one.
      animationsRef.current.get(key)?.cancel();

      const to = rectOf(node);
      const from = prevRects.get(key);
      nextRects.set(key, to);
      if (!from) continue;

      const dx = from.x - to.x;
      const dy = from.y - to.y;
      if (Math.hypot(dx, dy) < MIN_FLIGHT_PX) continue;
      if (typeof node.animate !== "function") continue;

      const baseZIndex = node.style.zIndex;
      node.style.zIndex = FLIP_Z_INDEX;
      const animation = node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: FLIP_DURATION_MS, easing: FLIP_EASING },
      );
      animationsRef.current.set(key, animation);
      const cleanup = () => {
        node.style.zIndex = baseZIndex;
        if (animationsRef.current.get(key) === animation) animationsRef.current.delete(key);
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    }

    // Cards revealed this render without moving (e.g. a covered card exposed by
    // undo) get their resting position recorded so a later move animates right.
    nodeByKey.forEach((node, key) => {
      if (!nextRects.has(key)) nextRects.set(key, rectOf(node));
    });

    prevRectsRef.current = nextRects;
    prevCardsRef.current = cards;
  }, [boardRef, cards, dealing]);

  return { skipNextFlip };
}
