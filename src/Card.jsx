// card ratio 2.5 x 3.5
import React, { Component } from "react";

export default class Card extends Component {
  // todo: convert to stateless function?
  state = {};

  selectCard = () => {
    this.props.selectCardFn(this.props.objKey);
    // this.setState({ selected: true });
  };

  getDisplayValue = value => {
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

  render() {
    return (
      <div
        onClick={this.selectCard}
        style={{
          boxSizing: "border-box",
          border: this.props.selected ? "2px solid red" : "1px solid grey",
          borderRadius: 10,
          height: this.props.height,
          width: this.props.width,
          padding: 5,
          color:
            this.props.suit === "♥" || this.props.suit === "♦"
              ? "red"
              : "black",
          backgroundColor: "white",
          marginTop: this.props.verticalMargin
        }}
      >
        {this.props.suit}
        <br />
        {this.getDisplayValue(this.props.rank)}
      </div>
    );
  }
}
