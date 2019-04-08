import React, { Component } from "react";
// import { BrowserRouter as Router, Route } from "react-router-dom";
// import "./App.css";
import GameArea from "./GameArea";
import Footer from "./Footer";

class App extends Component {
  render() {
    return (
      // <Router>
      <>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <h1>
            <em>React</em>Cell
          </h1>
          <h4>A FreeCell clone by Scott Ratigan</h4>
        </div>
        {/* <Route exact path="/" component={GameArea} /> */}
        <GameArea />
        <Footer />
      </>
      // </Router>
    );
  }
}

export default App;
