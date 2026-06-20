import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import appStyles from "./App.module.css";
import FreeCell from "./FreeCell";
import Foundation from "./Foundation";
import Cascade from "./Cascade";
import Footer from "./Footer";
import WinCelebration from "./WinCelebration";
import DragPreview from "./DragPreview";
import { useCardDrag } from "./useCardDrag";
import { useCardFlip } from "./useCardFlip";
import {
  buildBoard,
  canAutoComplete,
  cardName,
  dealOrder,
  getCascadeRun,
  hasWon,
  shuffleAndDealWithSeed,
  TOTAL_CARDS,
} from "./gameEngine";
import { type GameAction, gameReducer, type GameState, initialState } from "./gameReducer";
import { clearSavedGame, loadGame, saveGame } from "./persistence";
import { generateRandomSeed, parseSeed, readSeedFromUrl, writeSeedToUrl } from "./seed";
import type { Card } from "./types";
import styles from "./GameArea.module.css";

// Per-card deal stagger (must match DEAL_STEP_MS in Card.tsx) plus the deal
// animation duration, used to know when the full deal has finished.
const DEAL_STEP_MS = 32;
const DEAL_ANIMATION_MS = 350;
const TOTAL_DEAL_MS = (TOTAL_CARDS - 1) * DEAL_STEP_MS + DEAL_ANIMATION_MS;

// Delay between cards when the endgame auto-completes itself. Fast enough to
// feel snappy, slow enough that each card visibly lands on its foundation.
const AUTO_COMPLETE_STEP_MS = 90;

const resolveInitialSeed = (): number => {
  const saved = loadGame();
  if (saved) return saved.seed;
  return readSeedFromUrl() ?? generateRandomSeed();
};

// Rehydrates the reducer from a saved game on first render, falling back to the
// empty initial state (which triggers a fresh deal in an effect below).
const initGameState = (): GameState => {
  const saved = loadGame();
  if (!saved) return initialState;
  // Replay the deal animation when resuming so the board flies back in.
  return {
    ...initialState,
    cards: saved.cards,
    selectedKey: saved.selectedKey,
    history: saved.history,
    dealing: true,
  };
};

export default function GameArea() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState);
  const { cards, selectedKey, announcement, dealing, focusKey, history } = state;
  const canUndo = history.length > 0;
  const [gameNumber, setGameNumber] = useState(resolveInitialSeed);
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [customGameNumberInput, setCustomGameNumberInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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
  const sendToFoundationFn = useCallback((objKey: string) => {
    dispatch({ type: "SEND_TO_FOUNDATION", cardKey: objKey });
  }, []);

  // Animate moves that come from clicking / keyboard / auto-complete. Drag drops
  // pass through `dragDispatch`, which suppresses the flight since the drag
  // preview already showed the motion.
  const { skipNextFlip } = useCardFlip(boardRef, cards, dealing);
  const dragDispatch = useCallback(
    (action: GameAction) => {
      if (action.type === "DROP") skipNextFlip();
      dispatch(action);
    },
    [skipNextFlip],
  );

  const { dragState, hoverLocation, justDraggedRef, onPointerDownCard } = useCardDrag(
    cards,
    dragDispatch,
  );
  const draggingKeys = useMemo(() => new Set(dragState?.keys ?? []), [dragState]);

  // Swallow the synthetic click that fires immediately after a drag completes,
  // so finishing a drag never also toggles selection on the card underneath.
  const handleBoardClickCapture = useCallback(
    (event: ReactMouseEvent) => {
      if (justDraggedRef.current) {
        justDraggedRef.current = false;
        event.stopPropagation();
      }
    },
    [justDraggedRef],
  );
  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const startGame = useCallback((nextGameNumber: number) => {
    clearSavedGame();
    setGameNumber(nextGameNumber);
    writeSeedToUrl(nextGameNumber);
    dispatch({ type: "DEAL", cards: shuffleAndDealWithSeed(nextGameNumber) });
    setNewGameOpen(false);
    setCustomGameNumberInput("");
  }, []);

  // Whether a saved game was restored on the initial render. Captured once so
  // the mount effect can decide whether to deal without depending on `cards`.
  const restoredRef = useRef(Object.keys(cards).length > 0);

  // Deal a fresh game on mount only when there was no game to resume, and keep
  // the URL in sync when resuming.
  useEffect(() => {
    if (!restoredRef.current) startGame(gameNumber);
    else writeSeedToUrl(gameNumber);
    // Mount-only: subsequent new games are started from the dialog handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the durable game state whenever the board, selection, or undo
  // history changes so a game survives reloads, hot reloads, and revisits.
  useEffect(() => {
    saveGame({ cards, selectedKey, history, seed: gameNumber });
  }, [cards, selectedKey, history, gameNumber]);

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

  // Once the board is trivially winnable (finishable by foundation moves
  // alone), send the remaining cards home automatically, one per tick. Each
  // step changes `cards`, which re-runs this effect to schedule the next card
  // until the deck is home; any other board change cancels the pending tick.
  useEffect(() => {
    if (dealing || won || dragState) return;
    if (!canAutoComplete(cards)) return;
    const timeout = setTimeout(
      () => dispatch({ type: "AUTO_FOUNDATION_STEP" }),
      AUTO_COMPLETE_STEP_MS,
    );
    return () => clearTimeout(timeout);
  }, [cards, dealing, won, dragState]);

  // Reset the celebration's dismissed flag whenever the board leaves the won
  // state (i.e. a new deal), so the next win shows the celebration again.
  useEffect(() => {
    if (!won) setCelebrationDismissed(false);
  }, [won]);

  // Show the celebration as soon as the deck reaches the foundations, unless the
  // player has dismissed it. (A win can't occur mid-deal in normal play, so we
  // intentionally don't wait on the deal animation here -- doing so would add a
  // visible delay when a win lands while a resume's deal is still replaying.)
  const showCelebration = won && !celebrationDismissed;

  const openNewGame = useCallback(() => {
    setCustomGameNumberInput("");
    setNewGameOpen(true);
  }, []);

  const copyGameNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(gameNumber));
      setCopyFeedback(true);
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current);
      copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Clipboard access can fail outside a secure context or without permission.
    }
  }, [gameNumber]);

  useEffect(
    () => () => {
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current);
    },
    [],
  );

  const startRandomGame = useCallback(() => {
    startGame(generateRandomSeed());
  }, [startGame]);

  const startCustomGameNumber = useCallback(() => {
    const parsed = parseSeed(customGameNumberInput);
    if (parsed === null) return;
    startGame(parsed);
  }, [customGameNumberInput, startGame]);

  const customGameNumberValid = parseSeed(customGameNumberInput) !== null;

  // Attach the derived `selected` and `dragging` flags to display copies so the
  // presentational components stay unaware of selection/drag bookkeeping.
  const withSelected = useCallback(
    <T extends Card | null>(card: T): T =>
      card
        ? ({
            ...card,
            selected: selectedKeys.has(card.objKey),
            dragging: draggingKeys.has(card.objKey),
          } as T)
        : card,
    [selectedKeys, draggingKeys],
  );

  const selectedCardName = selectedKey ? cardName(cards[selectedKey]) : null;

  return (
    <>
      <main className={appStyles.main} aria-label="FreeCell game board">
        <div className={styles.board} ref={boardRef} onClickCapture={handleBoardClickCapture}>
          <p className={styles.srOnly}>
            To move a card, focus it and press Enter or Space to select it, then focus the
            destination card or empty slot and press Enter or Space again. Press Enter on a selected
            card to send it to a foundation.
          </p>
          <div aria-live="assertive" aria-atomic="true" className={styles.srOnly}>
            {announcement}
          </div>
          <p className={styles.gameNumberDisplay}>
            Game number:{" "}
            <span className={styles.gameNumberRow}>
              <span className={styles.gameNumberValue}>{gameNumber}</span>
              <button
                type="button"
                className={styles.copyGameNumber}
                onClick={copyGameNumber}
                aria-label={copyFeedback ? "Game number copied" : "Copy game number"}
                title={copyFeedback ? "Copied!" : "Copy game number"}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.copyGameNumberIcon}>
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              </button>
            </span>
            <span className={styles.srOnly} aria-live="polite">
              {copyFeedback ? "Game number copied to clipboard." : ""}
            </span>
          </p>
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
                    onPointerDownCard={onPointerDownCard}
                    onSendToFoundation={sendToFoundationFn}
                    dropHover={hoverLocation === "foundation" + i}
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
                    onPointerDownCard={onPointerDownCard}
                    onSendToFoundation={sendToFoundationFn}
                    dropHover={hoverLocation === "freeCell" + i}
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
                onPointerDownCard={onPointerDownCard}
                onSendToFoundation={sendToFoundationFn}
                dropHover={hoverLocation === "cascade" + i}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer
        actions={
          <>
            <button
              type="button"
              className={appStyles.footerButton}
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <button type="button" className={appStyles.footerButton} onClick={openNewGame}>
              New Game
            </button>
          </>
        }
      />
      {newGameOpen ? (
        <div
          className={styles.newGameDialogBackdrop}
          onClick={() => setNewGameOpen(false)}
          role="presentation"
        >
          <div
            className={styles.newGameDialog}
            role="dialog"
            aria-labelledby="new-game-title"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="new-game-title" className={styles.newGameDialogTitle}>
              Start a new game
            </h2>
            <p className={styles.newGameDialogHint}>
              Share the game number in the URL to play the same deal with someone else.
            </p>
            <div className={styles.newGameDialogActions}>
              <button className={styles.newGamePrimary} onClick={startRandomGame}>
                Random game
              </button>
              <div className={styles.customGameNumberRow}>
                <label className={styles.customGameNumberLabel} htmlFor="custom-game-number">
                  Or enter a game number:
                </label>
                <input
                  id="custom-game-number"
                  className={styles.customGameNumberInput}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 123456789"
                  value={customGameNumberInput}
                  onChange={(event) => setCustomGameNumberInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && customGameNumberValid) startCustomGameNumber();
                  }}
                />
                <button
                  className={styles.newGamePrimary}
                  onClick={startCustomGameNumber}
                  disabled={!customGameNumberValid}
                >
                  Play game number
                </button>
              </div>
              <button className={styles.newGameCancel} onClick={() => setNewGameOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showCelebration ? (
        <WinCelebration
          gameNumber={gameNumber}
          onPlayAgain={openNewGame}
          onDismiss={() => setCelebrationDismissed(true)}
        />
      ) : null}
      {dragState ? <DragPreview drag={dragState} cards={cards} /> : null}
    </>
  );
}
