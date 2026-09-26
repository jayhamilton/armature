import { Suspense, useEffect, useRef, useState } from 'react';
import { animationService } from '../../animation/animation.service';
import { eventService } from '../../eventservice/event.service';
import { boardService } from '../../board/board.service';
import { mergePropertyValues } from '../common/gadget-common/gadget-base/gadget.helpers';
import type { IGadget } from '../common/gadget-common/gadget-base/gadget.model';
import { GADGET_REGISTRY } from '../gadget-registry';

/**
 * Ported from armature-ui's GadgetGridCellHostComponent. The Angular
 * version dynamically imported and `ViewContainerRef.createComponent()`d a
 * gadget class; React.lazy + Suspense (see gadget-registry.ts) already
 * gives the same code-split-per-gadget-type behavior declaratively, so this
 * host's remaining job is just: own the "live" gadget instance (so a
 * property-page save re-renders the gadget with fresh derived data without
 * a full board reload) and wire the remove/propertyChange callbacks every
 * gadget component expects.
 */
export function GadgetHost({ gadgetData }: { gadgetData: IGadget }) {
  const [liveGadget, setLiveGadget] = useState(gadgetData);
  const containerRef = useRef<HTMLDivElement>(null);

  // A different gadget instance was swapped into this host slot (e.g. board
  // reload) — reset local state rather than merging into the old one.
  useEffect(() => {
    setLiveGadget(gadgetData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gadgetData.instanceId]);

  useEffect(() => {
    animationService.gadgetEnter(containerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveGadget.instanceId]);

  const GadgetComponent = GADGET_REGISTRY[liveGadget.componentType];
  if (!GadgetComponent) return null;

  const handleRemove = () => {
    eventService.emitGadgetDeleteEvent({ data: liveGadget.instanceId });
  };

  const handlePropertyChange = (propertiesJSON: string) => {
    const updated = mergePropertyValues(liveGadget, JSON.parse(propertiesJSON));
    setLiveGadget(updated);
    boardService.savePropertyPageConfigurationToDestination(propertiesJSON, liveGadget.instanceId);
  };

  return (
    <div ref={containerRef} data-flip-id={liveGadget.instanceId}>
      <Suspense fallback={null}>
        <GadgetComponent
          gadget={liveGadget}
          onRemove={handleRemove}
          onPropertyChange={handlePropertyChange}
        />
      </Suspense>
    </div>
  );
}
