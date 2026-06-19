// card ratio 2.5 x 3.5
import React, { Component } from "react";
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
}

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

export default class Card extends Component<CardProps> {
  selectCard = () => {
    this.props.selectCardFn(this.props.objKey);
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      this.selectCard();
    }
  };

  getDisplayValue = (value: number) => {
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

  getCardName = () => `${RANK_NAMES[this.props.rank]} of ${SUIT_NAMES[this.props.suit]}`;

  render() {
    // The top card of a cascade (and any free cell / foundation card) is the
    // only one a player can act on, so only those are real keyboard stops.
    const interactive = this.props.interactive !== false;
    const cardName = this.getCardName();
    // Selection state is conveyed via aria-pressed, so it is intentionally not
    // duplicated in the accessible name (which would double-announce it).
    const ariaLabel = interactive ? cardName : `${cardName}, covered`;
    const color = this.props.suit === "♥" || this.props.suit === "♦" ? "red" : "black";
    const value = this.getDisplayValue(this.props.rank);
    const className = this.props.fanned ? `${styles.card} ${styles.fanned}` : styles.card;

    return (
      <div
        id={`card-${this.props.objKey}`}
        className={className}
        onClick={this.selectCard}
        onKeyDown={interactive ? this.handleKeyDown : undefined}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : -1}
        aria-label={ariaLabel}
        aria-pressed={interactive ? Boolean(this.props.selected) : undefined}
        data-color={color}
        data-selected={interactive ? Boolean(this.props.selected) : undefined}
        style={{ zIndex: this.props.dispIndex || 0 }}
      >
        <div className={styles.corner} aria-hidden="true">
          <span className={styles.rank}>{value}</span>
          <span className={styles.suit}>{this.props.suit}</span>
        </div>
        <div className={styles.pip} aria-hidden="true">
          {this.props.suit}
        </div>
        <div className={`${styles.corner} ${styles.cornerBottom}`} aria-hidden="true">
          <span className={styles.rank}>{value}</span>
          <span className={styles.suit}>{this.props.suit}</span>
        </div>
      </div>
    );
  }
}
