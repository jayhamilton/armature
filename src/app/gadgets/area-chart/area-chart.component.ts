import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ScaleType, AreaChartModule } from '@swimlane/ngx-charts';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { curveBasis } from 'd3-shape';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';


export interface Color {
  name: string;
  selectable: boolean;
  group: ScaleType;
  domain: string[];
}
@Component({
    selector: 'app-area-chart',
    templateUrl: './area-chart.component.html',
    styleUrls: ['./area-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, AreaChartModule]
})
export class AreaChartComponent extends GadgetBase  implements OnInit {

  curveShape:any =  curveBasis;
  multi: any[] = [];
// options
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



colorScheme:Color = {
  domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
  name: '',
  selectable: false,
  group: ScaleType.Linear
};

  constructor(private eventService: EventService, private boardService: BoardService) {
    super();
  }

  view: any[] = [700, 300];

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
    const chartData = this.getArray<any[] | undefined>('chartData', undefined);
    if (chartData) {
      this.multi = chartData;
    } else {
      this.loadDefaultData();
    }
  }

  private loadDefaultData(): void {
    const defaultData = [
      {
        "name": "Series 1",
        "series": [
          {"name": "Monday", "value": 320},
          {"name": "Tuesday", "value": 730},
          {"name": "Wednesday", "value": 294}
        ]
      },
      {
        "name": "Series 2",
        "series": [
          {"name": "Monday", "value": 480},
          {"name": "Tuesday", "value": 300},
          {"name": "Wednesday", "value": 180}
        ]
      }
    ];
    this.multi = defaultData;
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
