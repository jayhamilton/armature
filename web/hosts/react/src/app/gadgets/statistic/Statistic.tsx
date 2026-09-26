import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getBool, getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import { MatIcon } from '../../shared/mat-icon/MatIcon';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';
import './Statistic.css';

type TrendDirection = 'up' | 'down' | 'flat';

function trendFor(statChange: string): TrendDirection {
  const numeric = parseFloat(statChange.replace(/[^0-9.\-+]/g, ''));
  if (isNaN(numeric) || numeric === 0) return 'flat';
  return numeric > 0 ? 'up' : 'down';
}

function trendIconFor(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'trending_up';
    case 'down':
      return 'trending_down';
    default:
      return 'trending_flat';
  }
}

/** Ported from armature-ui's StatisticComponent. */
export function Statistic({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const statValue = getString(gadget, 'statValue', '0');
  const statLabel = getString(gadget, 'statLabel');
  const statCaption = getString(gadget, 'statCaption');
  const statIcon = getString(gadget, 'statIcon', 'insights');
  const statTheme = getString(gadget, 'statTheme', 'brand');
  const statChange = getString(gadget, 'statChange');
  const showIcon = getBool(gadget, 'showIcon', true);

  const trend = trendFor(statChange);

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="statistic"
      contentHeight={160}
    >
      <div className="statistic" data-theme={statTheme}>
        {showIcon && (
          <div className="statistic-icon-wrap">
            <MatIcon className="statistic-icon">{statIcon}</MatIcon>
          </div>
        )}

        <div className="statistic-body">
          <div className="statistic-value">{statValue}</div>

          {statLabel && <div className="statistic-label">{statLabel}</div>}

          {statChange && (
            <div className="statistic-change" data-trend={trend}>
              <MatIcon className="statistic-trend-icon">{trendIconFor(trend)}</MatIcon>
              <span>{statChange}</span>
            </div>
          )}

          {statCaption && <div className="statistic-caption">{statCaption}</div>}
        </div>
      </div>
    </GadgetCard>
  );
}
