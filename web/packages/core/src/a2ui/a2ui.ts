/**
 * One node of an A2UI component tree, matching `com.addf.backend.armature.agent.A2uiComponent`:
 * a generic catalog node (name, props, children), not a type per component kind. The catalog
 * grows only when a new kind is actually rendered; today that is Card, Text, and Button.
 */
export interface A2uiNode {
  component: "Card" | "Text" | "Button";
  props?: Record<string, unknown>;
  children?: A2uiNode[];
}
