import { lazy } from 'react';
import type { GadgetComponent } from './common/gadget-common/gadget-base/gadget-component.types';

// Each entry is React.lazy() rather than a static import, so the bundler
// code-splits every gadget into its own chunk — a gadget type is only
// downloaded the first time a board actually needs to render one, same as
// the dynamic import() the Angular GADGET_REGISTRY used.
export const GADGET_REGISTRY: Record<string, React.LazyExoticComponent<GadgetComponent>> = {
  BarChartComponent: lazy(() =>
    import('./bar-chart/BarChart').then((m) => ({ default: m.BarChart }))
  ),
  AreaChartComponent: lazy(() =>
    import('./area-chart/AreaChart').then((m) => ({ default: m.AreaChart }))
  ),
  PieChartComponent: lazy(() =>
    import('./pie-chart/PieChart').then((m) => ({ default: m.PieChart }))
  ),
  BubbleChartComponent: lazy(() =>
    import('./bubble-chart/BubbleChart').then((m) => ({ default: m.BubbleChart }))
  ),
  NumberCardComponent: lazy(() =>
    import('./number-card/NumberCard').then((m) => ({ default: m.NumberCard }))
  ),
  LineChartComponent: lazy(() =>
    import('./line-chart/LineChart').then((m) => ({ default: m.LineChart }))
  ),
  TableComponent: lazy(() => import('./table/Table').then((m) => ({ default: m.Table }))),
  StatisticComponent: lazy(() =>
    import('./statistic/Statistic').then((m) => ({ default: m.Statistic }))
  ),
  TextComponent: lazy(() => import('./text/Text').then((m) => ({ default: m.Text }))),
  VideoComponent: lazy(() => import('./video/Video').then((m) => ({ default: m.Video }))),
  IllustrationComponent: lazy(() =>
    import('./illustration/Illustration').then((m) => ({ default: m.Illustration }))
  ),
};
