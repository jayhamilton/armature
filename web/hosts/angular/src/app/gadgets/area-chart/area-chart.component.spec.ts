import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AreaChartComponent } from './area-chart.component';

describe('AreaChartComponent', () => {
  let component: AreaChartComponent;
  let fixture: ComponentFixture<AreaChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AreaChartComponent],
    // ngx-charts uses Angular animations; the app provides them in app.config.ts
    providers: [provideNoopAnimations()]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AreaChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
