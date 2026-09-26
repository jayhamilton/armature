// Matches the shape of com.addf.backend.armature.agent.A2uiComponent on the backend:
// a generic component-catalog node (name, props, nested children), not a type per
// component kind. The catalog itself is small and grows only as new component kinds
// are actually rendered - today: "Card", "Text", "Button".
export interface A2uiNode {
  component: 'Card' | 'Text' | 'Button';
  props?: Record<string, unknown>;
  children?: A2uiNode[];
}
