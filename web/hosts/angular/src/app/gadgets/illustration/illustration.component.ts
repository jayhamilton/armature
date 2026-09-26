import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BoardService } from 'src/app/board/board.service';
import { EventService } from 'src/app/eventservice/event.service';
import { GadgetBase } from '../common/gadget-common/gadget-base/gadget.base';
import { MatCard, MatCardContent } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { GadgetHeaderComponent } from '../common/gadget-common/gadget-header/gadget-header.component';
import { illustrationSrc, IllustrationSize, ILLUSTRATION_SIZE_PX } from 'src/app/shared/illustrations/illustration-options';

// Standalone unDraw illustration gadget - for board decoration/empty-state
// framing rather than data display. See src/assets/images/illustrations/README.md
// for how illustration SVGs are added to the curated set this picks from.
@Component({
    selector: 'app-illustration-gadget',
    templateUrl: './illustration.component.html',
    styleUrls: ['./illustration.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, CdkDrag, GadgetHeaderComponent, MatCardContent]
})
export class IllustrationComponent extends GadgetBase implements OnInit {
  illustrationId: string = '';
  altText: string = '';
  caption: string = '';
  imageSrc: string | null = null;
  sizePx: number = ILLUSTRATION_SIZE_PX.medium;

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

  private loadProperties(): void {
    this.illustrationId = this.getString('illustration');
    this.altText = this.getString('altText');
    this.caption = this.getString('caption');
    this.imageSrc = this.illustrationId ? illustrationSrc(this.illustrationId) : null;
    const size = this.getString('size', 'medium') as IllustrationSize;
    this.sizePx = ILLUSTRATION_SIZE_PX[size] ?? ILLUSTRATION_SIZE_PX.medium;
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
