import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Color, ScaleType, LineChartModule } from '@swimlane/ngx-charts';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { curveBasis } from 'd3-shape';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

@Component({
    selector: 'app-line-chart',
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, LineChartModule]
})
export class LineChartComponent extends GadgetBase implements OnInit {
  chartData: any[] = [];
  curveShape: any = curveBasis;

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
  chartGradient: boolean = false;
  chartTimeline: boolean = false;
  chartAnimations: boolean = false;

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
    this.chartGradient = this.getBool('chartGradient');
    this.chartTimeline = this.getBool('chartTimeline');
    this.chartAnimations = this.getBool('chartAnimations');
  }

  private loadChartData(): void {
    const chartData = this.getJson<any[] | undefined>('chartData', undefined);
    this.chartData = chartData ?? [
      {
        name: 'Series 1',
        series: [
          { name: 'Mon', value: 320 },
          { name: 'Tue', value: 730 },
          { name: 'Wed', value: 294 },
          { name: 'Thu', value: 510 },
          { name: 'Fri', value: 420 }
        ]
      },
      {
        name: 'Series 2',
        series: [
          { name: 'Mon', value: 480 },
          { name: 'Tue', value: 300 },
          { name: 'Wed', value: 180 },
          { name: 'Thu', value: 390 },
          { name: 'Fri', value: 620 }
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
