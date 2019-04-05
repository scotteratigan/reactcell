import React, { Component } from "react";
import FreeCell from "./FreeCell";
import Foundation from "./Foundation";
import Cascade from "./Cascade";

const suits = ["♣", "♦", "♥", "♠"];

export default class GameArea extends Component {
  state = {
    cards: {},
    gameInProgress: false,
    cascade1: [],
    cascade2: [],
    cascade3: [],
    cascade4: [],
    cascade5: [],
    cascade6: [],
    cascade7: [],
    cascade8: [],
    freeCell1: null,
    freeCell2: null,
    freeCell3: null,
    freeCell4: null,
    finishedStackClubs: [],
    finishedStackDiamonds: [],
    finishedStackHearts: [],
    finishedStackSpades: [],
    selectedKey: null
  };

  generateCards = () => {
    const cards = {};
    suits.forEach(suit => {
      for (let i = 1; i <= 13; i++) {
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
      for (let i = 1; i <= 13; i++) {
        cardKeyArr.push({ suit, rank: i });
      }
    });
    const shuffledKeyArr = cardKeyArr
      .map(a => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1]);
    const cardsDealtOut = { ...this.state.cards }; // there's mutation here b/c obj of objs, but shouldn't matter
    shuffledKeyArr.forEach((card, i) => {
      const cascadeCol = (i % 8) + 1; // 1 - 8
      const positionInCascade = Math.floor(i / 8) + 1;
      const cardKey = card.rank + card.suit;
      cardsDealtOut[cardKey].location = "cascade";
      cardsDealtOut[cardKey].column = cascadeCol;
      cardsDealtOut[cardKey].position = positionInCascade;
    });
    const cascade1 = [];
    const cascade2 = [];
    const cascade3 = [];
    const cascade4 = [];
    const cascade5 = [];
    const cascade6 = [];
    const cascade7 = [];
    const cascade8 = [];
    for (const key in cardsDealtOut) {
      switch (cardsDealtOut[key].column) {
        case 1:
        default:
          cascade1.push(cardsDealtOut[key]);
          break;
        case 2:
          cascade2.push(cardsDealtOut[key]);
          break;
        case 3:
          cascade3.push(cardsDealtOut[key]);
          break;
        case 4:
          cascade4.push(cardsDealtOut[key]);
          break;
        case 5:
          cascade5.push(cardsDealtOut[key]);
          break;
        case 6:
          cascade6.push(cardsDealtOut[key]);
          break;
        case 7:
          cascade7.push(cardsDealtOut[key]);
          break;
        case 8:
          cascade8.push(cardsDealtOut[key]);
          break;
      }
    }
    this.setState({
      cards: cardsDealtOut,
      cascade1,
      cascade2,
      cascade3,
      cascade4,
      cascade5,
      cascade6,
      cascade7,
      cascade8
    });
  };

  selectCardFn = card => {
    const cards = { ...this.state.cards };
    let keyToSelect = card.rank + card.suit;
    const prevSelectedKey = this.state.selectedKey;
    // first, check to select if no card is selected:
    if (!prevSelectedKey) {
      cards[keyToSelect].selected = true;
      this.setState({ cards, selectedKey: keyToSelect });
      return;
    }
    // next, check for unselecting:
    if (keyToSelect === prevSelectedKey) {
      keyToSelect = null;
      cards[prevSelectedKey].selected = false;
      this.setState({ cards, selectedKey: keyToSelect });
      return;
    }
    // console.log("ok, if we get here, we have a potential move...");
    this.checkMoveIsLegal(prevSelectedKey, keyToSelect);
  };

  checkMoveIsLegal = (originKey, destKey) => {
    console.log("checking to move card", originKey, "to destination", destKey);
    // for now, assuming we've clicked on the top card
    const cards = { ...this.state.cards };
    const originCard = cards[originKey];
    const destCard = cards[destKey];
    if (originCard.rank + 1 !== destCard.rank) {
      console.log("Move illegal, rank doesn't match.");
    } else if (this.getCardColor(originCard) === this.getCardColor(destCard)) {
      console.log("Move illegal, colors are the same.");
    } else {
      console.log("Move should be legal (assuming top cards)");
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
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation1"
                location="foundation1"
                // cardSelected={this.state.cardSelected}
              />
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation2"
                location="foundation2"
                // cardSelected={this.state.cardSelected}
              />
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation3"
                location="foundation3"
                // cardSelected={this.state.cardSelected}
              />
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation4"
                location="foundation4"
                // cardSelected={this.state.cardSelected}
              />
            </div>
          </div>
          <div style={{ margin: 20 }}>
            <h4 style={{ textAlign: "center" }}>FreeCells</h4>
            <div style={{ display: "flex" }}>
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell1"
                location="freeCell1"
                // cardSelected={this.state.cardSelected}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell2"
                location="freeCell2"
                // cardSelected={this.state.cardSelected}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell3"
                location="freeCell3"
                // cardSelected={this.state.cardSelected}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell4"
                location="freeCell4"
                // cardSelected={this.state.cardSelected}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <Cascade
            className="Cascade"
            cards={this.state.cascade1}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade1"
            location="cascade1"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade2}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade2"
            location="cascade2"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade3}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade3"
            location="cascade3"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade4}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade4"
            location="cascade4"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade5}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade5"
            location="cascade5"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade6}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade6"
            location="cascade6"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade7}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade7"
            location="cascade7"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade8}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            // cardSelected={this.state.cardSelected}
            key="cascade8"
            location="cascade8"
          />
        </div>
      </div>
    );
  }
}
