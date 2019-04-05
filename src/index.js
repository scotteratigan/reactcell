import React from "react";
import ReactDOM from "react-dom";
// import './index.css';
import App from "./App.jsx"; // not sure why I have to specify extension here, it isn't looking for jsx
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
