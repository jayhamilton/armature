import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import { illustrationSrc, ILLUSTRATION_SIZE_PX, type IllustrationSize } from '../../shared/illustrations/illustration-options';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';
import './Illustration.css';

/** Ported from armature-ui's IllustrationComponent. */
export function Illustration({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const illustrationId = getString(gadget, 'illustration');
  const altText = getString(gadget, 'altText');
  const caption = getString(gadget, 'caption');
  const imageSrc = illustrationId ? illustrationSrc(illustrationId) : null;
  const size = getString(gadget, 'size', 'medium') as IllustrationSize;
  const sizePx = ILLUSTRATION_SIZE_PX[size] ?? ILLUSTRATION_SIZE_PX.medium;

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="illustration"
    >
      <div className="illustration-content">
        {imageSrc ? (
          <img src={imageSrc} alt={altText} style={{ width: sizePx, height: sizePx }} />
        ) : (
          <div className="illustration-empty">Choose an illustration in the gadget configuration.</div>
        )}
        {caption && <div className="illustration-caption">{caption}</div>}
      </div>
    </GadgetCard>
  );
}
