import { TypeRegistry } from "../type-registry.js";
import { parsePayload, type AgentGadget, type AgentUiPart } from "./ag-ui.js";
import {
  applyPropertyValues,
  findGadgetByTitle,
  type AgentActions,
  type BoardSummary,
  type GadgetMoveDirection,
} from "./agent-actions.js";

/**
 * A ui part after its resolver ran: the part plus what the panel needs to show it. Each resolver
 * fills in only its own fields. The names match the fields the Angular template already reads.
 */
export interface ResolvedPart<G extends AgentGadget = AgentGadget> extends AgentUiPart {
  gadgetPreview?: G;
  boardSummaries?: BoardSummary[];
  gadgetMoveTarget?: G;
  gadgetMoveQuery?: string;
  direction?: GadgetMoveDirection;
  moved?: boolean;
  gadgetRemoveTarget?: G;
  gadgetRemoveQuery?: string;
  removed?: boolean;
  rowAdded?: boolean;
  rowIndex?: number;
  rowStructure?: string;
  rowLayoutApplied?: boolean;
}

/** Resolves one kind of ui part: looks up what it refers to and, for most kinds, applies it. */
export type UiPartResolver = <G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
) => Promise<ResolvedPart<G>>;

interface AddGadgetPayload {
  gadgetComponentType?: string;
  propertyValues?: Record<string, unknown>;
}

/** The library template for the payload's gadget type, with the model's property values applied. */
async function previewGadget<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<G | undefined> {
  const payload = parsePayload(part) as AddGadgetPayload | undefined;
  if (!payload?.gadgetComponentType) return undefined;
  const definition = await actions.findGadgetDefinition(payload.gadgetComponentType);
  if (!definition) return undefined;
  // propertyValues comes from a second, schema constrained model call on the backend; when
  // present it replaces the template's placeholder content with real content.
  return payload.propertyValues ? applyPropertyValues(definition, payload.propertyValues) : definition;
}

/**
 * `gadget-suggestion`: adds the suggested gadget to the board straight away. The model only calls
 * `add_gadget` with a type from the library it was given, so the tool call is the confirmation.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveGadgetSuggestion<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  const gadgetPreview = await previewGadget(part, actions);
  if (gadgetPreview) {
    actions.addGadgetToBoard(gadgetPreview);
  }
  return { ...part, gadgetPreview };
}

/**
 * `a2ui-card`: previews a gadget and waits for the user to confirm on the card; nothing is added
 * here. Nothing produces this part today; it is kept for a future flow that needs a confirm step,
 * such as a destructive remove.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveA2uiCard<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  return { ...part, gadgetPreview: await previewGadget(part, actions) };
}

/**
 * `board-list`: the user's boards, for the card's Switch buttons.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveBoardList<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  return { ...part, boardSummaries: await actions.getBoardSummaries() };
}

/**
 * `gadget-move`: moves the first gadget whose title matches the query.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveGadgetMove<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  const payload = parsePayload(part) as { direction?: GadgetMoveDirection; gadgetQuery?: string } | undefined;
  const direction = payload?.direction;
  const gadgetMoveQuery = payload?.gadgetQuery ?? "";
  if (!direction) return { ...part };

  const gadgetMoveTarget = findGadgetByTitle(await actions.getSelectedBoard(), gadgetMoveQuery);
  if (gadgetMoveTarget?.instanceId !== undefined) {
    actions.moveGadget(gadgetMoveTarget.instanceId, direction);
  }
  return { ...part, gadgetMoveTarget, gadgetMoveQuery, direction, moved: !!gadgetMoveTarget };
}

/**
 * `gadget-remove`: removes the first gadget whose title matches the query.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveGadgetRemove<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  const payload = parsePayload(part) as { gadgetQuery?: string } | undefined;
  const gadgetRemoveQuery = payload?.gadgetQuery ?? "";

  const gadgetRemoveTarget = findGadgetByTitle(await actions.getSelectedBoard(), gadgetRemoveQuery);
  if (gadgetRemoveTarget?.instanceId !== undefined) {
    actions.removeGadget(gadgetRemoveTarget.instanceId);
  }
  return { ...part, gadgetRemoveTarget, gadgetRemoveQuery, removed: !!gadgetRemoveTarget };
}

/**
 * `row-add`: adds an empty row to the board.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveRowAdd<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  actions.addRow();
  return { ...part, rowAdded: true };
}

/**
 * `row-layout`: changes a row's column structure. The model is never told how many rows the board
 * has, so the row index is checked against the real board first.
 *
 * @pattern Strategy with registry
 * @role ConcreteStrategy
 * @principle Open/Closed: one part type, registered by its componentType.
 */
export async function resolveRowLayout<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
): Promise<ResolvedPart<G>> {
  const payload = parsePayload(part) as { rowIndex?: number; structure?: string } | undefined;
  const rowIndex = payload?.rowIndex;
  const structure = payload?.structure;
  if (rowIndex === undefined || !structure) return { ...part };

  const rowCount = (await actions.getSelectedBoard()).rows?.length ?? 0;
  const rowLayoutApplied = rowIndex >= 0 && rowIndex < rowCount;
  if (rowLayoutApplied) {
    actions.changeRowLayout(rowIndex, structure);
  }
  return { ...part, rowIndex, rowStructure: structure, rowLayoutApplied };
}

/**
 * The resolver for every ui part `componentType` the backend sends, in one registry.
 *
 * Pattern: Strategy with registry. Each resolver is a strategy for one `componentType`; the
 * registry selects it, replacing the `if` chain the Angular panel used to have.
 *
 * Principle: Open/Closed. A new part type is a new resolver and one `register` line here; the
 * panel and the other resolvers do not change.
 *
 * Why here: both hosts resolve parts the same way, so the logic lives in core and each host only
 * renders the result and implements {@link AgentActions}.
 *
 * How to extend: write `resolveYourPart(part, actions)` returning a {@link ResolvedPart} with any
 * new fields it needs, register it below under its `componentType`, add a test, and give each
 * host a card for it.
 *
 * See also: `docs/patterns/strategy-registry.md`, `TypeRegistry`.
 */
export function createUiPartResolvers(): TypeRegistry<UiPartResolver> {
  return new TypeRegistry<UiPartResolver>("ui part resolver")
    .register("gadget-suggestion", resolveGadgetSuggestion)
    .register("a2ui-card", resolveA2uiCard)
    .register("board-list", resolveBoardList)
    .register("gadget-move", resolveGadgetMove)
    .register("gadget-remove", resolveGadgetRemove)
    .register("row-add", resolveRowAdd)
    .register("row-layout", resolveRowLayout);
}

const defaultResolvers = createUiPartResolvers();

/**
 * Resolves a ui part with the resolver registered for its `componentType`. Parts with no resolver
 * (text, iframe, MCP app, or a component type this build does not know) come back unchanged, so
 * a newer backend never breaks an older panel.
 */
export async function resolveUiPart<G extends AgentGadget>(
  part: AgentUiPart,
  actions: AgentActions<G>,
  resolvers: TypeRegistry<UiPartResolver> = defaultResolvers,
): Promise<ResolvedPart<G>> {
  if (part.type !== "component" || !part.componentType) return { ...part };
  const resolution = resolvers.resolve(part.componentType);
  return resolution.found ? resolution.value(part, actions) : { ...part };
}
