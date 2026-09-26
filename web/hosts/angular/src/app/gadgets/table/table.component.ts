import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent]
})
export class TableComponent extends GadgetBase implements OnInit {
  rows: any[] = [];
  columns: string[] = [];

  showStriped: boolean = true;
  showDense: boolean = false;
  showRowNumbers: boolean = false;
  maxRows: number = 0;

  /** Explicit column list from configuration; blank means derive from data. */
  private configuredColumns: string = '';

  constructor(private eventService: EventService, private boardService: BoardService) {
    super();
  }

  ngOnInit(): void {
    this.loadTableProperties();
    this.loadTableData();
  }

  override initializeConfiguration(gadgetData: any) {
    super.initializeConfiguration(gadgetData);
    this.loadTableProperties();
    this.loadTableData();
  }

  get visibleRows(): any[] {
    return this.maxRows > 0 ? this.rows.slice(0, this.maxRows) : this.rows;
  }

  private loadTableProperties(): void {
    this.configuredColumns = this.getString('tableColumns', this.configuredColumns);
    this.showStriped = this.getBool('showStriped', true);
    this.showDense = this.getBool('showDense');
    this.showRowNumbers = this.getBool('showRowNumbers');
    this.maxRows = this.getNumber('maxRows', 0);
  }

  private loadTableData(): void {
    const data = this.getJson<any[] | undefined>('tableData', undefined);
    if (Array.isArray(data)) {
      this.rows = data;
    } else {
      if (data !== undefined) {
        console.error('Table gadget expects a JSON array of row objects.');
      }
      this.rows = [
        { Line: 'Line A', Output: 1240, Defects: 12, Status: 'Running' },
        { Line: 'Line B', Output: 980, Defects: 31, Status: 'Running' },
        { Line: 'Line C', Output: 0, Defects: 0, Status: 'Stopped' },
        { Line: 'Line D', Output: 1515, Defects: 4, Status: 'Running' }
      ];
    }
    this.resolveColumns();
  }

  private resolveColumns(): void {
    const explicit = this.configuredColumns
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (explicit.length > 0) {
      this.columns = explicit;
      return;
    }

    // Union of keys across all rows rather than just the first, so rows with
    // extra fields don't silently lose columns.
    const keys: string[] = [];
    this.rows.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => {
          if (!keys.includes(k)) keys.push(k);
        });
      }
    });
    this.columns = keys;
  }

  remove() {
    this.eventService.emitGadgetDeleteEvent({ data: this.instanceId });
  }

  propertyChangeEvent(propertiesJSON: string) {
    this.mergePropertyValues(JSON.parse(propertiesJSON));
    this.loadTableProperties();
    this.loadTableData();
    this.boardService.savePropertyPageConfigurationToDestination(propertiesJSON, this.instanceId);
  }
}
