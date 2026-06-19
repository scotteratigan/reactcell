import React, { Component } from "react";
import Card from "./Card";

export default class Foundation extends Component {
  state = {};

  handleSelectEmpty = () => {
    if (!this.props.cards.length) {
      // only activate click function if we have no cards in foundation
      // otherwise, the click would be on the top most card.
      this.props.selectEmptySquareFn(this.props.location);
    }
  };

  handleKeyDown = (event) => {
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
    const emptyProps = !isEmpty
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
    return (
      <div
        {...emptyProps}
        style={{
          border: "1px solid grey",
          width: this.props.width,
          height: this.props.height,
          backgroundColor: "#fffdd0",
          margin: this.props.cardMargins / 2,
        }}
        onClick={this.handleSelectEmpty}
      >
        {this.props.cards && this.props.cards.length ? (
          <Card
            suit={this.props.cards[this.props.cards.length - 1].suit}
            rank={this.props.cards[this.props.cards.length - 1].rank}
            height={this.props.height}
            width={this.props.width}
            selected={this.props.cards[this.props.cards.length - 1].selected}
            selectCardFn={this.props.selectCardFn}
            // no key needed here since we aren't rendering a list?
            key={
              this.props.cards[this.props.cards.length - 1].rank +
              this.props.cards[this.props.cards.length - 1].suit
            }
            objKey={
              this.props.cards[this.props.cards.length - 1].rank +
              this.props.cards[this.props.cards.length - 1].suit
            }
          />
        ) : null}
      </div>
    );
  }
}
