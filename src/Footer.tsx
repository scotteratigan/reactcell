import { type ReactNode } from "react";
import styles from "./App.module.css";

type FooterProps = {
  actions?: ReactNode;
};

export default function Footer({ actions }: FooterProps) {
  return (
    <footer className={styles.footer}>
      {actions ? <div className={styles.footerActions}>{actions}</div> : null}
      <div className={styles.footerLinks}>
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
      </div>
    </footer>
  );
}
