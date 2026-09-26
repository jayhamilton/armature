import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Color, ScaleType, BubbleChartModule } from '@swimlane/ngx-charts';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

@Component({
    selector: 'app-bubble-chart',
    templateUrl: './bubble-chart.component.html',
    styleUrls: ['./bubble-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, BubbleChartModule]
})
export class BubbleChartComponent extends GadgetBase implements OnInit {
  chartData: any[] = [];

  colorScheme: Color = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
    name: '',
    selectable: false,
    group: ScaleType.Linear
  };

  chartLegend: boolean = false;
  chartLegendTitle: string = '';
  chartShowXAxis: boolean = false;
  chartShowYAxis: boolean = false;
  chartShowXAxisLabel: boolean = false;
  chartShowYAxisLabel: boolean = false;
  chartXAxisLabel: string = '';
  chartYAxisLabel: string = '';
  chartMinRadius: number = 3;
  chartMaxRadius: number = 20;

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
    this.chartLegend = this.getBool('chartLegend');
    this.chartLegendTitle = this.getString('chartLegendTitle', this.chartLegendTitle);
    this.chartShowXAxis = this.getBool('chartShowXAxis');
    this.chartShowYAxis = this.getBool('chartShowYAxis');
    this.chartShowXAxisLabel = this.getBool('chartShowXAxisLabel');
    this.chartShowYAxisLabel = this.getBool('chartShowYAxisLabel');
    this.chartXAxisLabel = this.getString('chartXAxisLabel', this.chartXAxisLabel);
    this.chartYAxisLabel = this.getString('chartYAxisLabel', this.chartYAxisLabel);
    this.chartMinRadius = this.getNumber('chartMinRadius', 3);
    this.chartMaxRadius = this.getNumber('chartMaxRadius', 20);
  }

  private loadChartData(): void {
    const chartData = this.getArray<any[] | undefined>('chartData', undefined);
    this.chartData = chartData ?? [
      {
        name: 'Group A',
        series: [
          { name: 'Jan', x: 10, y: 20, r: 8 },
          { name: 'Feb', x: 30, y: 40, r: 15 },
          { name: 'Mar', x: 50, y: 25, r: 10 }
        ]
      },
      {
        name: 'Group B',
        series: [
          { name: 'Jan', x: 20, y: 50, r: 12 },
          { name: 'Feb', x: 45, y: 15, r: 6 },
          { name: 'Mar', x: 60, y: 35, r: 18 }
        ]
      }
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
