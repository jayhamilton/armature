import {
  CartesianGrid,
  Label,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getArray, getBool, getNumber, getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import { DEFAULT_CHART_COLORS } from '../common/gadget-common/chartColors';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';

interface IBubbleSeries {
  name: string;
  series: { name: string; x: number; y: number; r: number }[];
}

const DEFAULT_DATA: IBubbleSeries[] = [
  {
    name: 'Group A',
    series: [
      { name: 'Jan', x: 10, y: 20, r: 8 },
      { name: 'Feb', x: 30, y: 40, r: 15 },
      { name: 'Mar', x: 50, y: 25, r: 10 },
    ],
  },
  {
    name: 'Group B',
    series: [
      { name: 'Jan', x: 20, y: 50, r: 12 },
      { name: 'Feb', x: 45, y: 15, r: 6 },
      { name: 'Mar', x: 60, y: 35, r: 18 },
    ],
  },
];

/** Ported from armature-ui's BubbleChartComponent (ngx-charts-bubble-chart -> Recharts ScatterChart). */
export function BubbleChart({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const chartData = getArray<IBubbleSeries[] | undefined>(gadget, 'chartData', undefined) ?? DEFAULT_DATA;
  const chartLegend = getBool(gadget, 'chartLegend');
  const chartShowXAxis = getBool(gadget, 'chartShowXAxis');
  const chartShowYAxis = getBool(gadget, 'chartShowYAxis');
  const chartShowXAxisLabel = getBool(gadget, 'chartShowXAxisLabel');
  const chartShowYAxisLabel = getBool(gadget, 'chartShowYAxisLabel');
  const chartXAxisLabel = getString(gadget, 'chartXAxisLabel', '');
  const chartYAxisLabel = getString(gadget, 'chartYAxisLabel', '');
  const chartMinRadius = getNumber(gadget, 'chartMinRadius', 3);
  const chartMaxRadius = getNumber(gadget, 'chartMaxRadius', 20);

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="bubble-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          {chartShowXAxis && (
            <XAxis type="number" dataKey="x" name="x">
              {chartShowXAxisLabel && <Label value={chartXAxisLabel} position="insideBottom" offset={-4} />}
            </XAxis>
          )}
          {chartShowYAxis && (
            <YAxis type="number" dataKey="y" name="y">
              {chartShowYAxisLabel && <Label value={chartYAxisLabel} angle={-90} position="insideLeft" />}
            </YAxis>
          )}
          <ZAxis type="number" dataKey="r" range={[chartMinRadius * chartMinRadius, chartMaxRadius * chartMaxRadius]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          {chartLegend && <Legend />}
          {chartData.map((group, index) => (
            <Scatter
              key={group.name}
              name={group.name}
              data={group.series}
              fill={DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </GadgetCard>
  );
}
