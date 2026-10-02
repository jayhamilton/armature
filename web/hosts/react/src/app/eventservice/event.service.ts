import { Subject, type Observable } from 'rxjs';

// Ported from armature-ui's EventService. The Angular original coalesced
// every emit into a microtask-scheduled appRef.tick() to work around
// zoneless change detection not auto-scheduling a re-render for a plain
// RxJS subscribe() callback. React has no such gap — a subscriber calling
// setState (see src/lib/useObservable.ts / useEventEffect.ts) always
// re-renders on its own — so that machinery is dropped here; the emit/
// listenFor API surface is otherwise unchanged so every consumer ports
// call-for-call.
export interface IEvent {
  data: any;
}

class EventServiceImpl {
  private boardCreateRequestSubject = new Subject<IEvent>();
  private boardUpdateNameDescriptionSubject = new Subject<IEvent>();
  private boardSelectedSubject = new Subject<IEvent>();

  private boardCreatedCompleteRequestSubject = new Subject<IEvent>();
  private boardDeleteRequestSubject = new Subject<IEvent>();
  private boardDeletedCompleteRequestSubject = new Subject<IEvent>();
  private sideNavClickEvent = new Subject<IEvent>();
  private sideLayoutSubject = new Subject<IEvent>();
  private addGadgetSubect = new Subject<IEvent>();
  private libraryMenuSubject = new Subject<IEvent>();
  private sideMenuLayoutSelectSubject = new Subject<IEvent>();
  private boardWidthChangeSubject = new Subject<IEvent>();
  private boardAddRowSubject = new Subject<IEvent>();
  private boardRemoveRowSubject = new Subject<IEvent>();
  private boardMoveRowSubject = new Subject<IEvent>();
  private boardRowsChangedSubject = new Subject<IEvent>();
  private gadgetPropertyChangeSubject = new Subject<IEvent>();
  private gadgetDeleteSubject = new Subject<IEvent>();
  private gadgetMoveRequestSubject = new Subject<IEvent>();
  private chartDataChangedSubject = new Subject<IEvent>();
  private openConfigPanelSubject = new Subject<IEvent>();
  private closeConfigPanelSubject = new Subject<IEvent>();
  private configPanelClosedSubject = new Subject<IEvent>();
  private closeLibraryPanelSubject = new Subject<IEvent>();
  private openHelpPanelSubject = new Subject<IEvent>();
  private closeHelpPanelSubject = new Subject<IEvent>();
  private openAgentPanelSubject = new Subject<IEvent>();
  private closeAgentPanelSubject = new Subject<IEvent>();

  private emptyEvent: IEvent = { data: {} };

  emitLibraryMenuOpenEvent() {
    this.libraryMenuSubject.next(this.emptyEvent);
  }
  listenForLibraryOpenMenuEvent(): Observable<IEvent> {
    return this.libraryMenuSubject.asObservable();
  }

  emitCloseLibraryPanelEvent() {
    this.closeLibraryPanelSubject.next(this.emptyEvent);
  }
  listenForCloseLibraryPanelEvent(): Observable<IEvent> {
    return this.closeLibraryPanelSubject.asObservable();
  }

  emitBoardMenuSideNavClickEvent() {
    this.sideNavClickEvent.next({ data: {} });
  }
  listenForBoardMenuSideNavClickEvent(): Observable<IEvent> {
    return this.sideNavClickEvent.asObservable();
  }

  emitBoardSelectedEvent(event: IEvent) {
    this.boardSelectedSubject.next(event);
  }
  listenForBoardSelectedEvent(): Observable<IEvent> {
    return this.boardSelectedSubject.asObservable();
  }

  emitBoardCreateRequestEvent(event: IEvent) {
    this.boardCreateRequestSubject.next(event);
  }
  emitBoardCreatedCompleteEvent(event: IEvent) {
    this.boardCreatedCompleteRequestSubject.next(event);
  }
  listenForBoardCreateRequestEvent(): Observable<IEvent> {
    return this.boardCreateRequestSubject.asObservable();
  }
  listenForBoardCreatedCompleteEvent(): Observable<IEvent> {
    return this.boardCreatedCompleteRequestSubject.asObservable();
  }

  emitBoardUpdateNameDescription(event: IEvent) {
    this.boardUpdateNameDescriptionSubject.next(event);
  }
  listenForBoardUpdateNameDescriptionRequestEvent(): Observable<IEvent> {
    return this.boardUpdateNameDescriptionSubject.asObservable();
  }

  emitBoardDeleteRequestEvent(event: IEvent) {
    this.boardDeleteRequestSubject.next(event);
  }
  emitBoardDeletedCompleteEvent(event: IEvent) {
    this.boardDeletedCompleteRequestSubject.next(event);
  }
  listenForBoardDeleteRequestEvent(): Observable<IEvent> {
    return this.boardDeleteRequestSubject.asObservable();
  }
  listenForBoardDeletedCompleteEvent(): Observable<IEvent> {
    return this.boardDeletedCompleteRequestSubject.asObservable();
  }

  emitLibraryAddGadgetEvent(event: IEvent) {
    this.addGadgetSubect.next(event);
  }
  listenForLibraryAddGadgetEvents(): Observable<IEvent> {
    return this.addGadgetSubect.asObservable();
  }

  emitGadgetDeleteEvent(event: IEvent) {
    this.gadgetDeleteSubject.next(event);
  }
  listenForGadgetDeleteEvent(): Observable<IEvent> {
    return this.gadgetDeleteSubject.asObservable();
  }

  emitGadgetMoveRequestEvent(event: IEvent) {
    this.gadgetMoveRequestSubject.next(event);
  }
  listenForGadgetMoveRequestEvent(): Observable<IEvent> {
    return this.gadgetMoveRequestSubject.asObservable();
  }

  emitBoardSideLayoutClickEvent() {
    this.sideLayoutSubject.next(this.emptyEvent);
  }
  listenForBoardSideLayoutEvent(): Observable<IEvent> {
    return this.sideLayoutSubject.asObservable();
  }

  emitBoardGadgetPropertyChangeEvent() {
    this.gadgetPropertyChangeSubject.next(this.emptyEvent);
  }
  listenForGadgetPropertyChangeEvents(): Observable<IEvent> {
    return this.gadgetPropertyChangeSubject.asObservable();
  }

  emitLayoutChange(event: IEvent) {
    this.sideMenuLayoutSelectSubject.next(event);
  }
  listenForLayoutChangeEvent(): Observable<IEvent> {
    return this.sideMenuLayoutSelectSubject.asObservable();
  }

  emitBoardWidthChangeEvent(event: IEvent) {
    this.boardWidthChangeSubject.next(event);
  }
  listenForBoardWidthChangeEvent(): Observable<IEvent> {
    return this.boardWidthChangeSubject.asObservable();
  }

  emitBoardAddRowEvent() {
    this.boardAddRowSubject.next(this.emptyEvent);
  }
  listenForBoardAddRowEvent(): Observable<IEvent> {
    return this.boardAddRowSubject.asObservable();
  }

  emitBoardRemoveRowEvent(event: IEvent) {
    this.boardRemoveRowSubject.next(event);
  }
  listenForBoardRemoveRowEvent(): Observable<IEvent> {
    return this.boardRemoveRowSubject.asObservable();
  }

  emitBoardMoveRowEvent(event: IEvent) {
    this.boardMoveRowSubject.next(event);
  }
  listenForBoardMoveRowEvent(): Observable<IEvent> {
    return this.boardMoveRowSubject.asObservable();
  }

  // Emitted by the board once a row add/remove/layout change has been
  // applied and saved. The layout panel owns no board state of its own, so
  // it uses this to re-read the board and refresh its row list.
  emitBoardRowsChangedEvent(event: IEvent) {
    this.boardRowsChangedSubject.next(event);
  }
  listenForBoardRowsChangedEvent(): Observable<IEvent> {
    return this.boardRowsChangedSubject.asObservable();
  }


  emitChartDataChanged(event: IEvent) {
    this.chartDataChangedSubject.next(event);
  }
  listenForChartDataChangedEvent(): Observable<IEvent> {
    return this.chartDataChangedSubject.asObservable();
  }

  emitOpenConfigPanelEvent(event: IEvent) {
    this.openConfigPanelSubject.next(event);
  }
  listenForOpenConfigPanelEvent(): Observable<IEvent> {
    return this.openConfigPanelSubject.asObservable();
  }

  emitCloseConfigPanelEvent() {
    this.closeConfigPanelSubject.next(this.emptyEvent);
  }
  listenForCloseConfigPanelEvent(): Observable<IEvent> {
    return this.closeConfigPanelSubject.asObservable();
  }

  // Fired once the config panel drawer has actually finished closing,
  // regardless of why (close button, backdrop click, escape key, or being
  // closed programmatically e.g. by opening another side panel) — the
  // single reliable signal for "this gadget instance is no longer being
  // configured", unlike emitCloseConfigPanelEvent which is only a request.
  emitConfigPanelClosedEvent(event: IEvent) {
    this.configPanelClosedSubject.next(event);
  }
  listenForConfigPanelClosedEvent(): Observable<IEvent> {
    return this.configPanelClosedSubject.asObservable();
  }

  emitOpenHelpPanelEvent(event: IEvent) {
    this.openHelpPanelSubject.next(event);
  }
  listenForOpenHelpPanelEvent(): Observable<IEvent> {
    return this.openHelpPanelSubject.asObservable();
  }

  emitCloseHelpPanelEvent() {
    this.closeHelpPanelSubject.next(this.emptyEvent);
  }
  listenForCloseHelpPanelEvent(): Observable<IEvent> {
    return this.closeHelpPanelSubject.asObservable();
  }

  emitOpenAgentPanelEvent() {
    this.openAgentPanelSubject.next(this.emptyEvent);
  }
  listenForOpenAgentPanelEvent(): Observable<IEvent> {
    return this.openAgentPanelSubject.asObservable();
  }

  emitCloseAgentPanelEvent() {
    this.closeAgentPanelSubject.next(this.emptyEvent);
  }
  listenForCloseAgentPanelEvent(): Observable<IEvent> {
    return this.closeAgentPanelSubject.asObservable();
  }
}

// Singleton, same role as Angular's providedIn: 'root' — one instance for
// the whole app. Import this directly instead of constructor injection.
export const eventService = new EventServiceImpl();
