import { AfterViewInit, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Color, ScaleType, BarChartModule } from '@swimlane/ngx-charts';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { HttpClient } from '@angular/common/http';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

export interface footballstatsInterface {
  stats: any[];
}

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, BarChartModule]
})
export class BarChartComponent extends GadgetBase implements AfterViewInit, OnInit {
  footballstats: any[] = [];

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
  chartRoundEdges: boolean = false;
  chartShowDataLabel: boolean = false;

  constructor(private eventService: EventService, private boardService: BoardService, private restClient: HttpClient) {
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

  ngAfterViewInit(): void {}

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
    this.chartRoundEdges = this.getBool('chartRoundEdges');
    this.chartShowDataLabel = this.getBool('chartShowDataLabel');
  }

  private loadChartData(): void {
    const chartData = this.getJson<any[] | undefined>('chartData', undefined);
    if (chartData) {
      this.footballstats = chartData;
      this.footballstats.sort((a, b) => b.value - a.value);
      return;
    }

    this.restClient.get<footballstatsInterface>('assets/api/footballstats.json').subscribe(data => {
      this.footballstats = data.stats;
      this.footballstats.sort((a, b) => b.value - a.value);
    });
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

  getFootballStats() {
    return this.restClient.get<footballstatsInterface>('assets/api/footballstats.json');
  }
}
