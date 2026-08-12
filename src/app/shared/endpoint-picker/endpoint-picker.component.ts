import { Component, forwardRef, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { ITag } from '../../gadgets/common/gadget-common/gadget-base/gadget.model';
import { EndpointService } from '../../configuration/tab-endpoints/endpoint.service';
import { IEndpoint } from '../../configuration/tab-endpoints/endpoint.model';

// Stored as a gadget instance's dataSource property value. Not an endpoint
// id - see .work/specs/SPEC-73.md §2: this is the always-present fallback
// that keeps today's hand-edited JSON working exactly as it does now.
export const MANUAL_DATA_SOURCE = 'manual';

// Gadget-side picker: which endpoint (if any) this gadget instance should
// pull data from, filtered to endpoints whose tags intersect the gadget's
// own tags (passed in via gadgetTags), plus the permanent Manual option.
// Modeled directly on IllustrationPickerComponent (trigger button + menu),
// not split into a separate reusable "menu" sub-component the way
// Illustration's is, since this control has exactly one consumer
// (DynamicFormPropertyComponent's 'endpoint-picker' case) rather than two.
@Component({
    selector: 'app-endpoint-picker',
    templateUrl: './endpoint-picker.component.html',
    styleUrls: ['./endpoint-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EndpointPickerComponent),
            multi: true,
        },
    ],
    imports: [MatIcon, MatMenu, MatMenuTrigger, MatMenuItem, MatTooltip]
})
export class EndpointPickerComponent implements ControlValueAccessor, OnInit {
  @Input() gadgetTags: ITag[] = [];

  readonly manualValue = MANUAL_DATA_SOURCE;

  value: string = MANUAL_DATA_SOURCE;
  disabled = false;

  private allEndpoints: IEndpoint[] = [];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private endpointService: EndpointService) {}

  ngOnInit(): void {
    this.endpointService.getEndpoints().subscribe({
      next: (endpoints) => {
        this.allEndpoints = endpoints;
      },
      // No backend, or the route errors - degrade to "only Manual available"
      // rather than breaking the gadget's whole config form over it.
      error: () => {
        this.allEndpoints = [];
      },
    });
  }

  get eligibleEndpoints(): IEndpoint[] {
    const gadgetTagNames = new Set(this.gadgetTags.map((t) => t.name.toLowerCase()));
    if (gadgetTagNames.size === 0) return [];
    return this.allEndpoints.filter((endpoint) =>
      endpoint.tags.some((t) => gadgetTagNames.has(t.name.toLowerCase()))
    );
  }

  get selectedLabel(): string {
    if (this.value === MANUAL_DATA_SOURCE) return 'Manual';
    return this.allEndpoints.find((e) => e.id === this.value)?.name ?? 'Manual';
  }

  select(value: string): void {
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
  }

  menuClosed(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value = value || MANUAL_DATA_SOURCE;
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
