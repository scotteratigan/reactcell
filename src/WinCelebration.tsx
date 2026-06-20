import { useCallback, useEffect, useRef } from "react";
import styles from "./WinCelebration.module.css";

export interface WinCelebrationProps {
  gameNumber: number;
  onPlayAgain: () => void;
  onDismiss: () => void;
}

// Festive palette, biased toward the classic card-table reds, golds and greens.
const CONFETTI_COLORS = [
  "#ffd700",
  "#ff4d4d",
  "#4dd2ff",
  "#7cff6b",
  "#ff7bd5",
  "#ffffff",
  "#ffae3b",
];

interface Confetto {
  x: number;
  y: number;
  size: number;
  tilt: number;
  tiltSpeed: number;
  vx: number;
  vy: number;
  color: string;
  spin: number;
  spinSpeed: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The four aces make a tidy, recognizable victory fan.
const VICTORY_CARDS = [
  { rank: "A", suit: "♠", color: "black" },
  { rank: "A", suit: "♥", color: "red" },
  { rank: "A", suit: "♣", color: "black" },
  { rank: "A", suit: "♦", color: "red" },
] as const;

export default function WinCelebration(props: WinCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playAgainRef = useRef<HTMLButtonElement | null>(null);

  // Confetti animation: a self-contained canvas loop, no dependencies. Skipped
  // entirely when the user prefers reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const confetti: Confetto[] = [];
    let frame = 0;
    let rafId = 0;
    const startTime = performance.now();
    // Keep emitting fresh confetti for the first few seconds, then let the
    // stragglers fall out of frame.
    const EMIT_DURATION_MS = 4500;

    const spawn = (count: number) => {
      for (let i = 0; i < count; i++) {
        confetti.push({
          x: Math.random() * width,
          y: -20 - Math.random() * height * 0.3,
          size: 6 + Math.random() * 8,
          tilt: Math.random() * Math.PI,
          tiltSpeed: 0.05 + Math.random() * 0.08,
          vx: -1.5 + Math.random() * 3,
          vy: 2 + Math.random() * 3.5,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          spin: Math.random() * Math.PI,
          spinSpeed: -0.2 + Math.random() * 0.4,
        });
      }
    };

    // An initial burst so the screen fills immediately on the win.
    spawn(160);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      frame++;
      const elapsed = performance.now() - startTime;
      if (elapsed < EMIT_DURATION_MS && frame % 4 === 0) spawn(6);

      ctx.clearRect(0, 0, width, height);
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx + Math.sin(c.tilt) * 0.8;
        c.y += c.vy;
        c.tilt += c.tiltSpeed;
        c.spin += c.spinSpeed;

        if (c.y > height + 30) {
          confetti.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.spin);
        ctx.fillStyle = c.color;
        // A subtle vertical squash sells the tumbling-paper feel.
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      }

      if (confetti.length > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Send focus to the primary action so keyboard users land on the celebration.
  useEffect(() => {
    playAgainRef.current?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") props.onDismiss();
    },
    [props],
  );

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-title"
      onKeyDown={onKeyDown}
    >
      <canvas ref={canvasRef} className={styles.confetti} aria-hidden="true" />

      <button
        type="button"
        className={styles.dismiss}
        onClick={props.onDismiss}
        aria-label="Dismiss celebration"
      >
        ×
      </button>

      <div className={styles.panel}>
        <div className={styles.cardFan} aria-hidden="true">
          {VICTORY_CARDS.map((card, i) => (
            <div
              key={card.suit}
              className={styles.victoryCard}
              data-color={card.color}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className={styles.victoryRank}>{card.rank}</span>
              <span className={styles.victorySuit}>{card.suit}</span>
            </div>
          ))}
        </div>

        <h2 id="win-title" className={styles.title}>
          {"YOU WIN!".split("").map((ch, i) => (
            <span key={i} className={styles.letter} style={{ "--i": i } as React.CSSProperties}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </h2>

        <p className={styles.subtitle}>
          You cleared game <strong>#{props.gameNumber}</strong>. Nicely played!
        </p>

        <div className={styles.actions}>
          <button
            ref={playAgainRef}
            type="button"
            className={styles.playAgain}
            onClick={props.onPlayAgain}
          >
            Play again
          </button>
          <button type="button" className={styles.keepLooking} onClick={props.onDismiss}>
            Admire the board
          </button>
        </div>
      </div>
    </div>
  );
}
