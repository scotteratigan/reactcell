import React, { Component } from "react";
import Card from "./Card";

export default class FreeCell extends Component<any, any> {
  // todo: convert to functional component?

  handleSelectEmpty = () => {
    if (this.props.card === null) {
      // only activate click function if we have no cards in the cell
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
    const isEmpty = this.props.card === null;
    const column = Number(String(this.props.location).replace(/\D/g, "")) + 1;
    // An empty cell is only an operable target while a move is in progress;
    // otherwise it is announced as non-interactive board state.
    const moveInProgress = Boolean(this.props.selectedCardName);
    const emptyProps = !isEmpty
      ? {}
      : moveInProgress
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `Move ${this.props.selectedCardName} to free cell ${column}`,
            onKeyDown: this.handleKeyDown,
          }
        : {
            role: "img",
            "aria-label": `Free cell ${column}, empty`,
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
        {this.props.card !== null ? (
          <Card
            suit={this.props.card.suit}
            rank={this.props.card.rank}
            height={this.props.height}
            width={this.props.width}
            selected={this.props.card.selected}
            selectCardFn={this.props.selectCardFn}
            objKey={this.props.card.rank + this.props.card.suit}
          />
        ) : null}
      </div>
    );
  }
}
