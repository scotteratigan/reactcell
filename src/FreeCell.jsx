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
        onClick={() =>
          // todo: deactivate if card here, just like in Foundation.jsx
          this.props.selectCardFn({ location: this.props.location })
        }
      >
        {this.props.card !== null ? (
          <Card
            suit={this.props.card.suit}
            rank={this.props.card.rank}
            height={this.props.height}
            width={this.props.width}
            onClick={this.props.selectCardFn}
          />
        ) : null}
      </div>
    );
  }
}
