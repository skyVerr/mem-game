import { Component, Output, EventEmitter } from '@angular/core'

@Component({
  selector: 'logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent {
  @Output() aiplay = new EventEmitter();

  aiOnClick() {
    this.aiplay.emit(null);
  }
}
