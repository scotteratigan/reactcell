// card ratio 2.5 x 3.5
import type { CSSProperties, KeyboardEvent } from "react";
import type { Suit } from "./types";
import styles from "./Card.module.css";

export interface CardProps {
  rank: number;
  suit: Suit;
  selectCardFn: (objKey: string) => void;
  objKey: string;
  selected?: boolean;
  interactive?: boolean;
  fanned?: boolean;
  dispIndex?: number;
  dealing?: boolean;
  dealIndex?: number;
}

// Per-card stagger between dealt cards. Keep total (51 * step + animation
// duration) around ~2s for a full 52-card deal.
const DEAL_STEP_MS = 32;

const RANK_NAMES = [
  "Ace",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Jack",
  "Queen",
  "King",
];

const SUIT_NAMES: Record<Suit, string> = {
  "♣": "Clubs",
  "♦": "Diamonds",
  "♥": "Hearts",
  "♠": "Spades",
};

const getDisplayValue = (value: number) => {
  const cardValue = value + 1;
  if (cardValue > 1 && cardValue <= 10) {
    return cardValue.toString();
  }
  switch (cardValue) {
    case 1:
      return "A";
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    default:
      return "E";
  }
};

export default function Card(props: CardProps) {
  const selectCard = () => props.selectCardFn(props.objKey);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      selectCard();
    }
  };

  // The top card of a cascade (and any free cell / foundation card) is the only
  // one a player can act on, so only those are real keyboard stops.
  const interactive = props.interactive !== false;
  const cardName = `${RANK_NAMES[props.rank]} of ${SUIT_NAMES[props.suit]}`;
  // Selection state is conveyed via aria-pressed, so it is intentionally not
  // duplicated in the accessible name (which would double-announce it).
  const ariaLabel = interactive ? cardName : `${cardName}, covered`;
  const color = props.suit === "♥" || props.suit === "♦" ? "red" : "black";
  const value = getDisplayValue(props.rank);
  const classNames = [styles.card];
  if (props.fanned) classNames.push(styles.fanned);
  if (props.dealing) classNames.push(styles.dealing);
  const className = classNames.join(" ");
  const style: CSSProperties = { zIndex: props.dispIndex || 0 };
  if (props.dealing) {
    style.animationDelay = `${(props.dealIndex || 0) * DEAL_STEP_MS}ms`;
  }

  return (
    <div
      id={`card-${props.objKey}`}
      className={className}
      onClick={selectCard}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={interactive ? Boolean(props.selected) : undefined}
      data-color={color}
      data-selected={interactive ? Boolean(props.selected) : undefined}
      style={style}
    >
      <div className={styles.corner} aria-hidden="true">
        <span className={styles.rank}>{value}</span>
        <span className={styles.suit}>{props.suit}</span>
      </div>
      <div className={styles.pip} aria-hidden="true">
        {props.suit}
      </div>
      <div className={`${styles.corner} ${styles.cornerBottom}`} aria-hidden="true">
        <span className={styles.rank}>{value}</span>
        <span className={styles.suit}>{props.suit}</span>
      </div>
    </div>
  );
}
