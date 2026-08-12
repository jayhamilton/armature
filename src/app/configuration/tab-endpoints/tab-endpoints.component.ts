import { DataSource } from '@angular/cdk/table';
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, ReplaySubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatAutocomplete, MatAutocompleteTrigger, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChipGrid, MatChipRow, MatChipInput, MatChipRemove } from '@angular/material/chips';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { ITag } from 'src/app/gadgets/common/gadget-common/gadget-base/gadget.model';
import { GadgetTagOptionsService, GadgetTagOption } from 'src/app/shared/gadget-tags/gadget-tag-options.service';
import { EndpointService } from './endpoint.service';
import { ENDPOINT_AUTH_TYPES, IEndpoint, IEndpointWrite } from './endpoint.model';

@Component({
    selector: 'app-tab-endpoints',
    templateUrl: './tab-endpoints.component.html',
    styleUrls: ['./tab-endpoints.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        ReactiveFormsModule,
        MatFormField, MatLabel, MatHint, MatInput, MatSelect, MatOption, MatButton, MatIcon,
        MatAutocomplete, MatAutocompleteTrigger,
        MatChipGrid, MatChipRow, MatChipInput, MatChipRemove,
        MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
        MatIconButton, MatTooltip, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow,
    ]
})
export class TabEndpointsComponent {
  readonly authTypes = ENDPOINT_AUTH_TYPES;

  form: UntypedFormGroup;
  name = new UntypedFormControl('');
  address = new UntypedFormControl('');
  description = new UntypedFormControl('');
  authType = new UntypedFormControl('none');
  authHeaderName = new UntypedFormControl('');
  credentialUser = new UntypedFormControl('');
  credentialValue = new UntypedFormControl('');

  // Search/filter text for the tag autocomplete - deliberately not part of
  // `form` (it's not data the endpoint stores, just UI state for narrowing
  // the picker below).
  tagSearch = new UntypedFormControl('');

  @ViewChild('tagInputRef') tagInputRef?: ElementRef<HTMLInputElement>;

  tags: ITag[] = [];
  // The full "already available" vocabulary - every tag name currently used
  // by at least one gadget in the library, with which gadgets use it. Tags
  // are pick-only from this list (see selectTag()), not free-typed, so an
  // endpoint's tags can never fail to match any gadget through a typo.
  tagOptions: GadgetTagOption[] = [];

  displayedColumns: string[] = ['name', 'address', 'tags', 'tools'];
  dataSource = new EndpointDataSource([]);
  endpoints: IEndpoint[] = [];

  selectedId?: string;
  editMode = false;

  constructor(
    private endpointService: EndpointService,
    private tagOptionsService: GadgetTagOptionsService,
    private dialog: MatDialog,
    fb: UntypedFormBuilder
  ) {
    this.form = fb.group({
      name: this.name,
      address: this.address,
      description: this.description,
      authType: this.authType,
      authHeaderName: this.authHeaderName,
      credentialUser: this.credentialUser,
      credentialValue: this.credentialValue,
    });

    this.loadData();
    this.tagOptionsService.getTagOptions().subscribe((options) => {
      this.tagOptions = options;
    });
  }

  get filteredTagOptions(): GadgetTagOption[] {
    const term = (this.tagSearch.value || '').trim().toLowerCase();
    return this.tagOptions.filter(
      (option) =>
        !this.tags.some((t) => t.name.toLowerCase() === option.name) &&
        (!term || option.name.includes(term))
    );
  }

  get isBasicAuth(): boolean {
    return this.authType.value === 'basic';
  }

  get isHeaderAuth(): boolean {
    return this.authType.value === 'header';
  }

  get requiresCredential(): boolean {
    return this.authType.value !== 'none';
  }

  loadData() {
    this.endpointService.getEndpoints().subscribe({
      next: (endpoints) => {
        this.endpoints = endpoints;
        this.dataSource.setData(endpoints);
      },
      // Backend route isn't built yet (SPEC-73 is a frontend-only pass) -
      // fail quiet rather than surface a dead-endpoint error on every open
      // of this tab in the meantime.
      error: () => {
        this.endpoints = [];
        this.dataSource.setData([]);
      },
    });
  }

  // Tags are picked from the autocomplete panel only - there's no
  // (matChipInputTokenEnd) handler on the input, so typing text and
  // pressing Enter/comma without an actual selection does nothing. This is
  // what makes tag entry pick-only rather than free-form.
  selectTag(event: MatAutocompleteSelectedEvent): void {
    const name = event.option.value as string;
    if (!this.tags.some((t) => t.name.toLowerCase() === name)) {
      this.tags.push({ facet: '', name });
      this.form.markAsDirty();
    }
    this.tagSearch.setValue('');
    // Belt-and-suspenders alongside the FormControl reset above - see the
    // resetForm() comment on tagInputRef for why a direct DOM clear is here
    // too rather than relying solely on Angular's own view sync.
    if (this.tagInputRef) {
      this.tagInputRef.nativeElement.value = '';
    }
  }

  removeTag(tag: ITag): void {
    this.tags = this.tags.filter((t) => t !== tag);
    this.form.markAsDirty();
  }

  create() {
    if (this.editMode) {
      this.update();
      return;
    }

    const endpoint = this.buildWritePayload();
    this.endpointService.createEndpoint(endpoint).subscribe(() => {
      this.resetForm();
      this.loadData();
    });
  }

  update() {
    if (!this.selectedId) return;

    const endpoint = this.buildWritePayload();
    this.endpointService.updateEndpoint(this.selectedId, endpoint).subscribe(() => {
      this.editMode = false;
      this.resetForm();
      this.loadData();
    });
  }

  edit(item: IEndpoint) {
    this.name.setValue(item.name);
    this.address.setValue(item.address);
    this.description.setValue(item.description);
    this.authType.setValue(item.authType);
    this.authHeaderName.setValue(item.authHeaderName || '');
    this.credentialUser.setValue(item.credentialUser || '');
    // Never prefilled - the backend doesn't return a stored credential
    // value, so leaving this blank on edit means "keep the existing one".
    this.credentialValue.setValue('');
    this.tags = item.tags.map((t) => ({ ...t }));
    this.selectedId = item.id;
    this.editMode = true;
    this.form.markAsDirty();
  }

  delete(item: IEndpoint) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Endpoint',
        message: `Delete endpoint "${item.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.endpointService.deleteEndpoint(item.id).subscribe(() => this.loadData());
      }
    });
  }

  resetEditMode() {
    this.editMode = false;
    this.selectedId = undefined;
    this.resetForm();
  }

  resetForm() {
    this.form.reset({ authType: 'none' });
    this.tags = [];
    this.tagSearch.setValue('');
    // A previous version of this field synced via [(ngModel)] and its
    // model-to-view sync back to the native input's .value did not reliably
    // re-fire after this kind of programmatic reset, leaving stale text
    // visible even though the bound property was genuinely empty. Clearing
    // the DOM value directly avoids depending on that sync working.
    if (this.tagInputRef) {
      this.tagInputRef.nativeElement.value = '';
    }
  }

  private buildWritePayload(): IEndpointWrite {
    const payload: IEndpointWrite = {
      name: this.name.value,
      address: this.address.value,
      description: this.description.value,
      tags: this.tags,
      authType: this.authType.value,
    };
    if (this.isHeaderAuth) {
      payload.authHeaderName = this.authHeaderName.value;
    }
    if (this.isBasicAuth) {
      payload.credentialUser = this.credentialUser.value;
    }
    if (this.requiresCredential && this.credentialValue.value) {
      payload.credentialValue = this.credentialValue.value;
    }
    return payload;
  }
}

class EndpointDataSource extends DataSource<IEndpoint> {
  private _dataStream = new ReplaySubject<IEndpoint[]>();

  constructor(initialData: IEndpoint[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<IEndpoint[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: IEndpoint[]) {
    this._dataStream.next(data);
  }
}
