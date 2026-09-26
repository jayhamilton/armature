import type { IGadget } from './gadget.model';

/**
 * Props every gadget component (NumberCard, BarChart, Table, ...) receives
 * from GadgetHost. Replaces Angular's GadgetBase abstract class + the
 * host's `createComponent().instance.initializeConfiguration(data)` call —
 * here the host just passes props down instead.
 */
export interface GadgetComponentProps {
  gadget: IGadget;
  /** Board-side padding preset context isn't needed by gadgets themselves. */
  onRemove: () => void;
  /** propertiesJSON matches the shape the dynamic form / config panel emits. */
  onPropertyChange: (propertiesJSON: string) => void;
}

export type GadgetComponent = (props: GadgetComponentProps) => React.JSX.Element;
