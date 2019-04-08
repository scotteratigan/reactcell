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
    selectedKey: null,
    width: 0,
    height: 0
  };

  componentDidMount = () => {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.updateWindowDimensions);
  };

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
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

  selectEmptySquareFn = destLocation => {
    const cardKey = this.state.selectedKey; // key of card to potentially move
    // if no card previously selected, ignore click;
    if (!cardKey) return;
    const locationMatch = destLocation.match(/(\w+)(\d+)/);
    const locationType = locationMatch[1];
    const column = locationMatch[2];
    // ok, so now we check to move the card here.
    if (locationType === "foundation") {
      this.checkToStackCardOnFoundation({
        cardKey,
        column
      });
    } else if (locationType === "freeCell") {
      this.checkToMoveToFreeCell({ cardKey, column });
    }
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
    // otherwise, handle attempted move:
    console.log("Checking to move card:");

    // determine where we're trying to move the card
    const destCard = this.state.cards[cardKey];
    console.log("destCard: ", destCard);
    console.log("destCard.location:", destCard.location);
    if (destCard.location === "foundation") {
      // if move is to a foundation, check if checkToStackCardOnFoundation is true;
      this.checkToStackCardOnFoundation({
        cardKey: this.state.selectedKey,
        column: destCard.column
      });
      return;
    } else if (destCard.location === "cascade") {
      console.log("selectCardFn: checking to move card");
      this.tryToMoveToCascade({
        cardKey: this.state.selectedKey,
        column: destCard.column
      });
    }
  };

  moveCard = args => {
    const { cardKey, location, column, position } = args;
    const cards = { ...this.state.cards };
    const card = cards[cardKey];
    console.log("Inside the moveCard fn call.");
    card.location = location;
    card.column = column;
    card.position = position;
    card.selected = false;
    cards[this.state.selectedKey].selected = null;
    this.setState({ cards, selectedKey: null }, () => {
      this.displayCards();
    });
  };

  checkToMoveToFreeCell = args => {
    const { cardKey, column } = args;
    const freeCell = this.state.freeCells[column];
    if (freeCell) {
      console.log("Cell must be free, duh");
      return;
    }
    console.log("Ok, we should be good to move here...");
    this.moveCard({ cardKey, location: "freeCell", column, position: 0 });
  };

  checkToStackCardOnFoundation = args => {
    const { cardKey, column } = args;
    const cards = { ...this.state.cards };
    const cardToMove = cards[cardKey];
    if (this.state.foundations[column].length === 0) {
      // if foundation is empty, the card we're moving has to be an Ace:
      if (cardToMove.rank !== 0) return false;
    } else {
      // if suit matches last card on the stack, and rank is 1 greater than last card on the stack, move is legal
      const foundationColumnLength = this.state.foundations[column].length;
      const topFoundationCard = this.state.foundations[column][
        foundationColumnLength - 1
      ];
      if (cardToMove.suit !== topFoundationCard.suit) return false;
      if (cardToMove.rank - 1 !== topFoundationCard.rank) return false;
    }
    this.moveCard({
      cardKey,
      location: "foundation",
      column,
      position: cards[cardKey].rank
    });
  };

  tryToMoveToCascade = args => {
    const { cardKey, column } = args;
    const cards = { ...this.state.cards };
    const cardToMove = cards[cardKey];
    const lengthOfCascade = this.state.cascades[column].length;
    const topCardInCascade = this.state.cascades[column][lengthOfCascade - 1];
    console.log("topCardInCascade: ", topCardInCascade);
    // if colors are the same, return;
    if (this.getCardColor(cardToMove) === this.getCardColor(topCardInCascade))
      return;
    // if the rank of the card to move isn't 1 less than the top card in cascade, return:
    if (cardToMove.rank + 1 !== topCardInCascade.rank) return;
    this.moveCard({
      cardKey,
      location: "cascade",
      column,
      position: topCardInCascade.position + 1
    });
  };

  getCardColor = card => {
    if (card.suit === "♦" || card.suit === "♥") return "red";
    return "black";
  };

  render() {
    const cardWidth = Math.round(this.state.width / 12);
    const cardHeight = Math.round(1.4 * cardWidth);
    const cardMargins = Math.round(this.state.width * 0.02);
    return (
      <div style={{}}>
        <button onClick={this.generateCards}>Shuffle Deck</button>
        <span> (Warning - this will end your current game.)</span>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ margin: cardMargins }}>
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
                  cardMargins={cardMargins}
                />
              ))}
            </div>
          </div>
          <div style={{ margin: cardMargins }}>
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
                  cardMargins={cardMargins}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
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
            />
          ))}
        </div>
      </div>
    );
  }
}
