import React, { Component } from "react";
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

export default class Foundation extends Component<FoundationProps> {
  handleSelectEmpty = () => {
    if (!this.props.cards.length) {
      // only activate click function if we have no cards in foundation
      // otherwise, the click would be on the top most card.
      this.props.selectEmptySquareFn(this.props.location);
    }
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      this.handleSelectEmpty();
    }
  };

  render() {
    const isEmpty = !this.props.cards.length;
    const column = Number(String(this.props.location).replace(/\D/g, "")) + 1;
    // An empty foundation is only an operable target while a move is in progress;
    // otherwise it is announced as non-interactive board state.
    const moveInProgress = Boolean(this.props.selectedCardName);
    const emptyProps: React.HTMLAttributes<HTMLDivElement> = !isEmpty
      ? {}
      : moveInProgress
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `Move ${this.props.selectedCardName} to foundation ${column}`,
            onKeyDown: this.handleKeyDown,
          }
        : {
            role: "img",
            "aria-label": `Foundation ${column}, empty`,
          };
    const topCard = this.props.cards[this.props.cards.length - 1];
    return (
      <div {...emptyProps} className={styles.slot} onClick={this.handleSelectEmpty}>
        {topCard ? (
          <Card
            suit={topCard.suit}
            rank={topCard.rank}
            selected={topCard.selected}
            selectCardFn={this.props.selectCardFn}
            key={topCard.rank + topCard.suit}
            objKey={topCard.rank + topCard.suit}
          />
        ) : null}
      </div>
    );
  }
}
