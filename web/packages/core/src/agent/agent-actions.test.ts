import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AgentGadget } from "./ag-ui.js";
import { applyPropertyValues, findGadgetByTitle } from "./agent-actions.js";
import { buildAgentRequest } from "./build-agent-request.js";
import { boardWith } from "./fake-agent-actions.test-support.js";

const template: AgentGadget = {
  componentType: "TextComponent",
  title: "Text",
  subtitle: "Markdown",
  propertyPages: [
    { displayName: "Run", properties: [{ key: "markdown", value: "placeholder" }, { key: "align", value: "left" }] },
  ],
};

describe("applyPropertyValues", () => {
  it("sets matching property values, title, and subtitle on a copy", () => {
    const merged = applyPropertyValues(template, { markdown: "# Shift", title: "Notes", subtitle: "Today", other: 1 });

    assert.equal(merged.title, "Notes");
    assert.equal(merged.subtitle, "Today");
    assert.deepEqual(merged.propertyPages?.[0]?.properties, [
      { key: "markdown", value: "# Shift" },
      { key: "align", value: "left" },
    ]);
  });

  it("leaves the template unchanged", () => {
    applyPropertyValues(template, { markdown: "changed", title: "changed" });

    assert.equal(template.title, "Text");
    assert.equal(template.propertyPages?.[0]?.properties?.[0]?.value, "placeholder");
  });

  it("ignores a title that is not a string", () => {
    assert.equal(applyPropertyValues(template, { title: 42 }).title, "Text");
  });
});

describe("findGadgetByTitle", () => {
  const board = boardWith(
    { componentType: "A", title: "Sales by region", instanceId: 1 },
    { componentType: "B", title: "Sales total", instanceId: 2 },
  );

  it("finds the first gadget whose title contains the query, ignoring case", () => {
    assert.equal(findGadgetByTitle(board, "SALES")?.instanceId, 1);
    assert.equal(findGadgetByTitle(board, "total")?.instanceId, 2);
  });

  it("finds nothing for an empty query or a missing board", () => {
    assert.equal(findGadgetByTitle(board, ""), undefined);
    assert.equal(findGadgetByTitle(undefined, "sales"), undefined);
  });
});

describe("buildAgentRequest", () => {
  it("sends the message, the board, the library, and the gadgets on the board", () => {
    const board = { ...boardWith({ componentType: "A", title: "Sales", instanceId: 7, icon: "bar_chart" }), title: "Plant" };

    const request = buildAgentRequest("move sales right", board, [template]);

    assert.deepEqual(request, {
      message: "move sales right",
      boardContext: { boardId: 1, boardTitle: "Plant", activeTab: undefined },
      gadgetLibrary: [
        {
          componentType: "TextComponent",
          title: "Text",
          subtitle: "Markdown",
          description: undefined,
          propertyPages: template.propertyPages,
        },
      ],
      boardGadgets: [{ instanceId: 7, title: "Sales", componentType: "A" }],
    });
  });

  it("sends empty lists when there is no board yet", () => {
    const request = buildAgentRequest("hi", undefined, []);

    assert.deepEqual(request.boardGadgets, []);
    assert.equal(request.boardContext?.boardId, undefined);
  });
});
