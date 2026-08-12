import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  ChangeDetectionStrategy
} from '@angular/core';
import { EventService } from '../eventservice/event.service';
import { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import { LibraryService } from './library.service';
import { AppConfigService } from '../app-config/app-config.service';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { NgStyle } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-library',
    templateUrl: './library.component.html',
    styleUrls: ['./library.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, MatCard, NgStyle, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatIcon, MatIconButton, MatTooltip]
})
export class LibraryComponent implements OnInit, AfterViewInit, OnDestroy {
  // QueryList rather than a single @ViewChild: the virtual-scroll viewport only
  // exists in the DOM in the expanded (non-collapsed) template branch, so it's
  // created and destroyed as the panel toggles, not just once at startup - see
  // observeViewport() below for why that matters.
  @ViewChildren(CdkVirtualScrollViewport) viewportQuery!: QueryList<CdkVirtualScrollViewport>;
  private resizeObserver?: ResizeObserver;
  private viewportQuerySub?: Subscription;
  private collapsedSub?: Subscription;
  collapsed = false;
  colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD', '#E74C3C',
    '#3498DB', '#2ECC71', '#1ABC9C', '#9B59B6', '#34495E', '#16A085',
    '#F39C12', '#D35400', '#C0392B', '#7F8C8D', '#BDC3C7', '#95A5A6',
    '#2980B9', '#27AE60', '#8E44AD', '#2C3E50', '#F4D03F', '#E67E22',
    '#D35400', '#1ABC9C', '#2ECC71', '#E74C3C', '#9B59B6', '#34495E'
  ];

  constructor(
    private libraryService: LibraryService,
    private eventService: EventService,
    private appConfigService: AppConfigService
  ) {}

  library!: IGadget[];
  ngOnInit(): void {
    this.getLibrary();
    this.collapsedSub = this.appConfigService.libraryPanelCollapsed$.subscribe((value) => {
      this.collapsed = value;
    });
  }

  ngAfterViewInit(): void {
    this.observeViewport();
    // The viewport only exists while the panel is expanded, so it's created
    // fresh (as a new element) each time the panel toggles out of collapsed
    // mode - re-attach the resize observer whenever that happens, not just
    // once at startup, or expanding a panel that started collapsed would
    // silently lose this workaround.
    this.viewportQuerySub = this.viewportQuery.changes.subscribe(() => this.observeViewport());
  }

  /**
   * CdkVirtualScrollViewport measures its container once when it's created.
   * This panel lives inside a mat-drawer that animates open from 0 width, so
   * that initial measurement is stale/undersized — it silently renders only
   * enough items to fill that small initial size (e.g. 2 of 6) even though
   * there's plenty of room once the drawer finishes opening. Re-measure
   * whenever the panel's actual size changes.
   */
  private observeViewport(): void {
    this.resizeObserver?.disconnect();
    const viewport = this.viewportQuery.first;
    if (!viewport) return;
    this.resizeObserver = new ResizeObserver(() => {
      viewport.checkViewportSize();
    });
    this.resizeObserver.observe(viewport.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.viewportQuerySub?.unsubscribe();
    this.collapsedSub?.unsubscribe();
  }

  getLibrary() {
    this.libraryService.getLibrary().subscribe((libraryData) => {
      this.library = [...libraryData].sort((a, b) => a.title.localeCompare(b.title));
    });
  }

  private lastAddTime = 0;

  addGadget(gadgetData: IGadget) {
    const now = Date.now();
    if (now - this.lastAddTime < 1000) return;
    this.lastAddTime = now;
    this.eventService.emitLibraryAddGadgetEvent({ data: gadgetData });
  }

  close() {
    this.eventService.emitCloseLibraryPanelEvent();
  }

  toggleCollapsed() {
    this.appConfigService.toggleLibraryPanelCollapsed();
  }
}
