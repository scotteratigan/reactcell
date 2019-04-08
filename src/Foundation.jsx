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
            this.props.selectEmptySquareFn(this.props.location);
          }
        }}
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
