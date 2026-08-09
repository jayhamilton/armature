import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';

/** Trend direction derived from the configured change value. */
type TrendDirection = 'up' | 'down' | 'flat';

@Component({
    selector: 'app-statistic',
    templateUrl: './statistic.component.html',
    styleUrls: ['./statistic.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent, MatIcon]
})
export class StatisticComponent extends GadgetBase implements OnInit {
  statValue: string = '0';
  statLabel: string = '';
  statCaption: string = '';
  statIcon: string = 'insights';
  statTheme: string = 'brand';
  statChange: string = '';
  showIcon: boolean = true;

  constructor(private eventService: EventService, private boardService: BoardService) {
    super();
  }

  ngOnInit(): void {
    this.loadProperties();
  }

  override initializeConfiguration(gadgetData: any) {
    super.initializeConfiguration(gadgetData);
    this.loadProperties();
  }

  /**
   * A change of "+12.5%" / "-3" / "0" drives both the arrow and its color.
   * Anything non-numeric (e.g. "n/a") is shown as-is with no direction.
   */
  get trend(): TrendDirection {
    const numeric = parseFloat(this.statChange.replace(/[^0-9.\-+]/g, ''));
    if (isNaN(numeric) || numeric === 0) return 'flat';
    return numeric > 0 ? 'up' : 'down';
  }

  get trendIcon(): string {
    switch (this.trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  private loadProperties(): void {
    this.statValue = this.getString('statValue', this.statValue);
    this.statLabel = this.getString('statLabel');
    this.statCaption = this.getString('statCaption');
    this.statIcon = this.getString('statIcon', this.statIcon);
    this.statTheme = this.getString('statTheme', this.statTheme);
    this.statChange = this.getString('statChange');
    this.showIcon = this.getBool('showIcon', true);
  }

  remove() {
    this.eventService.emitGadgetDeleteEvent({ data: this.instanceId });
  }

  propertyChangeEvent(propertiesJSON: string) {
    this.mergePropertyValues(JSON.parse(propertiesJSON));
    this.loadProperties();
    this.boardService.savePropertyPageConfigurationToDestination(propertiesJSON, this.instanceId);
  }
}
