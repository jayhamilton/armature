import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AgentGadget, AgentUiPart } from "./ag-ui.js";
import { createUiPartResolvers, resolveUiPart } from "./ui-part-resolvers.js";
import { boardWith, FakeAgentActions } from "./fake-agent-actions.test-support.js";

const barChart: AgentGadget = {
  componentType: "BarChartComponent",
  title: "Bar Chart",
  subtitle: "Compare values",
  propertyPages: [{ properties: [{ key: "endpoint", value: "" }] }],
};
const salesOnBoard: AgentGadget = { componentType: "BarChartComponent", title: "Sales by region", instanceId: 41 };

const component = (componentType: string, payload?: unknown): AgentUiPart => ({
  id: 1,
  type: "component",
  componentType,
  payload: payload === undefined ? undefined : JSON.stringify(payload),
});

describe("ui part resolvers", () => {
  it("registers one resolver for every componentType the backend sends", () => {
    assert.deepEqual(createUiPartResolvers().types(), [
      "a2ui-card",
      "board-list",
      "gadget-move",
      "gadget-remove",
      "gadget-suggestion",
      "row-add",
      "row-layout",
    ]);
  });

  describe("gadget-suggestion", () => {
    it("adds the library gadget with the model's property values", async () => {
      const actions = new FakeAgentActions([barChart]);

      const part = await resolveUiPart(
        component("gadget-suggestion", {
          gadgetComponentType: "BarChartComponent",
          propertyValues: { title: "Sales", endpoint: "Plant API" },
        }),
        actions,
      );

      assert.equal(part.gadgetPreview?.title, "Sales");
      assert.equal(part.gadgetPreview?.propertyPages?.[0]?.properties?.[0]?.value, "Plant API");
      assert.deepEqual(actions.calls, [["addGadgetToBoard", part.gadgetPreview]]);
    });

    it("adds nothing for a type the library does not have", async () => {
      const actions = new FakeAgentActions([barChart]);

      const part = await resolveUiPart(component("gadget-suggestion", { gadgetComponentType: "Nope" }), actions);

      assert.equal(part.gadgetPreview, undefined);
      assert.deepEqual(actions.calls, []);
    });
  });

  it("a2ui-card previews the gadget but waits for the user to confirm", async () => {
    const actions = new FakeAgentActions([barChart]);

    const part = await resolveUiPart(component("a2ui-card", { gadgetComponentType: "BarChartComponent" }), actions);

    assert.equal(part.gadgetPreview?.title, "Bar Chart");
    assert.deepEqual(actions.calls, []);
  });

  it("board-list lists the user's boards", async () => {
    const boards = [{ id: 1, title: "Plant" }, { id: 2, title: "Sales" }];
    const actions = new FakeAgentActions([], boardWith(), boards);

    const part = await resolveUiPart(component("board-list"), actions);

    assert.deepEqual(part.boardSummaries, boards);
  });

  describe("gadget-move", () => {
    it("moves the gadget whose title matches the query", async () => {
      const actions = new FakeAgentActions([], boardWith(salesOnBoard));

      const part = await resolveUiPart(
        component("gadget-move", { direction: "right", gadgetQuery: "sales" }),
        actions,
      );

      assert.equal(part.moved, true);
      assert.equal(part.gadgetMoveTarget?.instanceId, 41);
      assert.deepEqual(actions.calls, [["moveGadget", 41, "right"]]);
    });

    it("moves nothing when no title matches, and keeps the query for the message", async () => {
      const actions = new FakeAgentActions([], boardWith(salesOnBoard));

      const part = await resolveUiPart(
        component("gadget-move", { direction: "left", gadgetQuery: "weather" }),
        actions,
      );

      assert.equal(part.moved, false);
      assert.equal(part.gadgetMoveQuery, "weather");
      assert.deepEqual(actions.calls, []);
    });
  });

  describe("gadget-remove", () => {
    it("removes the gadget whose title matches the query", async () => {
      const actions = new FakeAgentActions([], boardWith(salesOnBoard));

      const part = await resolveUiPart(component("gadget-remove", { gadgetQuery: "Sales" }), actions);

      assert.equal(part.removed, true);
      assert.deepEqual(actions.calls, [["removeGadget", 41]]);
    });

    it("removes nothing for an empty query", async () => {
      const actions = new FakeAgentActions([], boardWith(salesOnBoard));

      const part = await resolveUiPart(component("gadget-remove", { gadgetQuery: "  " }), actions);

      assert.equal(part.removed, false);
      assert.deepEqual(actions.calls, []);
    });
  });

  it("row-add adds a row", async () => {
    const actions = new FakeAgentActions();

    const part = await resolveUiPart(component("row-add"), actions);

    assert.equal(part.rowAdded, true);
    assert.deepEqual(actions.calls, [["addRow"]]);
  });

  describe("row-layout", () => {
    it("changes the layout of a row that exists", async () => {
      const actions = new FakeAgentActions([], boardWith());

      const part = await resolveUiPart(component("row-layout", { rowIndex: 0, structure: "three_col_equal" }), actions);

      assert.equal(part.rowLayoutApplied, true);
      assert.deepEqual(actions.calls, [["changeRowLayout", 0, "three_col_equal"]]);
    });

    it("changes nothing for a row index past the last row", async () => {
      const actions = new FakeAgentActions([], boardWith());

      const part = await resolveUiPart(component("row-layout", { rowIndex: 1, structure: "two_col_equal" }), actions);

      assert.equal(part.rowLayoutApplied, false);
      assert.equal(part.rowIndex, 1);
      assert.deepEqual(actions.calls, []);
    });

    it("changes nothing for a negative row index", async () => {
      const actions = new FakeAgentActions([], boardWith());

      const part = await resolveUiPart(component("row-layout", { rowIndex: -1, structure: "two_col_equal" }), actions);

      assert.equal(part.rowLayoutApplied, false);
      assert.deepEqual(actions.calls, []);
    });
  });

  it("returns parts with no resolver unchanged: text, MCP apps, and unknown component types", async () => {
    const actions = new FakeAgentActions();
    const parts: AgentUiPart[] = [
      { id: 1, type: "text", text: "hello" },
      { id: 2, type: "mcp-app", payload: '{"toolName":"board_summary"}' },
      component("something-newer"),
    ];

    for (const part of parts) {
      assert.deepEqual(await resolveUiPart(part, actions), part);
    }
    assert.deepEqual(actions.calls, []);
  });
});
