import { useMemo } from 'react';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart as RechartsLineChart,
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
      { name: 'Mon', value: 320 },
      { name: 'Tue', value: 730 },
      { name: 'Wed', value: 294 },
      { name: 'Thu', value: 510 },
      { name: 'Fri', value: 420 },
    ],
  },
  {
    name: 'Series 2',
    series: [
      { name: 'Mon', value: 480 },
      { name: 'Tue', value: 300 },
      { name: 'Wed', value: 180 },
      { name: 'Thu', value: 390 },
      { name: 'Fri', value: 620 },
    ],
  },
];

/** Ported from armature-ui's LineChartComponent (ngx-charts-line-chart -> Recharts LineChart). */
export function LineChart({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
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
      helpTopic="line-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
            <Line
              key={series.name}
              type="monotone"
              dataKey={series.name}
              stroke={DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </GadgetCard>
  );
}
