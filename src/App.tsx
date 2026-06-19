import React from "react";
import GameArea from "./GameArea";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <em>React</em>Cell
        </h1>
      </header>
      <GameArea />
    </div>
  );
}
