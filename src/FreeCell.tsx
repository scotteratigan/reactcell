import type { HTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import Card from "./Card";
import type { Card as CardType } from "./types";
import styles from "./Slot.module.css";

export interface FreeCellProps {
  card: CardType | null;
  location: string;
  selectCardFn: (objKey: string) => void;
  selectEmptySquareFn: (location: string) => void;
  selectedCardName?: string | null;
  dealing?: boolean;
  dealIndexByKey?: Record<string, number>;
  onPointerDownCard?: (objKey: string, event: PointerEvent<HTMLElement>) => void;
  onSendToFoundation?: (objKey: string) => void;
  dropHover?: boolean;
}

export default function FreeCell(props: FreeCellProps) {
  const handleSelectEmpty = () => {
    if (props.card === null) {
      // only activate click function if we have no cards in the cell
      // otherwise, the click would be on the top most card.
      props.selectEmptySquareFn(props.location);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      handleSelectEmpty();
    }
  };

  const isEmpty = props.card === null;
  const column = Number(String(props.location).replace(/\D/g, "")) + 1;
  // An empty cell is only an operable target while a move is in progress;
  // otherwise it is announced as non-interactive board state.
  const moveInProgress = Boolean(props.selectedCardName);
  const emptyProps: HTMLAttributes<HTMLDivElement> = !isEmpty
    ? {}
    : moveInProgress
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": `Move ${props.selectedCardName} to free cell ${column}`,
          onKeyDown: handleKeyDown,
        }
      : {
          role: "img",
          "aria-label": `Free cell ${column}, empty`,
        };
  const className = props.dropHover ? `${styles.slot} ${styles.dropHover}` : styles.slot;
  return (
    <div
      {...emptyProps}
      className={className}
      onClick={handleSelectEmpty}
      data-drop-location={props.location}
    >
      {props.card !== null ? (
        <Card
          suit={props.card.suit}
          rank={props.card.rank}
          selected={props.card.selected}
          dragging={props.card.dragging}
          selectCardFn={props.selectCardFn}
          objKey={props.card.rank + props.card.suit}
          dealing={props.dealing}
          dealIndex={props.dealIndexByKey?.[props.card.objKey] ?? 0}
          onPointerDownCard={props.onPointerDownCard}
          onSendToFoundation={props.onSendToFoundation}
        />
      ) : null}
    </div>
  );
}
