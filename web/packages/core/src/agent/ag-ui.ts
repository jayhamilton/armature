// The wire types between a host's assistant panel and `/api/agent/chat`.
//
// A hand-rolled subset of AG-UI's event envelope, matching the Java records in
// com.addf.backend.armature.agent.agui field for field. No official AG-UI Java SDK is published,
// so the backend emits plain JSON shaped like this rather than a dependency's wire format.

/** One server sent event from an assistant run. */
export type AgUiEvent =
  | { type: "RUN_STARTED"; threadId: string; runId: string }
  | { type: "RUN_FINISHED"; threadId: string; runId: string }
  | { type: "RUN_ERROR"; message: string }
  | { type: "TEXT_MESSAGE_START"; messageId: string }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TEXT_MESSAGE_END"; messageId: string }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string }
  | { type: "TOOL_CALL_END"; toolCallId: string }
  | { type: "CUSTOM"; name: string; value: unknown };

/** A property page as the gadget library describes it; only the parts the assistant reads. */
export interface AgentPropertyPage {
  displayName?: string;
  properties?: AgentProperty[];
}

/** One configurable property of a gadget. */
export interface AgentProperty {
  key: string;
  value?: unknown;
}

/**
 * The fields of a gadget the assistant needs, whether it is a library template or an instance on
 * a board. A host's own gadget type (for example `IGadget`) satisfies this structurally.
 */
export interface AgentGadget {
  componentType: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  instanceId?: number;
  propertyPages?: AgentPropertyPage[];
}

/** The fields of a board the assistant needs. */
export interface AgentBoard<G extends AgentGadget = AgentGadget> {
  id?: number;
  title?: string;
  rows?: { columns: { gadgets: G[] }[] }[];
}

export interface AgentGadgetLibraryEntry {
  componentType: string;
  title: string;
  subtitle?: string;
  description?: string;
  propertyPages?: AgentPropertyPage[];
}

export interface AgentBoardGadgetEntry {
  instanceId?: number;
  title: string;
  componentType: string;
}

/** The JSON body POSTed to `/api/agent/chat`. */
export interface AgentRequest {
  message: string;
  boardContext?: {
    boardId?: number;
    boardTitle?: string;
    activeTab?: string;
  };
  gadgetLibrary?: AgentGadgetLibraryEntry[];
  boardGadgets?: AgentBoardGadgetEntry[];
}

/** The value of a `CUSTOM` event named `ui-part`: something for the panel to show or do. */
export interface AgentUiPart {
  id: number;
  type: "text" | "component" | "iframe" | "mcp-app";
  text?: string;
  componentType?: string;
  payload?: unknown;
  title?: string;
  src?: string;
}

/** The name of the `CUSTOM` event that carries an {@link AgentUiPart}. */
export const UI_PART_EVENT = "ui-part";

/**
 * Reads a part's payload, which the backend sends as a JSON string (or, in tests, an object).
 * Returns undefined for a payload that is missing or not valid JSON.
 */
export function parsePayload(part: AgentUiPart): Record<string, unknown> | undefined {
  if (typeof part.payload !== "string") {
    return part.payload as Record<string, unknown> | undefined;
  }
  try {
    return JSON.parse(part.payload) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
