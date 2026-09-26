import { BehaviorSubject, type Observable } from 'rxjs';

// Ported from armature-ui's ThemeService, same localStorage key and
// document.body.classList toggle so global CSS (`.dark-theme ...` rules in
// src/index.css) keeps working unchanged.
class ThemeServiceImpl {
  private readonly THEME_KEY = 'isDarkTheme';

  private isDarkSubject = new BehaviorSubject<boolean>(this.getStoredPreference());
  isDark$: Observable<boolean> = this.isDarkSubject.asObservable();

  constructor() {
    this.applyTheme(this.isDarkSubject.value);
  }

  get isDark(): boolean {
    return this.isDarkSubject.value;
  }

  toggleTheme() {
    const next = !this.isDarkSubject.value;
    localStorage.setItem(this.THEME_KEY, JSON.stringify(next));
    this.isDarkSubject.next(next);
    this.applyTheme(next);
  }

  private getStoredPreference(): boolean {
    const stored = localStorage.getItem(this.THEME_KEY);
    return stored != null ? JSON.parse(stored) : false;
  }

  private applyTheme(isDark: boolean) {
    document.body.classList.toggle('dark-theme', isDark);
  }
}

export const themeService = new ThemeServiceImpl();
