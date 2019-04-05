import React, { Component } from "react";
import FreeCell from "./FreeCell";
import Foundation from "./Foundation";
import Cascade from "./Cascade";

const suits = ["♣", "♦", "♥", "♠"];

export default class GameArea extends Component {
  state = {
    cards: {},
    gameInProgress: false,
    cascades: [[], [], [], [], [], [], [], []],
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    selectedKey: null
  };

  generateCards = () => {
    const cards = {};
    suits.forEach(suit => {
      for (let i = 0; i <= 12; i++) {
        cards[i + suit] = {
          suit: suit,
          rank: i,
          location: null,
          selected: false
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
    suits.forEach(suit => {
      for (let i = 0; i <= 12; i++) {
        cardKeyArr.push({ suit, rank: i });
      }
    });
    const shuffledKeyArr = cardKeyArr
      .map(a => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1]);
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

  displayCards = () => {
    const cards = { ...this.state.cards };
    const cascades = [[], [], [], [], [], [], [], []];
    const foundations = [[], [], [], []];
    const freeCells = [null, null, null, null];
    for (const key in cards) {
      if (cards[key].location === "cascade") {
        cascades[cards[key].column][cards[key].position] = cards[key];
      } else if (cards[key].location === "foundation") {
        foundations[cards[key].column][cards[key].position] = cards[key];
        // foundations["foundation" + cards[key].column][cards[key].rank] = cards[key];
      } else if (cards[key].location === "freeCell") {
        freeCells[cards[key].column] = cards[key];
        // there can be only 1 per cell, so no array here
      }
    }
    this.setState({
      cards,
      cascades,
      foundations,
      freeCells,
      selectedKey: null
    });
  };

  selectCardFn = selection => {
    const cards = { ...this.state.cards };
    console.log("selectCardFn, selection is:", selection);
    // check to move to foundation (and later free cell)

    if (selection.location) {
      const cardToMoveKey = this.state.selectedKey;
      const regExResult = selection.location.match(/(\w+)(\d+)/);
      const location = regExResult[1];
      const column = parseInt(regExResult[2]);
      console.log("column: ", column);

      if (location === "foundation") {
        this.checkToStackCardOnFoundation({
          cardKey: cardToMoveKey,
          column
        });
        return;
      }
      if (location === "freeCell") {
        console.log("trying to move card to freecell");
        // todo: check to ensure freeCell isn't currently occupied
        cards[cardToMoveKey].location = "freeCell";
        cards[cardToMoveKey].column = column;

        // todo: clear selected key
        this.setState({ cards }, () => {
          this.displayCards();
        });
        return;
      }
    }

    let card = {};
    if (selection.rank && selection.suit) card = { ...selection };
    let selectedCardKey = card.rank + card.suit;
    const prevSelectedKey = this.state.selectedKey;
    // first, check to select if no card is selected:
    if (!prevSelectedKey) {
      cards[selectedCardKey].selected = true;
      this.setState({ cards, selectedKey: selectedCardKey });
      return;
    }
    // next, check for unselecting:
    if (selectedCardKey === prevSelectedKey) {
      selectedCardKey = null;
      cards[prevSelectedKey].selected = false;
      this.setState({ cards, selectedKey: selectedCardKey });
      return;
    }
    // console.log("ok, if we get here, we have a potential move...");

    // now determine if this is a cascade move or a foundation stack
    console.log("moving between cascades?");
    console.log("selectedCardKey: ", selectedCardKey);
    console.log("prevSelectedKey: ", prevSelectedKey);
    console.log("cards[prevSelectedKey]:", cards[prevSelectedKey]);
    console.log("cards[selectedCardKey]:", cards[selectedCardKey]);
    if (cards[selectedCardKey].location === "foundation") {
      this.checkToStackCardOnFoundation({
        cardKey: prevSelectedKey,
        column: cards[selectedCardKey].column
      });
      return;
    } else if (cards[selectedCardKey].location === "cascade") {
      this.checkMoveBetweenCascadesIsLegal(prevSelectedKey, selectedCardKey);
      return;
    }
  };

  checkToStackCardOnFoundation = args => {
    const cards = { ...this.state.cards };
    const { cardKey, column } = args;
    const cardToMove = cards[cardKey];
    console.log("Attempting to move card", cardToMove, "to col", column);
    // const destColKey = "foundation" + column;
    cardToMove.location = "foundation";
    cardToMove.column = column;
    // 1. if stack is empty, card rank must be 1
    // 2. if stack not empty, card rank must be 1 + prev rank AND card suits must match
    this.setState({ cards, selectedKey: null }, () => {
      this.displayCards();
    });
    // if foundations were one object with 4 keys, we could specify a variable key name...
  };

  checkMoveBetweenCascadesIsLegal = (originKey, destKey) => {
    console.log("checking to move card", originKey, "to destination", destKey);
    // for now, assuming we've clicked on the top card
    const cards = { ...this.state.cards };
    const originCard = cards[originKey];
    console.log("originCard: ", originCard);
    const destCard = cards[destKey];
    console.log("destCard: ", destCard);
    if (originCard.rank + 1 !== destCard.rank) {
      console.log("Move illegal, rank doesn't match.");
    } else if (this.getCardColor(originCard) === this.getCardColor(destCard)) {
      console.log("Move illegal, colors are the same.");
    } else {
      console.log("Move should be legal (assuming top cards)");
      // originCard.location = destCard.location; // for now irrelevant, we only have cascades
      originCard.column = destCard.column;
      originCard.position = destCard.position + 1;
      cards[originKey].selected = false; // unselect the key
      this.setState({ cards, selectedKey: null }, () => {
        this.displayCards();
      });
      // 1. set new card location(s)
      // 2. update state
      // 3. ensure new locations are displayed in correct cascades
    }
  };

  getCardColor = card => {
    if (card.suit === "♦" || card.suit === "♥") return "red";
    return "black";
  };

  render() {
    const cardWidth = 100;
    const cardHeight = Math.round(1.4 * cardWidth);
    return (
      <div style={{ backgroundColor: "green" }}>
        <button onClick={this.generateCards}>Shuffle Deck</button>
        <div style={{ display: "flex" }}>
          <div style={{ margin: 20 }}>
            <h4 style={{ textAlign: "center" }}>Foundations</h4>
            <div style={{ display: "flex" }}>
              {this.state.foundations.map((foundation, i) => (
                <Foundation
                  height={cardHeight}
                  width={cardWidth}
                  key={"foundation" + i}
                  location={"foundation" + i}
                  selectCardFn={this.selectCardFn}
                  cards={foundation}
                />
              ))}
            </div>
          </div>
          <div style={{ margin: 20 }}>
            <h4 style={{ textAlign: "center" }}>FreeCells</h4>
            <div style={{ display: "flex" }}>
              {this.state.freeCells.map((freeCell, i) => (
                <FreeCell
                  width={cardWidth}
                  height={cardHeight}
                  key={"freeCell" + i}
                  location={"freeCell" + i}
                  selectCardFn={this.selectCardFn}
                  card={freeCell}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {this.state.cascades.map((cascade, i) => (
            <Cascade
              className="Cascade"
              cards={cascade}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              selectCardFn={this.selectCardFn}
              key={"cascade" + i}
              location={"cascade" + i}
            />
          ))}
        </div>
      </div>
    );
  }
}
