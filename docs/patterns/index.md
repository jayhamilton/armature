# Pattern catalog

Armature is teaching material: every class that implements a design pattern says so in code, and
this page is generated from those markers, so it always matches the source. Java types are marked
with `@DesignPattern` and `@SolidPrinciple`; TypeScript with the TSDoc tags `@pattern`, `@role`,
and `@principle`.

| Pattern | Page |
| --- | --- |
| State | [state.md](state.md) |
| Strategy with registry | [strategy-registry.md](strategy-registry.md) |

Do not edit the sections below by hand. Regenerate them with:

- Java: `cd backend && ./mvnw test -Dtest=PatternCatalogTest -Dpatterns.write=true`
- TypeScript: `cd web/packages/core && npm run catalog`

CI fails when either section is out of date (`PatternCatalogTest` in the Backend workflow,
`npm run catalog:check` in the Web core workflow).

## Java

<!-- java-catalog:start -->
| Pattern | Role | Type | Principle |
| --- | --- | --- | --- |
| State | ConcreteState | [`Archived`](../../backend/src/main/java/com/addf/backend/armature/board/Archived.java) | Open/Closed: Archived refuses every event. |
| State | ConcreteState | [`Draft`](../../backend/src/main/java/com/addf/backend/armature/board/Draft.java) | Open/Closed: Draft allows only publish and discard. |
| State | ConcreteState | [`Locked`](../../backend/src/main/java/com/addf/backend/armature/board/Locked.java) | Open/Closed: Locked allows only unlock. |
| State | ConcreteState | [`Published`](../../backend/src/main/java/com/addf/backend/armature/board/Published.java) | Open/Closed: Published allows only lock and archive. |
| State | Context | [`BoardLifecycle`](../../backend/src/main/java/com/addf/backend/armature/board/BoardLifecycle.java) | Open/Closed: Delegates every decision to the current state. |
| State | Context | [`LifecycleEngine`](../../backend/src/main/java/com/addf/backend/armature/lifecycle/LifecycleEngine.java) | Dependency inversion: Callers depend on this port, not on a lifecycle's concrete states. |
| State | State | [`BoardState`](../../backend/src/main/java/com/addf/backend/armature/board/BoardState.java) | Open/Closed: A new board state is a new class; no existing state changes. |
<!-- java-catalog:end -->

## TypeScript

<!-- ts-catalog:start -->
| Pattern | Role | Symbol | Principle |
| --- | --- | --- | --- |
| Strategy with registry | Registry | [`TypeRegistry`](../../web/packages/core/src/type-registry.ts) | Open/Closed: a new `@type` is a new registration; callers never branch on type. |
<!-- ts-catalog:end -->
