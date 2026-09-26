import { Component, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { IllustrationMenuComponent } from '../illustration-menu/illustration-menu.component';
import { IllustrationOption, illustrationSrc, ILLUSTRATION_OPTIONS } from '../illustration-options';

@Component({
    selector: 'app-illustration-picker',
    templateUrl: './illustration-picker.component.html',
    styleUrls: ['./illustration-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => IllustrationPickerComponent),
            multi: true,
        },
    ],
    imports: [MatIcon, MatMenu, MatMenuTrigger, MatTooltip, IllustrationMenuComponent]
})
export class IllustrationPickerComponent implements ControlValueAccessor {
  value: string = '';
  disabled = false;
  thumbnailBroken = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get selectedOption(): IllustrationOption | undefined {
    return ILLUSTRATION_OPTIONS.find((option) => option.id === this.value);
  }

  get thumbnailSrc(): string | null {
    return this.value ? illustrationSrc(this.value) : null;
  }

  onThumbnailError(): void {
    this.thumbnailBroken = true;
  }

  select(option: IllustrationOption): void {
    this.value = option.id;
    this.thumbnailBroken = false;
    this.onChange(this.value);
    this.onTouched();
  }

  menuClosed(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value = value || '';
    this.thumbnailBroken = false;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
