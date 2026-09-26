/**
 * Created by jayhamilton on 2/3/17.
 */
import { Injectable } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class PropertyControlService {
  constructor() {}

  toFormGroupFromPP(propertyPages: any[]) {
    const group: any = {};

    propertyPages.forEach((propertyPage) => {
      propertyPage.properties.forEach((property: any) => {
        if (property.controlType === 'section') return;
        let val = (property.value !== undefined && property.value !== null) ? property.value : '';
        // ace-editor is a string-only ControlValueAccessor, but some
        // properties (e.g. chartData) now declare a real array/object
        // schema and store a real array/object, not a JSON string -
        // stringify it just for display/editing.
        if (property.controlType === 'ace-editor' && typeof val !== 'string') {
          val = JSON.stringify(val, null, 2);
        }
        group[property.key] = property.required
          ? new UntypedFormControl(val, Validators.required)
          : new UntypedFormControl(val);
      });
    });

    return new UntypedFormGroup(group);
  }
}
