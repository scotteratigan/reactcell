import React from "react";
import GameArea from "./GameArea";
import Footer from "./Footer";
import styles from "./App.module.css";

export default function App() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <em>React</em>Cell
        </h1>
        <p className={styles.tagline}>A FreeCell clone by Scott Ratigan</p>
      </header>
      <main aria-label="FreeCell game board">
        <GameArea />
      </main>
      <Footer />
    </>
  );
}
