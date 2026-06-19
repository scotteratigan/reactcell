import React, { Component } from "react";
import Card from "./Card";

// const cardWidth = 100;
// const cardHeight = Math.round(1.4 * cardWidth);
// todo: convert to stateless function?
export default class Cascade extends Component {
  handleSelectEmpty = () => {
    if (!this.props.cards.length) {
      // only activate click function if we have no cards in the column
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

  cardColor = (card) => (card.suit === "♦" || card.suit === "♥" ? "red" : "black");

  // Index of the highest card that still heads a legal tableau sequence running
  // to the bottom of the column. Every card at or below this index can be
  // picked up (alone or as the top of a multi-card move), so all are
  // interactive keyboard stops.
  firstSelectableIndex = (cards) => {
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
    const cardVisibleRatio = 0.33;
    const verticalMargin =
      -this.props.cardHeight + Math.round(cardVisibleRatio * this.props.cardHeight);
    const isEmpty = !this.props.cards.length;
    const firstSelectable = this.props.cards.length
      ? this.firstSelectableIndex(this.props.cards)
      : 0;
    const column = Number(String(this.props.location).replace(/\D/g, "")) + 1;
    // An empty column is only an operable target while a move is in progress;
    // otherwise it is announced as non-interactive board state.
    const moveInProgress = Boolean(this.props.selectedCardName);
    const emptyProps = !isEmpty
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
        style={{
          paddingTop: -verticalMargin,
          // paddingLeft: Math.round(this.props.cardMargins / 2),
          // paddingRight: Math.round(this.props.cardMargins / 2),
          paddingLeft: this.props.cardMargins / 2, // todo: vary this with screen height
          paddingRight: this.props.cardMargins / 2,
          border: "1px solid grey",
          width: this.props.cardWidth,
          minHeight: this.props.cardHeight,
          // height: this.props.height,
          // margin: 10
        }}
        onClick={this.handleSelectEmpty}
      >
        {this.props.cards && this.props.cards.length
          ? this.props.cards.map((card, i) => {
              return (
                <Card
                  rank={card.rank}
                  suit={card.suit}
                  height={this.props.cardHeight}
                  width={this.props.cardWidth}
                  verticalMargin={verticalMargin}
                  selectCardFn={this.props.selectCardFn}
                  selected={card.selected}
                  key={card.rank + card.suit}
                  location={this.props.location}
                  index={i}
                  objKey={card.rank + card.suit}
                  maxIndex={this.props.cards.length - 1}
                  dispIndex={i}
                  interactive={i >= firstSelectable}
                />
              );
            })
          : null}
      </div>
    );
  }
}
