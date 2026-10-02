/**
 * Created by jayhamilton on 2/5/17.
 */
import { AfterContentInit, Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PropertyBase } from './property-base';

import { style, trigger, animate, transition } from '@angular/animations';
import { ITag } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import { MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';
import { AceEditorComponent } from './ace-editor/ace-editor.component';
import { JsonFormsEditorComponent } from './json-forms-editor/json-forms-editor.component';
import { MarkdownEditorComponent } from './markdown-editor/markdown-editor.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { IconPickerComponent } from '../shared/icon-picker/icon-picker.component';
import { IllustrationPickerComponent } from '../shared/illustrations/illustration-picker/illustration-picker.component';
import { EndpointPickerComponent } from '../shared/endpoint-picker/endpoint-picker.component';

@Component({
    selector: 'app-df-property',
    templateUrl: './dynamic-form-property.component.html',
    styleUrls: ['./styles-props.scss'],
    animations: [
        trigger('showHideAnimation', [
            transition(':enter', [
                // :enter is alias to 'void => *'
                style({ opacity: 0 }),
                animate(750, style({ opacity: 1 })),
            ]),
            transition(':leave', [
                // :leave is alias to '* => void'
                animate(750, style({ opacity: 0 })),
            ]),
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatSelect, MatOption, MatIcon, FileUploadComponent, MatDatepickerInput, MatHint, MatDatepickerToggle, MatSuffix, MatDatepicker, AceEditorComponent, JsonFormsEditorComponent, MarkdownEditorComponent, MatCheckbox, IconPickerComponent, IllustrationPickerComponent, EndpointPickerComponent]
})
export class DynamicFormPropertyComponent implements AfterContentInit {
  @Input() property: PropertyBase<any>;
  @Input() form: UntypedFormGroup;
  @Input() gadgetTags: ITag[];
  endPoints: string[] = [];

  colors:string[] = ['red', 'blue', 'orange', 'black', 'green'];


  get isValid() {
    return this.form.controls[this.property.key]?.valid ?? true;
  }

  constructor(formBuilder: UntypedFormBuilder) {
    this.property = {
      key: '',
      label: '',
      required: false,
      order: -1,
      controlType: '',
      options: []
    };
    this.gadgetTags = [];
    this.form = formBuilder.group({});
  }



  ngAfterContentInit() {

    switch (this.property.controlType) {

      case 'dropdown-ms':
      case 'dropdown':
        this.setDropDownOptions(this.property.key);
        break;
      default:
        { }
    }
  }

  setDropDownOptions(dropDownType: string) {

    let _options: { key: string, value: string }[] = [];

    // Whether this key's options come from a runtime data source below.
    // Keys that aren't listed supply their own static options in the
    // gadget's JSON definition (library.json) instead — overwriting those
    // with the empty list would silently leave the dropdown with no
    // choices, so leave them untouched.
    let dataDriven = true;

    switch (dropDownType) {

      case "color1":
      case "color2":
      case "color3":
        {
          this.colors.forEach(color=>{
            _options.push({key: color, value: color});
          })
        }
        break;
      default:
        dataDriven = false;
    }

    if (dataDriven) {
      this.property.options = _options;
    }
  }

  updateFileList(fileList: FileList) {
    console.log('Updating the file list!!!!');
    console.log(fileList);

    let fileNames = '';
    for (let x = 0; x < fileList.length; x++) {
      fileNames += fileList[x].name;
      if (x < fileList.length - 1) {
        fileNames += ', ';
      }
    }
    this.form.controls['file-list'].setValue(fileNames);
    this.form.controls['file-list'].markAsDirty();
  }
}
