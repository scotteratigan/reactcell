import React from "react";
import Card from "./Card";
import type { Card as CardType } from "./types";
import styles from "./Slot.module.css";

export interface FoundationProps {
  cards: CardType[];
  location: string;
  selectCardFn: (objKey: string) => void;
  selectEmptySquareFn: (location: string) => void;
  selectedCardName?: string | null;
}

export default function Foundation(props: FoundationProps) {
  const handleSelectEmpty = () => {
    if (!props.cards.length) {
      // only activate click function if we have no cards in foundation
      // otherwise, the click would be on the top most card.
      props.selectEmptySquareFn(props.location);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      handleSelectEmpty();
    }
  };

  const isEmpty = !props.cards.length;
  const column = Number(String(props.location).replace(/\D/g, "")) + 1;
  // An empty foundation is only an operable target while a move is in progress;
  // otherwise it is announced as non-interactive board state.
  const moveInProgress = Boolean(props.selectedCardName);
  const emptyProps: React.HTMLAttributes<HTMLDivElement> = !isEmpty
    ? {}
    : moveInProgress
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": `Move ${props.selectedCardName} to foundation ${column}`,
          onKeyDown: handleKeyDown,
        }
      : {
          role: "img",
          "aria-label": `Foundation ${column}, empty`,
        };
  const topCard = props.cards[props.cards.length - 1];
  return (
    <div {...emptyProps} className={styles.slot} onClick={handleSelectEmpty}>
      {topCard ? (
        <Card
          suit={topCard.suit}
          rank={topCard.rank}
          selected={topCard.selected}
          selectCardFn={props.selectCardFn}
          key={topCard.rank + topCard.suit}
          objKey={topCard.rank + topCard.suit}
        />
      ) : null}
    </div>
  );
}
