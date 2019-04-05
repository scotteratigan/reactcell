import React, { Component } from "react";
import Card from "./Card";

// const cardWidth = 100;
// const cardHeight = Math.round(1.4 * cardWidth);
// todo: convert to stateless function?
export default class Cascade extends Component {
  render() {
    const cardVisibleRatio = 0.3;
    const verticalMargin =
      -this.props.cardHeight +
      Math.round(cardVisibleRatio * this.props.cardHeight);
    return (
      <div
        style={{
          paddingTop: -verticalMargin + 25,
          paddingLeft: 12,
          paddingRight: 12
        }}
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
                  maxIndex={this.props.cards.length - 1}
                />
              );
            })
          : null}
      </div>
    );
  }
}
