import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ILLUSTRATION_OPTIONS, IllustrationOption, illustrationSrc } from '../illustration-options';

// Presentational search+grid, shared by IllustrationPickerComponent (a form
// control) and the markdown editor's "Insert illustration" toolbar button
// (not a form control - just emits a pick and closes its own menu). Neither
// host cares about the grid's internals, only the emitted IllustrationOption.
@Component({
    selector: 'app-illustration-menu',
    templateUrl: './illustration-menu.component.html',
    styleUrls: ['./illustration-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, MatFormField, MatLabel, MatPrefix, MatInput, MatIcon, MatTooltip]
})
export class IllustrationMenuComponent {
  @Input() selected: string | null = null;
  @Output() pick = new EventEmitter<IllustrationOption>();

  readonly allIllustrations = ILLUSTRATION_OPTIONS;
  filterText = '';

  // SVGs are user-supplied (see assets/images/illustrations/README.md) and
  // may not have been downloaded yet - broken thumbnails fall back to a
  // placeholder rather than the browser's default broken-image icon.
  private brokenIds = new Set<string>();

  get filteredIllustrations(): IllustrationOption[] {
    const term = this.filterText.trim().toLowerCase();
    if (!term) return this.allIllustrations;
    return this.allIllustrations.filter(
      (option) => option.label.toLowerCase().includes(term) || option.id.includes(term)
    );
  }

  src(option: IllustrationOption): string {
    return illustrationSrc(option.id);
  }

  isBroken(option: IllustrationOption): boolean {
    return this.brokenIds.has(option.id);
  }

  onImageError(option: IllustrationOption): void {
    this.brokenIds.add(option.id);
  }

  select(option: IllustrationOption): void {
    this.pick.emit(option);
  }
}
