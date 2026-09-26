import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getArray, getBool } from '../common/gadget-common/gadget-base/gadget.helpers';
import { DEFAULT_CHART_COLORS } from '../common/gadget-common/chartColors';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';

const DEFAULT_DATA = [
  { name: 'Q1', value: 8940 },
  { name: 'Q2', value: 5000 },
  { name: 'Q3', value: 7200 },
  { name: 'Q4', value: 6100 },
];

/** Ported from armature-ui's PieChartComponent (ngx-charts-pie-chart -> Recharts PieChart). */
export function PieChart({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const chartData = getArray<{ name: string; value: number }[] | undefined>(gadget, 'chartData', undefined) ?? DEFAULT_DATA;
  const chartLegend = getBool(gadget, 'chartLegend');
  const chartShowLabels = getBool(gadget, 'chartShowLabels');
  const chartDoughnut = getBool(gadget, 'chartDoughnut');
  const chartExplodeSlices = getBool(gadget, 'chartExplodeSlices');

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="pie-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Tooltip />
          {chartLegend && <Legend />}
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={chartDoughnut ? '55%' : 0}
            outerRadius="80%"
            label={chartShowLabels}
            paddingAngle={chartExplodeSlices ? 4 : 0}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </GadgetCard>
  );
}
