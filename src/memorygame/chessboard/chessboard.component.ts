import { Component } from '@angular/core'
import { select } from '@angular-redux/store'
import { Observable } from 'rxjs/Observable'

import { GameActions } from '../../store/action'
import { ICard } from '../../store/interface'
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { STATUS } from "../../store/interface/status";
import { cardpick } from 'helper/array';

@Component({
  selector: 'chessboard',
  templateUrl: './chessboard.component.html',
  styleUrls: ['./chessboard.component.css']
})
export class ChessboardComponent {
  @select() cards$: Observable<ICard[]>

  aiCards: ICard[];
  knowCards: ICard[];
  pendingPair: Pair;
  pendingPair2: Pair;
  currentCard: ICard;
  flip1: boolean;
  pairsSolved: number;

  constructor(private actions: GameActions) { }

  trackByCards(index: number, card: ICard) {
    return card._id
  }

  async startAi() {
    console.log('ai started playing');
    this.knowCards = new Array<ICard>();
    this.pendingPair = null;
    this.pendingPair2 = null;
    this.flip1 = true;
    this.pairsSolved = 0;
    this.actions.updateStatus(STATUS.PLAYING);

    this.aiCards = await this.getCards(this.cards$);

    while (!this.checkDone()) {
      await this.delay(1500);
      if (this.flip1) {
        console.log('first flip');
        if (this.pendingPair2 == null) {
          console.log("getting random card");
          let card = this.getRandomCard();
          this.actions.flipCard(card);
          if (this.checkPair(card)) {
            console.log('pair found');
            this.pendingPair = this.getPair(card);
            this.pairsSolved++;
          }
          this.knowCards.push(card);
          this.currentCard = card;
        } else {
          console.log('flipping pair 2')
          this.actions.flipCard(this.pendingPair2.card1);
          await this.delay(1500);
          this.actions.flipCard(this.pendingPair2.card2);
          this.pendingPair2 = null;
          this.flip1 = false;
          this.pairsSolved++;
        }

        if (!this.checkDone) break;
      } else {
        console.log('second flip');
        if (this.pendingPair == null) {
          console.log('no pending pair');
          let card = this.getRandomCard();
          if (this.currentCard.url == card.url) {
            console.log('pair found accidentally');
            this.pairsSolved++;
          } else if (this.checkPair(card)) {
            console.log('pair found');
            this.pendingPair2 = new Pair();
            this.pendingPair2 = this.getPair(card);
          }
          this.knowCards.push(card);
          this.actions.flipCard(card);
        } else {
          if (this.pendingPair.card1.flipped) {
            this.actions.flipCard(this.pendingPair.card2);
          } else {
            this.actions.flipCard(this.pendingPair.card1);
          }
          this.pendingPair = null;
          console.log('Flipped done from pending 1');
          this.pairsSolved++;
        }
      }
      this.flip1 = !this.flip1;
    }

    this.actions.updateStatus(STATUS.PASS);

  }

  delay(time) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, time);
    });
  }

  getPair(card): Pair {
    let pair = new Pair();
    for (const kcard of this.knowCards) {
      if (kcard.url == card.url) {
        pair.card1 = kcard;
        pair.card2 = card;
        break;
      }
    }
    return pair;
  }

  checkPair(card: ICard) {
    let isPair: boolean = false;
    for (const kcards of this.knowCards) {
      if (kcards.url == card.url) {
        isPair = true;
        break;
      }
    }
    return isPair;
  }

  getRandomCard(): ICard {
    let filteredCards = this.aiCards.filter(c => this.knowCards.indexOf(c) == -1);
    filteredCards = filteredCards.filter(card => !card.flipped);
    return filteredCards[Math.floor(Math.random() * filteredCards.length)];
  }

  getCards(cards): Promise<ICard[]> {
    return new Promise((resolve, reject) => {
      cards.subscribe(c => resolve(c));
    });
  }

  checkDone(): boolean {
    let done: boolean = true;
    for (const card of this.aiCards) {
      if (!card.flipped) {
        done = false;
        break;
      }
    }
    return done;
  }

}

class Pair {
  card1: ICard;
  card2: ICard;
}
