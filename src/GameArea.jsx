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
    freeCells: {
      freeCell1: null,
      freeCell2: null,
      freeCell3: null,
      freeCell4: null
    },
    foundations: {
      foundation1: [],
      foundation2: [],
      foundation3: [],
      foundation4: []
    },
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
    this.setState({ cards: cardsDealtOut }, () => {
      this.displayCards();
    });
    // const cascade1 = [];
    // const cascade2 = [];
    // const cascade3 = [];
    // const cascade4 = [];
    // const cascade5 = [];
    // const cascade6 = [];
    // const cascade7 = [];
    // const cascade8 = [];
    // for (const key in cardsDealtOut) {
    //   switch (cardsDealtOut[key].column) {
    //     case 1:
    //     default:
    //       cascade1.push(cardsDealtOut[key]);
    //       break;
    //     case 2:
    //       cascade2.push(cardsDealtOut[key]);
    //       break;
    //     case 3:
    //       cascade3.push(cardsDealtOut[key]);
    //       break;
    //     case 4:
    //       cascade4.push(cardsDealtOut[key]);
    //       break;
    //     case 5:
    //       cascade5.push(cardsDealtOut[key]);
    //       break;
    //     case 6:
    //       cascade6.push(cardsDealtOut[key]);
    //       break;
    //     case 7:
    //       cascade7.push(cardsDealtOut[key]);
    //       break;
    //     case 8:
    //       cascade8.push(cardsDealtOut[key]);
    //       break;
    //   }
    // }
    // this.setState({
    //   cards: cardsDealtOut,
    //   cascade1,
    //   cascade2,
    //   cascade3,
    //   cascade4,
    //   cascade5,
    //   cascade6,
    //   cascade7,
    //   cascade8
    // });
  };

  displayCards = () => {
    const cards = { ...this.state.cards };
    const cascade1 = [];
    const cascade2 = [];
    const cascade3 = [];
    const cascade4 = [];
    const cascade5 = [];
    const cascade6 = [];
    const cascade7 = [];
    const cascade8 = [];
    const foundations = {
      foundation1: [],
      foundation2: [],
      foundation3: [],
      foundation4: []
    };
    const freeCells = {
      freeCell1: null,
      freeCell2: null,
      freeCell3: null,
      freeCell4: null
    };
    for (const key in cards) {
      if (cards[key].location === "cascade") {
        switch (cards[key].column) {
          case 1:
          default:
            cascade1[cards[key].position] = cards[key];
            break;
          case 2:
            // cascade2.push(cards[key]);
            cascade2[cards[key].position] = cards[key];
            break;
          case 3:
            cascade3[cards[key].position] = cards[key];
            break;
          case 4:
            cascade4[cards[key].position] = cards[key];
            break;
          case 5:
            cascade5[cards[key].position] = cards[key];
            break;
          case 6:
            cascade6[cards[key].position] = cards[key];
            break;
          case 7:
            cascade7[cards[key].position] = cards[key];
            break;
          case 8:
            cascade8[cards[key].position] = cards[key];
            break;
        }
      } else if (cards[key].location === "foundation") {
        console.log("inside foundation elseif, cards[key]:", cards[key]);
        // add cards to foundations[foundationx] array in position equal to their rank
        // so ace in col 3 would be foundations[foundation3].1 = selectedCard;
        foundations["foundation" + cards[key].column][cards[key].rank] =
          cards[key];
      } else if (cards[key].location === "freeCell") {
        freeCells["freeCell" + cards[key].column] = cards[key];
        // there can be only 1 per cell
      }
    }

    this.setState({
      cards,
      cascade1,
      cascade2,
      cascade3,
      cascade4,
      cascade5,
      cascade6,
      cascade7,
      cascade8,
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
              <Foundation
                height={cardHeight}
                width={cardWidth}
                key="foundation1"
                location="foundation1"
                selectCardFn={this.selectCardFn}
                cards={this.state.foundations.foundation1}
              />
              <Foundation
                height={cardHeight}
                width={cardWidth}
                key="foundation2"
                location="foundation2"
                selectCardFn={this.selectCardFn}
                cards={this.state.foundations.foundation2}
              />
              <Foundation
                height={cardHeight}
                width={cardWidth}
                key="foundation3"
                location="foundation3"
                selectCardFn={this.selectCardFn}
                cards={this.state.foundations.foundation3}
              />
              <Foundation
                height={cardHeight}
                width={cardWidth}
                key="foundation4"
                location="foundation4"
                selectCardFn={this.selectCardFn}
                cards={this.state.foundations.foundation4}
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
                selectCardFn={this.selectCardFn}
                card={this.state.freeCells.freeCell1}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell2"
                location="freeCell2"
                selectCardFn={this.selectCardFn}
                card={this.state.freeCells.freeCell2}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell3"
                location="freeCell3"
                selectCardFn={this.selectCardFn}
                card={this.state.freeCells.freeCell3}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell4"
                location="freeCell4"
                selectCardFn={this.selectCardFn}
                card={this.state.freeCells.freeCell4}
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
            key="cascade1"
            location="cascade1"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade2}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade2"
            location="cascade2"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade3}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade3"
            location="cascade3"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade4}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade4"
            location="cascade4"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade5}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade5"
            location="cascade5"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade6}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade6"
            location="cascade6"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade7}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade7"
            location="cascade7"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade8}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            key="cascade8"
            location="cascade8"
          />
        </div>
      </div>
    );
  }
}
