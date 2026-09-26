import { useMemo } from 'react';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Label,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getArray, getBool, getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import { DEFAULT_CHART_COLORS, reshapeMultiSeries, type IMultiSeries } from '../common/gadget-common/chartColors';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';

const DEFAULT_DATA: IMultiSeries[] = [
  {
    name: 'Series 1',
    series: [
      { name: 'Monday', value: 320 },
      { name: 'Tuesday', value: 730 },
      { name: 'Wednesday', value: 294 },
    ],
  },
  {
    name: 'Series 2',
    series: [
      { name: 'Monday', value: 480 },
      { name: 'Tuesday', value: 300 },
      { name: 'Wednesday', value: 180 },
    ],
  },
];

/** Ported from armature-ui's AreaChartComponent (ngx-charts-area-chart -> Recharts AreaChart). */
export function AreaChart({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const multi = getArray<IMultiSeries[] | undefined>(gadget, 'chartData', undefined) ?? DEFAULT_DATA;
  const data = useMemo(() => reshapeMultiSeries(multi), [multi]);

  const chartLegend = getBool(gadget, 'chartLegend');
  const chartShowXAxis = getBool(gadget, 'chartShowXAxis');
  const chartShowYAxis = getBool(gadget, 'chartShowYAxis');
  const chartShowXAxisLabel = getBool(gadget, 'chartShowXAxisLabel');
  const chartShowYAxisLabel = getBool(gadget, 'chartShowYAxisLabel');
  const chartXAxisLabel = getString(gadget, 'chartXAxisLabel', '');
  const chartYAxisLabel = getString(gadget, 'chartYAxisLabel', '');

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="area-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          {chartShowXAxis && (
            <XAxis dataKey="category">
              {chartShowXAxisLabel && <Label value={chartXAxisLabel} position="insideBottom" offset={-4} />}
            </XAxis>
          )}
          {chartShowYAxis && (
            <YAxis>
              {chartShowYAxisLabel && <Label value={chartYAxisLabel} angle={-90} position="insideLeft" />}
            </YAxis>
          )}
          <Tooltip />
          {chartLegend && <Legend />}
          {multi.map((series, index) => (
            <Area
              key={series.name}
              type="monotone"
              dataKey={series.name}
              stackId="1"
              stroke={DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
              fill={DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
              fillOpacity={0.5}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </GadgetCard>
  );
}
