/**
 * The result of looking up a `@type`: the registered strategy, or a message saying what is
 * missing and what is registered, so a caller can show a useful problem instead of crashing.
 */
export type Resolution<T> =
  | { readonly found: true; readonly value: T }
  | { readonly found: false; readonly error: string };

/**
 * Maps a `@type` to the strategy that handles it: a gadget element, a data source, a channel
 * renderer. Callers ask the registry for the strategy instead of branching on the type.
 *
 * Pattern: Strategy with registry. Each registered value is a Strategy; this class is the
 * registry that selects one by `@type`.
 *
 * Principle: Open/Closed. Supporting a new `@type` is one `register` call next to the new
 * strategy; no caller and no existing strategy changes.
 *
 * Why here: `web/hosts/angular` already replaced a `switch` on `componentType` with a lookup table
 * (`gadget-registry.ts`). This is the framework free version every host, gadget type, data source,
 * and channel renderer will share (ADR-0015).
 *
 * How to extend: create one registry per kind of strategy, and register each implementation under
 * its `@type`.
 *
 * See also: `docs/patterns/strategy-registry.md`.
 *
 * @pattern Strategy with registry
 * @role Registry
 * @principle Open/Closed: a new `@type` is a new registration; callers never branch on type.
 */
export class TypeRegistry<T> {
  private readonly strategies = new Map<string, T>();

  /** @param kind - what the registry holds (for example "gadget"), used in error messages. */
  constructor(private readonly kind: string) {}

  /**
   * Registers the strategy for a `@type`.
   * @throws Error if the type is already registered; replacing a strategy silently would hide
   *   a conflict between two contributions.
   */
  register(type: string, strategy: T): this {
    if (this.strategies.has(type)) {
      throw new Error(`A ${this.kind} is already registered for @type "${type}"`);
    }
    this.strategies.set(type, strategy);
    return this;
  }

  /** Looks up the strategy for a `@type`. */
  resolve(type: string): Resolution<T> {
    const value = this.strategies.get(type);
    if (value !== undefined) {
      return { found: true, value };
    }
    const known = this.types().join(", ") || "none";
    return {
      found: false,
      error: `No ${this.kind} is registered for @type "${type}" (registered: ${known})`,
    };
  }

  /** Whether a strategy is registered for the `@type`. */
  has(type: string): boolean {
    return this.strategies.has(type);
  }

  /** Every registered `@type`, sorted. */
  types(): string[] {
    return [...this.strategies.keys()].sort();
  }
}
