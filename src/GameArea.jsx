import React, { Component } from "react";
import FreeCell from "./FreeCell";
import Foundation from "./Foundation";
import Cascade from "./Cascade";

const suits = ["♣", "♦", "♥", "♠"];

const RANK_NAMES = [
  "Ace",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Jack",
  "Queen",
  "King",
];

const SUIT_NAMES = {
  "♣": "Clubs",
  "♦": "Diamonds",
  "♥": "Hearts",
  "♠": "Spades",
};

const cardName = (card) => `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;

const locationName = (location, column) => {
  const col = Number(column) + 1;
  if (location === "foundation") return `foundation ${col}`;
  if (location === "freeCell") return `free cell ${col}`;
  if (location === "cascade") return `tableau column ${col}`;
  return location;
};

const srOnlyStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default class GameArea extends Component {
  state = {
    cards: {},
    gameInProgress: false,
    cascades: [[], [], [], [], [], [], [], []],
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    selectedKey: null,
    width: 0,
    height: 0,
    gameWon: false,
    announcement: "",
    // cheatMode: false
  };

  // Key of the card whose DOM node should receive focus after the next
  // re-render (so keyboard focus follows a card when it is moved/unmounted).
  focusKeyAfterUpdate = null;

  announce = (message) => {
    this.setState({ announcement: message });
  };

  componentDidMount = () => {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    this.generateCards();
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.updateWindowDimensions);
  };

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  };

  generateCards = () => {
    const cards = {};
    suits.forEach((suit) => {
      for (let i = 0; i <= 12; i++) {
        cards[i + suit] = {
          suit: suit,
          rank: i,
          location: null,
          selected: false,
          objKey: i + suit,
        };
      }
    });
    this.setState({ cards }, () => {
      // once cards are generated, shuffle them:
      this.shuffleCards();
    });
  };

  shuffleCards = () => {
    const cardKeyArr = [];
    suits.forEach((suit) => {
      for (let i = 0; i <= 12; i++) {
        cardKeyArr.push({ suit, rank: i });
      }
    });
    const shuffledKeyArr = cardKeyArr
      .map((a) => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
    const cardsDealtOut = { ...this.state.cards }; // there's mutation here b/c obj of objs, but shouldn't matter
    shuffledKeyArr.forEach((card, i) => {
      const cascadeCol = i % 8; // 0 - 7
      const positionInCascade = Math.floor(i / 8);
      const cardKey = card.rank + card.suit;
      cardsDealtOut[cardKey].location = "cascade";
      cardsDealtOut[cardKey].column = cascadeCol;
      cardsDealtOut[cardKey].position = positionInCascade;
    });
    this.setState({ cards: cardsDealtOut }, () => {
      this.displayCards();
    });
  };

  cardsCanStack = (bottomCardKey, topCardKey, stackType) => {
    // currently unused, would like to integrate into select/move function
    const bottomCard = this.state.cards[bottomCardKey];
    const topCard = this.state.cards[topCardKey];
    if (stackType === "cascade") {
      // in a cascade stack, color must be opposite, and rank of top card must be 1 lower than bottom card
      if (topCard.rank - 1 !== bottomCard.rank) return false;
      if (this.getCardColor(topCard) === this.getCardColor(bottomCard)) return false;
      return true;
    } else if (stackType === "foundation") {
      // in a foundation stack, suit must match, and rank of top card must be 1 greater than bottom card
      if (topCard.suit !== bottomCard.suit) return false;
      if (topCard.rank + 1 !== bottomCard.rank) return false;
      return true;
    } else {
      console.error("GameArea.jsx -> cardsCanStack function: incorrect stack type specified");
      return false;
    }
  };

  gameWon = () => {
    this.announce("You win! All cards are on the foundations.");
    alert("YOU WIN!!!");
  };

  displayCards = () => {
    const cards = { ...this.state.cards };
    const cascades = [[], [], [], [], [], [], [], []];
    const foundations = [[], [], [], []];
    const freeCells = [null, null, null, null];
    let gameWon = true; // assume we won, set to false if a single card isn't in a foundation
    for (const key in cards) {
      if (cards[key].location === "cascade") {
        cascades[cards[key].column][cards[key].position] = cards[key];
        gameWon = false;
      } else if (cards[key].location === "foundation") {
        foundations[cards[key].column][cards[key].position] = cards[key];
        // foundations[cards[key].column].push(cards[key]);
      } else if (cards[key].location === "freeCell") {
        freeCells[cards[key].column] = cards[key];
        gameWon = false;
        // there can be only 1 per cell, so no array here
      }
    }
    this.setState(
      {
        cards,
        cascades,
        foundations,
        freeCells,
        selectedKey: null,
        gameWon,
      },
      () => {
        const focusKey = this.focusKeyAfterUpdate;
        this.focusKeyAfterUpdate = null;
        if (focusKey) {
          const node = document.getElementById(`card-${focusKey}`);
          if (node) node.focus();
        }
      },
    );
    if (gameWon) this.gameWon();
  };

  selectEmptySquareFn = (destLocation) => {
    const cardKey = this.state.selectedKey; // key of card to potentially move
    // if no card previously selected, ignore click;
    if (!cardKey) return;
    const locationMatch = destLocation.match(/(\w+)(\d+)/);
    const locationType = locationMatch[1];
    const column = locationMatch[2];
    // ok, so now we check to move the card here.
    if (locationType === "foundation") {
      const moved = this.tryToStackCardOnFoundation({
        cardKey,
        column,
      });
      if (!moved) {
        this.announce(
          `${cardName(this.state.cards[cardKey])} cannot move to foundation ${Number(column) + 1}.`,
        );
      }
    } else if (locationType === "freeCell") {
      this.checkToMoveToFreeCell({ cardKey, column });
    } else if (locationType === "cascade") {
      this.tryToMoveToEmptyCascade({ cardKey, column });
    }
  };

  selectCardFn = (cardKey) => {
    const cards = { ...this.state.cards };
    if (this.state.selectedKey && this.state.selectedKey === cardKey) {
      // if we click a card we already had selected (double click essentially)
      // check to stack on foundation, otherwise unselect
      if (
        this.tryToStackCardOnFoundation({
          cardKey: this.state.selectedKey,
          column: 0,
        }) ||
        this.tryToStackCardOnFoundation({
          cardKey: this.state.selectedKey,
          column: 1,
        }) ||
        this.tryToStackCardOnFoundation({
          cardKey: this.state.selectedKey,
          column: 2,
        }) ||
        this.tryToStackCardOnFoundation({
          cardKey: this.state.selectedKey,
          column: 3,
        })
      )
        return;
      // if we already had a selected card and we click the same one again, unselect it and return
      cards[cardKey].selected = false;
      this.setState({ cards, selectedKey: null });
      this.announce(`Deselected ${cardName(cards[cardKey])}.`);
      // can't stack on foundation, ignore click
      return;
    }
    if (!this.state.selectedKey) {
      // no previously selected key, just select this one and return
      // if the card is in a cascade, only allow selection of the last card
      const clickedCard = cards[cardKey];
      let selectedCard = clickedCard;
      if (clickedCard.location === "cascade") {
        const selectedCol = clickedCard.column;
        selectedCard =
          this.state.cascades[selectedCol][this.state.cascades[selectedCol].length - 1];
      }
      cards[selectedCard.objKey].selected = true;
      this.setState({ cards, selectedKey: selectedCard.objKey });
      this.announce(`Selected ${cardName(selectedCard)}. Choose where to move it.`);
      return;
    }
    // otherwise, handle attempted move:
    // determine where we're trying to move the card
    const movingCard = this.state.cards[this.state.selectedKey];
    const destCard = this.state.cards[cardKey];
    if (destCard.location === "foundation") {
      // if move is to a foundation, try to stack:
      const moved = this.tryToStackCardOnFoundation({
        cardKey: this.state.selectedKey,
        column: destCard.column,
      });
      if (!moved) {
        this.announce(`${cardName(movingCard)} cannot move to foundation ${destCard.column + 1}.`);
      }
      return;
    } else if (destCard.location === "cascade") {
      const moved = this.tryToMoveToCascade({
        cardKey: this.state.selectedKey,
        column: destCard.column,
      });
      if (!moved) {
        this.announce(
          `${cardName(movingCard)} cannot move to tableau column ${destCard.column + 1}.`,
        );
      }
    }
  };

  moveCard = (args) => {
    const { cardKey, location, column, position } = args;
    const cards = { ...this.state.cards };
    const card = cards[cardKey];
    card.location = location;
    card.column = column;
    card.position = position;
    card.selected = false;
    if (this.state.selectedKey) cards[this.state.selectedKey].selected = false;
    this.focusKeyAfterUpdate = cardKey;
    this.announce(`Moved ${cardName(card)} to ${locationName(location, column)}.`);
    this.setState({ cards, selectedKey: null }, () => {
      this.displayCards();
    });
  };

  checkToMoveToFreeCell = (args) => {
    const { cardKey, column } = args;
    const freeCell = this.state.freeCells[column];
    if (freeCell) {
      console.error("Attempted to move to non-empty freeCell which should not be possible.");
      return;
    }
    this.moveCard({ cardKey, location: "freeCell", column, position: 0 });
  };

  tryToStackCardOnFoundation = (args) => {
    const { cardKey, column } = args;
    const cards = { ...this.state.cards };
    const cardToMove = cards[cardKey];
    if (this.state.foundations[column].length === 0) {
      // if foundation is empty, the card we're moving has to be an Ace:
      if (cardToMove.rank !== 0) return false;
    } else {
      // if suit matches last card on the stack, and rank is 1 greater than last card on the stack, move is legal
      const foundationColumnLength = this.state.foundations[column].length;
      const topFoundationCard = this.state.foundations[column][foundationColumnLength - 1];
      if (cardToMove.suit !== topFoundationCard.suit) return false;
      if (cardToMove.rank - 1 !== topFoundationCard.rank) return false;
    }
    this.moveCard({
      cardKey,
      location: "foundation",
      column,
      position: cards[cardKey].rank,
    });
    return true;
  };

  tryToMoveToEmptyCascade = (args) => {
    const { cardKey, column } = args;
    const cascadeLength = this.state.cascades[column].length;
    if (cascadeLength > 0) {
      console.error("Attempted to move to non-empty cascade, which should not be possible");
      return false;
    }
    this.moveCard({
      cardKey,
      location: "cascade",
      column,
      position: 0,
    });
    return true;
  };

  tryToMoveToCascade = (args) => {
    const { cardKey, column } = args;
    const cards = { ...this.state.cards };
    const cardToMove = cards[cardKey];
    const lengthOfCascade = this.state.cascades[column].length;
    const topCardInCascade = this.state.cascades[column][lengthOfCascade - 1];
    // if colors are the same, return;
    if (this.getCardColor(cardToMove) === this.getCardColor(topCardInCascade)) return false;
    // if the rank of the card to move isn't 1 less than the top card in cascade, return:
    if (cardToMove.rank + 1 !== topCardInCascade.rank) return false;
    this.moveCard({
      cardKey,
      location: "cascade",
      column,
      position: topCardInCascade.position + 1,
    });
    return true;
  };

  getCardColor = (card) => {
    if (card.suit === "♦" || card.suit === "♥") return "red";
    return "black";
  };

  render() {
    const cardWidth = Math.min(
      Math.round(this.state.width / 12),
      Math.round(this.state.height / 12),
    );
    const cardHeight = Math.round(1.4 * cardWidth);
    const cardMargins = Math.round(this.state.width * 0.02);
    // While a card is selected, empty slots become operable move destinations.
    const selectedCard = this.state.selectedKey ? this.state.cards[this.state.selectedKey] : null;
    const selectedCardName = selectedCard ? cardName(selectedCard) : null;
    return (
      <div style={{ textAlign: "center" }}>
        <p style={srOnlyStyle}>
          To move a card, focus it and press Enter or Space to select it, then focus the destination
          card or empty slot and press Enter or Space again. Press Enter on a selected card to send
          it to a foundation.
        </p>
        <div aria-live="assertive" aria-atomic="true" style={srOnlyStyle}>
          {this.state.announcement}
        </div>
        <button style={{ marginLeft: 20 }} onClick={this.generateCards}>
          New Game
        </button>
        <span style={{ fontSize: "0.7em" }}> (Warning - this will end your current game.)</span>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ margin: cardMargins }} role="group" aria-label="Foundations">
            <h2 style={{ textAlign: "center", fontSize: "1rem" }}>Foundations</h2>
            <div style={{ display: "flex" }}>
              {this.state.foundations.map((foundation, i) => (
                <Foundation
                  height={cardHeight}
                  width={cardWidth}
                  key={"foundation" + i}
                  location={"foundation" + i}
                  selectCardFn={this.selectCardFn}
                  selectEmptySquareFn={this.selectEmptySquareFn}
                  cards={foundation}
                  cardMargins={cardMargins}
                  selectedCardName={selectedCardName}
                />
              ))}
            </div>
          </div>
          <div style={{ margin: cardMargins }} role="group" aria-label="Free cells">
            <h2 style={{ textAlign: "center", fontSize: "1rem" }}>FreeCells</h2>
            <div style={{ display: "flex" }}>
              {this.state.freeCells.map((freeCell, i) => (
                <FreeCell
                  width={cardWidth}
                  height={cardHeight}
                  key={"freeCell" + i}
                  location={"freeCell" + i}
                  selectCardFn={this.selectCardFn}
                  selectEmptySquareFn={this.selectEmptySquareFn}
                  card={freeCell}
                  cardMargins={cardMargins}
                  selectedCardName={selectedCardName}
                />
              ))}
            </div>
          </div>
        </div>

        <h2 style={srOnlyStyle}>Tableau</h2>
        <div
          style={{ display: "flex", justifyContent: "center" }}
          role="group"
          aria-label="Tableau columns"
        >
          {this.state.cascades.map((cascade, i) => (
            <Cascade
              className="Cascade"
              cards={cascade}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              selectCardFn={this.selectCardFn}
              selectEmptySquareFn={this.selectEmptySquareFn}
              key={"cascade" + i}
              location={"cascade" + i}
              cardMargins={cardMargins}
              selectedCardName={selectedCardName}
            />
          ))}
        </div>
      </div>
    );
  }
}
