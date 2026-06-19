import React, { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import FreeCell from "./FreeCell";
import Foundation from "./Foundation";
import Cascade from "./Cascade";
import {
  buildBoard,
  cardName,
  dealOrder,
  getCascadeRun,
  hasWon,
  shuffleAndDeal,
  TOTAL_CARDS,
} from "./gameEngine";
import { gameReducer, type GameState, initialState } from "./gameReducer";
import { loadGame, saveGame } from "./persistence";
import type { Card } from "./types";
import styles from "./GameArea.module.css";

// Per-card deal stagger (must match DEAL_STEP_MS in Card.tsx) plus the deal
// animation duration, used to know when the full deal has finished.
const DEAL_STEP_MS = 85;
const DEAL_ANIMATION_MS = 350;
const TOTAL_DEAL_MS = (TOTAL_CARDS - 1) * DEAL_STEP_MS + DEAL_ANIMATION_MS;

// Rehydrates the reducer from a saved game on first render, falling back to the
// empty initial state (which triggers a fresh deal in an effect below).
const initGameState = (): GameState => {
  const saved = loadGame();
  if (!saved) return initialState;
  // Replay the deal animation when resuming so the board flies back in.
  return { ...initialState, cards: saved.cards, selectedKey: saved.selectedKey, dealing: true };
};

export default function GameArea() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState);
  const { cards, selectedKey, announcement, dealing, focusKey } = state;

  // Everything below is derived from `cards`, never stored.
  const board = useMemo(() => buildBoard(cards), [cards]);
  const won = useMemo(() => hasWon(cards), [cards]);
  const selectedKeys = useMemo(
    () => (selectedKey ? new Set(getCascadeRun(cards, board, selectedKey)) : new Set<string>()),
    [cards, board, selectedKey],
  );
  // Deal-animation stagger order for every rendered card (only needed while a
  // deal is animating).
  const dealIndexByKey = useMemo(() => (dealing ? dealOrder(board) : {}), [dealing, board]);

  const selectCardFn = useCallback((objKey: string) => {
    dispatch({ type: "SELECT_CARD", cardKey: objKey });
  }, []);
  const selectEmptySquareFn = useCallback((location: string) => {
    dispatch({ type: "SELECT_EMPTY", location });
  }, []);
  const newGame = useCallback(() => {
    dispatch({ type: "DEAL", cards: shuffleAndDeal() });
  }, []);

  // Whether a saved game was restored on the initial render. Captured once so
  // the mount effect can decide whether to deal without depending on `cards`.
  const restoredRef = useRef(Object.keys(cards).length > 0);

  // Deal a fresh game on mount only when there was no game to resume.
  useEffect(() => {
    if (!restoredRef.current) newGame();
  }, [newGame]);

  // Persist the durable game state whenever the board or selection changes so a
  // game survives reloads, hot reloads, and revisits.
  useEffect(() => {
    saveGame({ cards, selectedKey });
  }, [cards, selectedKey]);

  // Clear the deal animation once the full deal has played out. Re-runs whenever
  // a new deal starts (the `cards` identity changes).
  useEffect(() => {
    if (!dealing) return;
    const timeout = setTimeout(() => dispatch({ type: "END_DEAL" }), TOTAL_DEAL_MS);
    return () => clearTimeout(timeout);
  }, [dealing, cards]);

  // Move keyboard focus to follow a card to its new location after a move.
  useEffect(() => {
    if (!focusKey) return;
    const node = document.getElementById(`card-${focusKey}`);
    if (node) node.focus();
  }, [cards, focusKey]);

  // Surface the win once the deck reaches the foundations.
  useEffect(() => {
    if (won) alert("YOU WIN!!!");
  }, [won]);

  // Attach the derived `selected` flag to display copies so the presentational
  // components stay unaware of selection bookkeeping.
  const withSelected = useCallback(
    <T extends Card | null>(card: T): T =>
      card ? ({ ...card, selected: selectedKeys.has(card.objKey) } as T) : card,
    [selectedKeys],
  );

  const selectedCardName = selectedKey ? cardName(cards[selectedKey]) : null;

  return (
    <div className={styles.board}>
      <p className={styles.srOnly}>
        To move a card, focus it and press Enter or Space to select it, then focus the destination
        card or empty slot and press Enter or Space again. Press Enter on a selected card to send it
        to a foundation.
      </p>
      <div aria-live="assertive" aria-atomic="true" className={styles.srOnly}>
        {announcement}
      </div>
      <button className={styles.newGame} onClick={newGame}>
        New Game
      </button>
      <span className={styles.newGameHint}> (Warning - this will end your current game.)</span>
      <div className={styles.topRow}>
        <div className={styles.group} role="group" aria-label="Foundations">
          <h2 className={styles.groupHeading}>Foundations</h2>
          <div className={styles.slotRow}>
            {board.foundations.map((foundation, i) => (
              <Foundation
                key={"foundation" + i}
                location={"foundation" + i}
                selectCardFn={selectCardFn}
                selectEmptySquareFn={selectEmptySquareFn}
                cards={foundation.map(withSelected)}
                selectedCardName={selectedCardName}
                dealing={dealing}
                dealIndexByKey={dealIndexByKey}
              />
            ))}
          </div>
        </div>
        <div className={styles.group} role="group" aria-label="Free cells">
          <h2 className={styles.groupHeading}>FreeCells</h2>
          <div className={styles.slotRow}>
            {board.freeCells.map((freeCell, i) => (
              <FreeCell
                key={"freeCell" + i}
                location={"freeCell" + i}
                selectCardFn={selectCardFn}
                selectEmptySquareFn={selectEmptySquareFn}
                card={withSelected(freeCell)}
                selectedCardName={selectedCardName}
                dealing={dealing}
                dealIndexByKey={dealIndexByKey}
              />
            ))}
          </div>
        </div>
      </div>

      <h2 className={styles.srOnly}>Tableau</h2>
      <div className={styles.tableau} role="group" aria-label="Tableau columns">
        {board.cascades.map((cascade, i) => (
          <Cascade
            cards={cascade.map(withSelected)}
            selectCardFn={selectCardFn}
            selectEmptySquareFn={selectEmptySquareFn}
            key={"cascade" + i}
            location={"cascade" + i}
            selectedCardName={selectedCardName}
            dealing={dealing}
            dealIndexByKey={dealIndexByKey}
          />
        ))}
      </div>
    </div>
  );
}
