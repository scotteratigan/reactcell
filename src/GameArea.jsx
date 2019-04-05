import React, { Component } from "react";
import FreeCell from "./FreeCell";
import Foundation from "./Foundation";
import Cascade from "./Cascade";

export default class GameArea extends Component {
  state = {
    cards: [
      { rank: 1, suit: "♣" },
      { rank: 2, suit: "♣" },
      { rank: 3, suit: "♣" },
      { rank: 4, suit: "♣" },
      { rank: 5, suit: "♣" },
      { rank: 6, suit: "♣" },
      { rank: 7, suit: "♣" },
      { rank: 8, suit: "♣" },
      { rank: 9, suit: "♣" },
      { rank: 10, suit: "♣" },
      { rank: 11, suit: "♣" },
      { rank: 12, suit: "♣" },
      { rank: 13, suit: "♣" },
      { rank: 1, suit: "♦" },
      { rank: 2, suit: "♦" },
      { rank: 3, suit: "♦" },
      { rank: 4, suit: "♦" },
      { rank: 5, suit: "♦" },
      { rank: 6, suit: "♦" },
      { rank: 7, suit: "♦" },
      { rank: 8, suit: "♦" },
      { rank: 9, suit: "♦" },
      { rank: 10, suit: "♦" },
      { rank: 11, suit: "♦" },
      { rank: 12, suit: "♦" },
      { rank: 13, suit: "♦" },
      { rank: 1, suit: "♥" },
      { rank: 2, suit: "♥" },
      { rank: 3, suit: "♥" },
      { rank: 4, suit: "♥" },
      { rank: 5, suit: "♥" },
      { rank: 6, suit: "♥" },
      { rank: 7, suit: "♥" },
      { rank: 8, suit: "♥" },
      { rank: 9, suit: "♥" },
      { rank: 10, suit: "♥" },
      { rank: 11, suit: "♥" },
      { rank: 12, suit: "♥" },
      { rank: 13, suit: "♥" },
      { rank: 1, suit: "♠" },
      { rank: 2, suit: "♠" },
      { rank: 3, suit: "♠" },
      { rank: 4, suit: "♠" },
      { rank: 5, suit: "♠" },
      { rank: 6, suit: "♠" },
      { rank: 7, suit: "♠" },
      { rank: 8, suit: "♠" },
      { rank: 9, suit: "♠" },
      { rank: 10, suit: "♠" },
      { rank: 11, suit: "♠" },
      { rank: 12, suit: "♠" },
      { rank: 13, suit: "♠" }
    ],
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
    cardSelected: null
  };

  selectCardFn = card => {
    // search entire array for card... (not performant)
    // then mark the card selected
    // then if you click another card, you'd have to mark all previous cards unselected? damn that's a terrible solution

    // what if we just save the index of the selected card?
    // except the idea was we'd be moving cards between arrays
    // you could save the index of the card in the original array I suppose (if you keep a copy)

    // ok, back to the cards... change the starting condition somewhat
    // it's a single array of objects
    // cards are in stacks

    // implement in stacks? no, because unlike normal stacks you can move more than one card at a time

    // later, when you go to select a card, search each card above it to see if the card can legally be selected
    // to be legally selected, you can't select 'down' more than the number of free cells you have, + 1
    // also, each card above you must be 'stacked' as in alternating color and rank + 1

    // if there's already a card selected, determine if this is a de-selection, or an attempt to move

    if (this.state.cardSelected) {
      if (
        this.state.cardSelected.rank === card.rank &&
        this.state.cardSelected.suit === card.suit
      ) {
        // if we click the same card twice, unselect it.
        this.setState({ cardSelected: null });
      } else {
        alert("todo: calculate potential move");
      }
    } else {
      // if no card previously selected, select card
      this.setState({ cardSelected: card });
    }
  };

  shuffleCards = () => {
    const shuffledDeck = this.state.cards
      .map(a => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1]);
    const cascade1 = [];
    const cascade2 = [];
    const cascade3 = [];
    const cascade4 = [];
    const cascade5 = [];
    const cascade6 = [];
    const cascade7 = [];
    const cascade8 = [];
    shuffledDeck.forEach((card, i) => {
      switch (i % 8) {
        case 0:
          cascade1.push(card);
          break;
        case 1:
          cascade2.push(card);
          break;
        case 2:
          cascade3.push(card);
          break;
        case 3:
          cascade4.push(card);
          break;
        case 4:
          cascade5.push(card);
          break;
        case 5:
          cascade6.push(card);
          break;
        case 6:
          cascade7.push(card);
          break;
        case 7:
        default:
          cascade8.push(card);
          break;
      }
    });
    this.setState({
      // cards: shuffledDeck, <- new card order doesn't need to be saved
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

  render() {
    const cardWidth = 100;
    const cardHeight = Math.round(1.4 * cardWidth);
    return (
      <div style={{ backgroundColor: "green" }}>
        <button onClick={this.shuffleCards}>Shuffle Deck</button>
        <div style={{ display: "flex" }}>
          <div style={{ margin: 20 }}>
            <h4 style={{ textAlign: "center" }}>Foundations</h4>
            <div style={{ display: "flex" }}>
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation1"
                location="foundation1"
                cardSelected={this.state.cardSelected}
              />
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation2"
                location="foundation2"
                cardSelected={this.state.cardSelected}
              />
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation3"
                location="foundation3"
                cardSelected={this.state.cardSelected}
              />
              <Foundation
                width={cardWidth}
                height={cardHeight}
                key="foundation4"
                location="foundation4"
                cardSelected={this.state.cardSelected}
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
                cardSelected={this.state.cardSelected}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell2"
                location="freeCell2"
                cardSelected={this.state.cardSelected}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell3"
                location="freeCell3"
                cardSelected={this.state.cardSelected}
              />
              <FreeCell
                width={cardWidth}
                height={cardHeight}
                key="freeCell4"
                location="freeCell4"
                cardSelected={this.state.cardSelected}
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
            cardSelected={this.state.cardSelected}
            key="cascade1"
            location="cascade1"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade2}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade2"
            location="cascade2"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade3}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade3"
            location="cascade3"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade4}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade4"
            location="cascade4"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade5}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade5"
            location="cascade5"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade6}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade6"
            location="cascade6"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade7}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade7"
            location="cascade7"
          />
          <Cascade
            className="Cascade"
            cards={this.state.cascade8}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            selectCardFn={this.selectCardFn}
            cardSelected={this.state.cardSelected}
            key="cascade8"
            location="cascade8"
          />
        </div>
      </div>
    );
  }
}
