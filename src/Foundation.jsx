import React, { Component } from "react";
import Card from "./Card";

export default class Foundation extends Component {
  // todo: convert to functional component?
  state = {};

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
          if (!this.props.cards.length) {
            // only activate click function if we have no cards in foundation
            // otherwise, the click would be on the top most card.
            this.props.selectCardFn({ location: this.props.location });
          }
        }}
      >
        {this.props.cards && this.props.cards.length ? (
          <Card
            suit={this.props.cards[0].suit}
            rank={this.props.cards[0].rank}
            height={this.props.height}
            width={this.props.width}
            onClick={this.props.selectCardFn}
          />
        ) : null}
      </div>
    );
  }
}
