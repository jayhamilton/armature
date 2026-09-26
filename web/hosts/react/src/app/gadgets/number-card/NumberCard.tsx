import { useMemo } from 'react';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getArray, getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';

const DEFAULT_COLORS = ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'];

/**
 * Ported from armature-ui's NumberCardComponent (ngx-charts-number-card).
 * Recharts has no direct equivalent of a "number card" tile grid — it's not
 * really a chart — so this reimplements it as a small tile layout instead
 * of forcing an ngx-charts-specific concept onto a charting library that
 * doesn't have one.
 */
export function NumberCard({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const chartData = useMemo(
    () =>
      getArray<{ name: string; value: number }[] | undefined>(gadget, 'chartData', undefined) ?? [
        { name: 'Revenue', value: 312000 },
        { name: 'Units', value: 1540 },
        { name: 'Customers', value: 248 },
        { name: 'Returns', value: 12 },
      ],
    [gadget]
  );

  const chartCardColor = getString(gadget, 'chartCardColor', '');
  const chartBandColor = getString(gadget, 'chartBandColor', '');
  const chartTextColor = getString(gadget, 'chartTextColor', '');

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="number-card"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(chartData.length || 1, 2)}, 1fr)`,
          gap: 12,
          height: '100%',
        }}
      >
        {chartData.map((item, index) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 6,
              padding: 12,
              minHeight: 0,
              background: chartCardColor || 'var(--app-brand-tint)',
              borderBottom: `4px solid ${chartBandColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}`,
              color: chartTextColor || 'inherit',
            }}
          >
            <div style={{ fontSize: '1.9rem', fontWeight: 600, lineHeight: 1.1 }}>
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: 4, textAlign: 'center' }}>
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </GadgetCard>
  );
}
