import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
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
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';

const DEFAULT_COLORS = ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'];

interface FootballStat {
  name: string;
  value: number;
}

/** Ported from armature-ui's BarChartComponent (ngx-charts-bar-vertical -> Recharts BarChart). */
export function BarChart({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);
  const [fallbackStats, setFallbackStats] = useState<FootballStat[]>([]);

  const chartData = getArray<FootballStat[] | undefined>(gadget, 'chartData', undefined);

  // Falls back to the sample dataset (same as the Angular original's
  // assets/api/footballstats.json HttpClient call) when no chartData
  // property has been configured yet.
  useEffect(() => {
    if (chartData) return;
    fetch('/assets/api/footballstats.json')
      .then((res) => res.json())
      .then((data: { stats: FootballStat[] }) => setFallbackStats(data.stats));
  }, [chartData]);

  const footballstats = useMemo(() => {
    const source = chartData ?? fallbackStats;
    return [...source].sort((a, b) => b.value - a.value);
  }, [chartData, fallbackStats]);

  const chartLegend = getBool(gadget, 'chartLegend');
  const chartLegendTitle = getString(gadget, 'chartLegendTitle', '');
  const chartShowXAxis = getBool(gadget, 'chartShowXAxis');
  const chartShowYAxis = getBool(gadget, 'chartShowYAxis');
  const chartShowXAxisLabel = getBool(gadget, 'chartShowXAxisLabel');
  const chartShowYAxisLabel = getBool(gadget, 'chartShowYAxisLabel');
  const chartXAxisLabel = getString(gadget, 'chartXAxisLabel', '');
  const chartYAxisLabel = getString(gadget, 'chartYAxisLabel', '');
  const chartShowDataLabel = getBool(gadget, 'chartShowDataLabel');

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="bar-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={footballstats} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          {chartShowXAxis && (
            <XAxis dataKey="name">
              {chartShowXAxisLabel && <Label value={chartXAxisLabel} position="insideBottom" offset={-4} />}
            </XAxis>
          )}
          {chartShowYAxis && (
            <YAxis>
              {chartShowYAxisLabel && (
                <Label value={chartYAxisLabel} angle={-90} position="insideLeft" />
              )}
            </YAxis>
          )}
          <Tooltip />
          {chartLegend && <Legend {...(chartLegendTitle ? { formatter: () => chartLegendTitle } : {})} />}
          <Bar
            dataKey="value"
            label={chartShowDataLabel ? { position: 'top' } : undefined}
            radius={[4, 4, 0, 0]}
          >
            {footballstats.map((entry, index) => (
              <Cell key={entry.name} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </GadgetCard>
  );
}
