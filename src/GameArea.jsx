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
          selected: false,
          objKey: i + suit
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

  cardsCanStack = (bottomCardKey, topCardKey, stackType) => {
    // currently unused, would like to integrate into select/move function
    const bottomCard = this.state.cards[bottomCardKey];
    const topCard = this.state.cards[topCardKey];
    if (stackType === "cascade") {
      console.log("Checking for cascade stack.");
      // in a cascade stack, color must be opposite, and rank of top card must be 1 lower than bottom card
      if (topCard.rank - 1 !== bottomCard.rank) return false;
      if (this.getCardColor(topCard) === this.getCardColor(bottomCard))
        return false;
      return true;
    } else if (stackType === "foundation") {
      // in a foundation stack, suit must match, and rank of top card must be 1 greater than bottom card
      console.log("Checking for foundation stack.");
      if (topCard.suit !== bottomCard.suit) return false;
      if (topCard.rank + 1 !== bottomCard.rank) return false;
      return true;
    } else {
      console.error(
        "GameArea.jsx -> cardsCanStack function: incorrect stack type specified"
      );
      return false;
    }
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
        // foundations[cards[key].column].push(cards[key]);
      } else if (cards[key].location === "freeCell") {
        freeCells[cards[key].column] = cards[key];
        // there can be only 1 per cell, so no array here
      }
    }
    console.log("cards:", cards);
    console.log("foundations: ", foundations);
    console.log("cascades: ", cascades);
    this.setState({
      cards,
      cascades,
      foundations,
      freeCells,
      selectedKey: null
    });
  };

  // todo: separate function for selectCard and selectEmptySquare

  selectEmptySquareFn = destLocation => {
    console.log("Empty square selected, location:", destLocation);
    const cardKey = this.state.selectedKey; // key of card to potentially move
    if (!cardKey) {
      // no card previously selected, ignoring click;
      return;
    }
    const locationMatch = destLocation.match(/(\w+)(\d+)/);
    const locationType = locationMatch[1];
    const column = locationMatch[2];
    const cards = { ...this.state.cards };

    // ok, so now we check to move the card here.
    if (locationType === "foundation") {
      const moveLegal = this.checkToStackCardOnFoundation({
        cardKey,
        column
      });
      if (!moveLegal) return;
      cards[cardKey].location = "foundation";
      cards[cardKey].column = column;
      cards[cardKey].position = cards[cardKey].rank; // when stacked by suit, position and rank are the same
      cards[cardKey].selected = false;
      this.setState({ cards, selectedKey: null }, () => {
        this.displayCards();
      });
      return;
    }

    // todo: add check for free cell move here
  };

  selectCardFn = cardKey => {
    console.log("selecting card, key is:", cardKey);
    const cards = { ...this.state.cards };

    if (this.state.selectedKey && this.state.selectedKey === cardKey) {
      // if we already had a selected card and we click the same one again, unselect it and return
      cards[cardKey].selected = false;
      this.setState({ cards, selectedKey: null });
      return;
    }

    if (!this.state.selectedKey) {
      // no previously selected key, just select this one and return
      cards[cardKey].selected = true;
      this.setState({ cards, selectedKey: cardKey });
      return;
    }
    // otherwise, check to make a move:
    console.log("todo: check to make a move");
    // determine where we're trying to move the card
    const destCard = this.state.cards[cardKey];
    console.log("destCard: ", destCard);
    console.log("destCard.location:", destCard.location);
    if (destCard.location === "foundation") {
      // if move is to a foundation, check if checkToStackCardOnFoundation is true;
      const moveIsLegal = this.checkToStackCardOnFoundation({
        cardKey: this.state.selectedKey,
        column: destCard.column
      });
      if (!moveIsLegal) return;
      console.log("Move is legal (probably, lol)");
      return;
    }
  };

  checkToStackCardOnFoundation = args => {
    const { cardKey, column } = args;
    const cards = { ...this.state.cards };
    const cardToMove = cards[cardKey];
    console.log(
      "Attempting to move card",
      cardToMove,
      "to foundation col",
      column
    );
    if (this.state.foundations[column].length === 0) {
      if (cardToMove.rank !== 0) {
        console.log("Foundations must begin with an Ace");
        return false;
      } else {
        console.log("Beginning new foundation with an ace");
        return true;
      }
    } else {
      // add logic if there's already a card on the stack
      // if suit matches last card on the stack, and rank is 1 greater than last card on the stack, move is legal
      const suitOfFoundation = this.state.foundations[column][0].suit;
      if (cardToMove.suit !== suitOfFoundation) return false;
      return true;
    }
    // cardToMove.location = "foundation";
    // cardToMove.column = column;
    // // 1. if stack is empty, card rank must be 1
    // // 2. if stack not empty, card rank must be 1 + prev rank AND card suits must match
    // this.setState({ cards, selectedKey: null }, () => {
    //   this.displayCards();
    // });
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
      return false;
    } else if (this.getCardColor(originCard) === this.getCardColor(destCard)) {
      console.log("Move illegal, colors are the same.");
      return false;
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
                  selectEmptySquareFn={this.selectEmptySquareFn}
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
                  selectEmptySquareFn={this.selectEmptySquareFn}
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
              selectEmptySquareFn={this.selectEmptySquareFn}
              key={"cascade" + i}
              location={"cascade" + i}
            />
          ))}
        </div>
      </div>
    );
  }
}
