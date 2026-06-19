// card ratio 2.5 x 3.5
import React, { Component } from "react";
import type { Suit } from "./types";

export interface CardProps {
  rank: number;
  suit: Suit;
  height: number;
  width: number;
  selectCardFn: (objKey: string) => void;
  objKey: string;
  selected?: boolean;
  interactive?: boolean;
  verticalMargin?: number;
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

// Pure red (#ff0000) on white is only 3.99:1, below WCAG AA's 4.5:1.
// #d50000 reaches ~5.5:1 while still reading as a card-suit red.
const RED = "#d50000";

export default class Card extends Component<CardProps> {
  // todo: convert to stateless function?

  selectCard = () => {
    this.props.selectCardFn(this.props.objKey);
    // this.setState({ selected: true });
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

    return (
      <div
        id={`card-${this.props.objKey}`}
        onClick={this.selectCard}
        onKeyDown={interactive ? this.handleKeyDown : undefined}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : -1}
        aria-label={ariaLabel}
        aria-pressed={interactive ? Boolean(this.props.selected) : undefined}
        style={{
          boxSizing: "border-box",
          border: this.props.selected ? `2px solid ${RED}` : "1px solid grey",
          textAlign: "left",
          borderRadius: 10,
          height: this.props.height,
          width: this.props.width,
          padding: 5,
          color: this.props.suit === "♥" || this.props.suit === "♦" ? RED : "black",
          backgroundColor: "white",
          marginTop: this.props.verticalMargin,
          position: "relative", // required for zIndex to function correctly
          zIndex: this.props.dispIndex || 0,
          cursor: "pointer",
        }}
      >
        <div aria-hidden="true">
          {this.props.suit}
          {this.getDisplayValue(this.props.rank)}
        </div>
        <div aria-hidden="true" style={{ marginTop: this.props.height - 55, textAlign: "right" }}>
          {/* todo: replace magic number above with proper relative position */}
          {this.getDisplayValue(this.props.rank)}
          {this.props.suit}
        </div>
      </div>
    );
  }
}
