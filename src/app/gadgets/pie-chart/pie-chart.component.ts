import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Color, ScaleType, PieChartModule } from '@swimlane/ngx-charts';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

@Component({
    selector: 'app-pie-chart',
    templateUrl: './pie-chart.component.html',
    styleUrls: ['./pie-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, PieChartModule]
})
export class PieChartComponent extends GadgetBase implements OnInit {
  chartData: any[] = [];

  colorScheme: Color = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
    name: '',
    selectable: false,
    group: ScaleType.Linear
  };

  chartLegend: boolean = false;
  chartLegendTitle: string = '';
  chartGradient: boolean = false;
  chartShowLabels: boolean = false;
  chartDoughnut: boolean = false;
  chartExplodeSlices: boolean = false;

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
    this.chartGradient = this.getBool('chartGradient');
    this.chartShowLabels = this.getBool('chartShowLabels');
    this.chartDoughnut = this.getBool('chartDoughnut');
    this.chartExplodeSlices = this.getBool('chartExplodeSlices');
  }

  private loadChartData(): void {
    const chartData = this.getArray<any[] | undefined>('chartData', undefined);
    this.chartData = chartData ?? [
      { name: 'Q1', value: 8940 },
      { name: 'Q2', value: 5000 },
      { name: 'Q3', value: 7200 },
      { name: 'Q4', value: 6100 }
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
