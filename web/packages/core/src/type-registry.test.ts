import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TypeRegistry } from "./type-registry.js";

type Renderer = (value: number) => string;

describe("TypeRegistry", () => {
  const registry = () =>
    new TypeRegistry<Renderer>("renderer")
      .register("NumberCard", (value) => `${value}`)
      .register("Percentage", (value) => `${value}%`);

  it("resolves the strategy registered for a @type", () => {
    const resolution = registry().resolve("Percentage");

    assert.ok(resolution.found);
    assert.equal(resolution.value(42), "42%");
  });

  it("reports an unknown @type with the registered ones", () => {
    const resolution = registry().resolve("Gauge");

    assert.deepEqual(resolution, {
      found: false,
      error: 'No renderer is registered for @type "Gauge" (registered: NumberCard, Percentage)',
    });
  });

  it("refuses to register a @type twice", () => {
    assert.throws(
      () => registry().register("NumberCard", () => ""),
      /A renderer is already registered for @type "NumberCard"/,
    );
  });

  it("lists registered types in order and answers has", () => {
    const types = registry();

    assert.deepEqual(types.types(), ["NumberCard", "Percentage"]);
    assert.equal(types.has("NumberCard"), true);
    assert.equal(types.has("Gauge"), false);
  });

  it("says none are registered when empty", () => {
    const resolution = new TypeRegistry<Renderer>("renderer").resolve("NumberCard");

    assert.equal(resolution.found, false);
    assert.match(!resolution.found ? resolution.error : "", /\(registered: none\)$/);
  });
});
