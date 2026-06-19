import React, { Component } from "react";
// import { BrowserRouter as Router, Route } from "react-router-dom";
// import "./App.css";
import GameArea from "./GameArea";
import Footer from "./Footer";

class App extends Component<any, any> {
  render() {
    return (
      // <Router>
      <>
        <header style={{ marginTop: 20, textAlign: "center" }}>
          <h1>
            <em>React</em>Cell
          </h1>
          <p style={{ fontWeight: "bold", margin: "0.5em 0" }}>A FreeCell clone by Scott Ratigan</p>
        </header>
        {/* <Route exact path="/" component={GameArea} /> */}
        <main aria-label="FreeCell game board">
          <GameArea />
        </main>
        <Footer />
      </>
      // </Router>
    );
  }
}

export default App;
