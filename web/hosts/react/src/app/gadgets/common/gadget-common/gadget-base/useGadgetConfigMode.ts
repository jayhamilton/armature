import { useState } from 'react';
import { isMissingPropertyValue } from './gadget.helpers';
import type { IGadget } from './gadget.model';

/**
 * Ported from GadgetBase's `inConfig` field: initialized true when a
 * required property is still unset (initializeConfiguration ->
 * isMissingPropertyValue), so a freshly-added gadget opens straight into
 * configuration instead of rendering with empty data. Each gadget component
 * owns this itself and passes [inConfig, toggle] down to GadgetHeader,
 * matching the original's [inConfig] Input / (toggleConfigModeEvent) Output.
 */
export function useGadgetConfigMode(gadget: IGadget) {
  const [inConfig, setInConfig] = useState(() => isMissingPropertyValue(gadget));
  const toggle = () => setInConfig((value) => !value);
  return [inConfig, toggle] as const;
}
