import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { BoardBannerComponent } from '../board-banner/board-banner.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MenuComponent, SidenavComponent, BoardBannerComponent]
})
export class HomeComponent implements OnInit {

  ngOnInit(): void {
  }

}
