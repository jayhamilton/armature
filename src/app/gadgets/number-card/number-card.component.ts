import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Color, ScaleType, NumberCardModule } from '@swimlane/ngx-charts';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

@Component({
    selector: 'app-number-card',
    templateUrl: './number-card.component.html',
    styleUrls: ['./number-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, NumberCardModule]
})
export class NumberCardComponent extends GadgetBase implements OnInit {
  chartData: any[] = [];

  colorScheme: Color = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
    name: '',
    selectable: false,
    group: ScaleType.Linear
  };

  chartCardColor: string = '';
  chartBandColor: string = '';
  chartTextColor: string = '';

  constructor(private eventService: EventService, private boardService: BoardService) {
    super();
  }

  ngOnInit(): void {
    this.loadChartData();
    this.loadChartProperties();
  }

  override initializeConfiguration(gadgetData: any) {
    super.initializeConfiguration(gadgetData);
    this.loadChartData();
    this.loadChartProperties();
  }

  private loadChartProperties(): void {
    this.chartCardColor = this.getString('chartCardColor', this.chartCardColor);
    this.chartBandColor = this.getString('chartBandColor', this.chartBandColor);
    this.chartTextColor = this.getString('chartTextColor', this.chartTextColor);
  }

  private loadChartData(): void {
    const chartData = this.getArray<any[] | undefined>('chartData', undefined);
    this.chartData = chartData ?? [
      { name: 'Revenue', value: 312000 },
      { name: 'Units', value: 1540 },
      { name: 'Customers', value: 248 },
      { name: 'Returns', value: 12 }
    ];
  }

  remove() {
    this.eventService.emitGadgetDeleteEvent({ data: this.instanceId });
  }

  propertyChangeEvent(propertiesJSON: string) {
    this.mergePropertyValues(JSON.parse(propertiesJSON));
    this.loadChartData();
    this.loadChartProperties();
    this.boardService.savePropertyPageConfigurationToDestination(propertiesJSON, this.instanceId);
  }
}
