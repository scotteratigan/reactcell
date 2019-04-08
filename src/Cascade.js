import React, { Component } from "react";
import Card from "./Card";

// const cardWidth = 100;
// const cardHeight = Math.round(1.4 * cardWidth);
// todo: convert to stateless function?
export default class Cascade extends Component {
  render() {
    const cardVisibleRatio = 0.33;
    const verticalMargin =
      -this.props.cardHeight +
      Math.round(cardVisibleRatio * this.props.cardHeight);
    return (
      <div
        style={{
          paddingTop: -verticalMargin,
          // paddingLeft: Math.round(this.props.cardMargins / 2),
          // paddingRight: Math.round(this.props.cardMargins / 2),
          paddingLeft: this.props.cardMargins / 2, // todo: vary this with screen height
          paddingRight: this.props.cardMargins / 2,
          border: "1px solid grey",
          width: this.props.cardWidth,
          minHeight: this.props.cardHeight
          // height: this.props.height,
          // margin: 10
        }}
        onClick={() => {
          if (!this.props.cards.length) {
            // only activate click function if we have no cards in foundation
            // otherwise, the click would be on the top most card.
            this.props.selectEmptySquareFn(this.props.location);
          }
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
                  objKey={card.rank + card.suit}
                  maxIndex={this.props.cards.length - 1}
                  dispIndex={i}
                />
              );
            })
          : null}
      </div>
    );
  }
}
