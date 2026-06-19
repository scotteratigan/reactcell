import React, { Component } from "react";
import Card from "./Card";
import type { Card as CardType, CardColor, Suit } from "./types";
import styles from "./Cascade.module.css";

export interface CascadeProps {
  cards: CardType[];
  location: string;
  selectCardFn: (objKey: string) => void;
  selectEmptySquareFn: (location: string) => void;
  selectedCardName?: string | null;
  dealing?: boolean;
}

export default class Cascade extends Component<CascadeProps> {
  handleSelectEmpty = () => {
    if (!this.props.cards.length) {
      // only activate click function if we have no cards in the column
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

  cardColor = (card: { suit: Suit }): CardColor =>
    card.suit === "♦" || card.suit === "♥" ? "red" : "black";

  // Index of the highest card that still heads a legal tableau sequence running
  // to the bottom of the column. Every card at or below this index can be
  // picked up (alone or as the top of a multi-card move), so all are
  // interactive keyboard stops.
  firstSelectableIndex = (cards: CardType[]) => {
    let firstSelectable = cards.length - 1;
    for (let i = cards.length - 2; i >= 0; i--) {
      const upper = cards[i];
      const lower = cards[i + 1];
      if (lower.rank === upper.rank - 1 && this.cardColor(upper) !== this.cardColor(lower)) {
        firstSelectable = i;
      } else {
        break;
      }
    }
    return firstSelectable;
  };

  render() {
    const isEmpty = !this.props.cards.length;
    const firstSelectable = this.props.cards.length
      ? this.firstSelectableIndex(this.props.cards)
      : 0;
    const column = Number(String(this.props.location).replace(/\D/g, "")) + 1;
    // An empty column is only an operable target while a move is in progress;
    // otherwise it is announced as non-interactive board state.
    const moveInProgress = Boolean(this.props.selectedCardName);
    const emptyProps: React.HTMLAttributes<HTMLDivElement> = !isEmpty
      ? {}
      : moveInProgress
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `Move ${this.props.selectedCardName} to tableau column ${column}`,
            onKeyDown: this.handleKeyDown,
          }
        : {
            role: "img",
            "aria-label": `Tableau column ${column}, empty`,
          };
    return (
      <div
        {...emptyProps}
        className={isEmpty ? `${styles.cascade} ${styles.empty}` : styles.cascade}
        onClick={this.handleSelectEmpty}
      >
        {this.props.cards && this.props.cards.length
          ? this.props.cards.map((card, i) => {
              return (
                <Card
                  rank={card.rank}
                  suit={card.suit}
                  fanned={i > 0}
                  selectCardFn={this.props.selectCardFn}
                  selected={card.selected}
                  key={card.rank + card.suit}
                  objKey={card.rank + card.suit}
                  dispIndex={i}
                  interactive={i >= firstSelectable}
                  dealing={this.props.dealing}
                  dealIndex={(card.position ?? i) * 8 + (card.column ?? 0)}
                />
              );
            })
          : null}
      </div>
    );
  }
}
