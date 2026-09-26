// The single color domain every armature-ui chart gadget's ngx-charts
// colorScheme used (Color.domain), ported as one shared array instead of
// repeating the literal in every chart component.
export const DEFAULT_CHART_COLORS = ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'];

export interface IMultiSeries {
  name: string;
  series: { name: string; value: number }[];
}

/**
 * Pivots ngx-charts' "multi" series shape
 * (`[{name, series: [{name, value}]}]`) into Recharts' flat row-per-category
 * shape (`[{category, [seriesName]: value, ...}]`), which is what
 * Recharts' <Area>/<Line> per-series dataKey expects.
 */
export function reshapeMultiSeries(multi: IMultiSeries[]): Record<string, string | number>[] {
  const categories = multi[0]?.series.map((point) => point.name) ?? [];
  return categories.map((category, index) => {
    const row: Record<string, string | number> = { category };
    multi.forEach((series) => {
      row[series.name] = series.series[index]?.value ?? 0;
    });
    return row;
  });
}
