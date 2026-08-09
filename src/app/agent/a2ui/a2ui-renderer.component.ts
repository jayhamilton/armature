import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { A2uiNode } from './a2ui.model';

/**
 * Generic renderer for an A2UI component tree. Deliberately small - the catalog it
 * understands (Card/Text/Button) only grows when a real use case needs a new
 * component kind, matching the confirm/cancel gadget-suggestion card that's the
 * first thing to actually use it.
 */
@Component({
  selector: 'app-a2ui-renderer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, A2uiRendererComponent],
  template: `
    @switch (node?.component) {
      @case ('Card') {
        <div class="a2ui-card">
          @for (child of node?.children; track $index) {
            <app-a2ui-renderer [node]="child" (action)="action.emit($event)"></app-a2ui-renderer>
          }
        </div>
      }
      @case ('Text') {
        <p class="a2ui-text">{{ node?.props?.['text'] }}</p>
      }
      @case ('Button') {
        <button
          mat-button
          [color]="node?.props?.['tone'] === 'primary' ? 'primary' : undefined"
          (click)="action.emit(asString(node?.props?.['action']))"
        >
          {{ node?.props?.['label'] }}
        </button>
      }
    }
  `,
  styles: [
    `.a2ui-card { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }`,
    `.a2ui-text { margin: 0; }`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class A2uiRendererComponent {
  @Input() node?: A2uiNode;
  @Output() action = new EventEmitter<string>();

  asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
