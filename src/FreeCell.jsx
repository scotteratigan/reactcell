import React, { Component } from "react";
import Card from "./Card";

export default class FreeCell extends Component {
  // todo: convert to functional component?

  render() {
    return (
      <div
        style={{
          border: "1px solid grey",
          width: this.props.width,
          height: this.props.height,
          backgroundColor: "cream",
          margin: 10
        }}
        onClick={() => {
          if (this.props.card === null) {
            // only activate click function if we have no cards in foundation
            // otherwise, the click would be on the top most card.
            this.props.selectEmptySquareFn(this.props.location);
          }
        }}
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
