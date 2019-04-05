import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
// import "./App.css";
import GameArea from "./GameArea";

class App extends Component {
  render() {
    return (
      <Router>
        <>
          <div>ReactCell by Scott Ratigan</div>
          <Route exact path="/" component={GameArea} />
        </>
      </Router>
    );
  }
}

export default App;
