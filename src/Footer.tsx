import React from "react";
import styles from "./App.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <a
        href="https://github.com/scotteratigan/reactcell/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Source Code
      </a>{" "}
      |{" "}
      <a href="https://scotteratigan.github.io/" target="_blank" rel="noopener noreferrer">
        My Portfolio
      </a>{" "}
      |{" "}
      <a
        href="https://www.linkedin.com/in/scotteratigan/"
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
    </footer>
  );
}
