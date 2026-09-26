import { BehaviorSubject, type Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Holds application-level (not board-level) configuration. Currently just
 * the application title shown in the toolbar.
 *
 * Follows the same conventions as ThemeService: a BehaviorSubject so
 * subscribers get the current value on subscribe, persisted to
 * localStorage under a plain string key. environment.applicationTitle is
 * the default when nothing has been saved yet.
 */
class AppConfigServiceImpl {
  private readonly APP_TITLE_KEY = 'applicationTitle';
  private readonly CARD_TRANSPARENT_KEY = 'cardBackgroundTransparent';
  private readonly LIBRARY_COLLAPSED_KEY = 'libraryPanelCollapsed';

  private appTitleSubject = new BehaviorSubject<string>(this.getStoredTitle());
  appTitle$: Observable<string> = this.appTitleSubject.asObservable();

  private cardBackgroundTransparentSubject = new BehaviorSubject<boolean>(
    this.getStoredCardBackgroundTransparent()
  );
  cardBackgroundTransparent$: Observable<boolean> =
    this.cardBackgroundTransparentSubject.asObservable();

  private libraryPanelCollapsedSubject = new BehaviorSubject<boolean>(
    this.getStoredLibraryPanelCollapsed()
  );
  libraryPanelCollapsed$: Observable<boolean> = this.libraryPanelCollapsedSubject.asObservable();

  constructor() {
    this.applyCardBackgroundTransparent(this.cardBackgroundTransparentSubject.value);
  }

  get appTitle(): string {
    return this.appTitleSubject.value;
  }

  setAppTitle(title: string) {
    const next = (title || '').trim() || environment.applicationTitle;
    localStorage.setItem(this.APP_TITLE_KEY, next);
    this.appTitleSubject.next(next);
  }

  resetAppTitle() {
    localStorage.removeItem(this.APP_TITLE_KEY);
    this.appTitleSubject.next(environment.applicationTitle);
  }

  get cardBackgroundTransparent(): boolean {
    return this.cardBackgroundTransparentSubject.value;
  }

  setCardBackgroundTransparent(value: boolean) {
    localStorage.setItem(this.CARD_TRANSPARENT_KEY, JSON.stringify(value));
    this.cardBackgroundTransparentSubject.next(value);
    this.applyCardBackgroundTransparent(value);
  }

  get libraryPanelCollapsed(): boolean {
    return this.libraryPanelCollapsedSubject.value;
  }

  setLibraryPanelCollapsed(value: boolean) {
    localStorage.setItem(this.LIBRARY_COLLAPSED_KEY, JSON.stringify(value));
    this.libraryPanelCollapsedSubject.next(value);
  }

  toggleLibraryPanelCollapsed() {
    this.setLibraryPanelCollapsed(!this.libraryPanelCollapsed);
  }

  private getStoredTitle(): string {
    const stored = localStorage.getItem(this.APP_TITLE_KEY);
    return stored != null && stored.trim() !== '' ? stored : environment.applicationTitle;
  }

  private getStoredCardBackgroundTransparent(): boolean {
    const stored = localStorage.getItem(this.CARD_TRANSPARENT_KEY);
    return stored != null ? JSON.parse(stored) : false;
  }

  private getStoredLibraryPanelCollapsed(): boolean {
    const stored = localStorage.getItem(this.LIBRARY_COLLAPSED_KEY);
    return stored != null ? JSON.parse(stored) : false;
  }

  // Toggled on <body>, same pattern as ThemeService's dark-theme class.
  private applyCardBackgroundTransparent(value: boolean) {
    document.body.classList.toggle('transparent-cards', value);
  }
}

export const appConfigService = new AppConfigServiceImpl();
