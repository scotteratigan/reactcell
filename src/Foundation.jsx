import React, { Component } from "react";

export default class Foundation extends Component {
  state = {
    card: {}
  };

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
      />
    );
  }
}
