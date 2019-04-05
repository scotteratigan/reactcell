// card ratio 2.5 x 3.5
import React, { Component } from "react";

export default class Card extends Component {
  state = {
    // selected:
    //   this.props.cardSelected.rank === this.props.rank &&
    //   this.props.cardSelected.value === this.props.value
    //     ? true
    //     : false
  };

  selectCard = () => {
    this.props.selectCardFn({ suit: this.props.suit, rank: this.props.rank });
    // this.setState({ selected: true });
  };

  getDisplayValue = value => {
    if (value > 1 && value < 11) {
      return value.toString();
    }
    switch (value) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
      default:
        return "K";
    }
  };

  render() {
    return (
      <div
        onClick={this.selectCard}
        style={{
          boxSizing: "border-box",
          border: this.state.selected ? "2px solid red" : "1px solid grey",
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
