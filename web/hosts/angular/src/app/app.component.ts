import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { ThemeService } from './theme/theme.service';
import { TUNE_TWO_RAIL_ICON_NAME, TUNE_TWO_RAIL_ICON_SVG } from './shared/icons/tune-two-rail.icon';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet]
})
export class AppComponent {
  title = 'armature';

  constructor(
    private themeService: ThemeService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
  ) {
    iconRegistry.addSvgIconLiteral(
      TUNE_TWO_RAIL_ICON_NAME,
      sanitizer.bypassSecurityTrustHtml(TUNE_TWO_RAIL_ICON_SVG),
    );
  }
}
