# Armature React Port — Status

This is a React + Vite port of `armature-ui` (Angular 22 + Material). It follows the
source project's own architecture closely rather than reinventing it — see
**Conventions** below before extending it.

## Conventions

- **Services stay RxJS.** `EventService`, `BoardService`, `ThemeService`,
  `AppConfigService`, `LayoutService`, `LibraryService`, `AuthenticationService` are
  ported nearly verbatim from their Angular originals: same class, same public API,
  just exported as a singleton instance (`export const boardService = new
  BoardServiceImpl()`) instead of `@Injectable()` + constructor injection. Angular's
  zoneless-change-detection `appRef.tick()` scheduling in `EventService` was dropped —
  React re-renders on its own whenever a subscriber calls `setState`.
- **`src/lib/useObservable.ts` / `useObservableValue` / `useEventEffect`** bridge those
  RxJS observables into React — the equivalent of the `| async` pipe and
  `.pipe(takeUntil(this.destroy$)).subscribe(...)` patterns in the Angular templates.
- **Path alias `src/*`** (see `vite.config.ts` / `tsconfig.app.json`) mirrors the
  Angular app's `src/app/...` absolute-import convention, so the folder layout under
  `src/app/` matches the source project 1:1 — a file's location there is the same
  question ("where does this concept live?") in both codebases.
- **Gadgets** (`src/app/gadgets/`): `GadgetBase` (an abstract class in Angular)
  became a set of plain functions (`gadget.helpers.ts`: `getBool`/`getString`/
  `getArray`/`getJson`/`mergePropertyValues`/`isMissingPropertyValue`) called against
  a `gadget: IGadget` prop, since React components are functions, not classes. Each
  gadget is a function component `(props: GadgetComponentProps) => JSX.Element`
  registered in `gadget-registry.ts` via `React.lazy()` — the direct equivalent of the
  Angular registry's `() => import(...)` dynamic-import entries, giving the same
  per-gadget-type code splitting. `GadgetCard` factors out the
  `<mat-card cdkDrag><app-gadget-header/><mat-card-content>` boilerplate every gadget
  `.html` repeated.
- **ngx-charts → Recharts.** Chart data shapes were kept identical to what
  `library.json` already stores (ngx-charts' `{name, value}` / `{name, series:
  [{name, value}]}` / bubble `{name, series: [{name, x, y, r}]}`) — `chartColors.ts`'s
  `reshapeMultiSeries()` pivots the multi-series shape into Recharts' flat
  row-per-category rows at render time, so existing/exported gadget configs don't
  need migrating.
- **Drag-and-drop**: Angular CDK's `cdkDropList`/`cdkDrag` → `@dnd-kit`. Board gadgets
  are draggable via `SortableGadget`/`BoardColumn` (`src/app/board/`); the drag handle
  is threaded to `GadgetHeader` through `DragHandleContext` rather than making the
  whole card draggable, matching the original's header-only `cursor: move`.
- **Material Icons**: still the ligature-name web font (`<MatIcon>bar_chart</MatIcon>`
  renders the same way `<mat-icon>bar_chart</mat-icon>` did) — `library.json`'s
  `icon` field values are unchanged.
- **Markdown → HTML**: `marked` + explicit `DOMPurify.sanitize()`
  (`shared/markdown-prose/renderMarkdown.ts`). Angular's `[innerHTML]` binding
  sanitizes automatically; React's `dangerouslySetInnerHTML` does not, so this port
  added the explicit DOMPurify pass where the original relied on that implicit
  behavior (Text gadget, help panel).

## Fully ported

App shell/theme/routing, Login, Home, Menu (toolbar), Sidenav (board nav rail + the
five side panels as one `openPanel` state instead of five nested
`mat-drawer-container`s), Board (tabs, rows/columns, drag-and-drop, empty-state tour),
Layout panel (rows, per-row layout picker, board width), Library panel (collapsed
icon-rail + expanded cards — not virtualized, see below), Config panel + DynamicForm
(every control type `library.json` uses; see below), Help panel, Board banner, all 11
gadgets (BarChart, AreaChart, PieChart, BubbleChart, NumberCard, LineChart, Table,
Statistic, Text, Video, Illustration), and all three "Board settings" tabs:
**Application** (app title, transparent-card toggle), **Boards** (board CRUD with the
icon picker), and **Endpoints** (endpoint CRUD against `/api/endpoints`, tags picked
from the library's vocabulary).

Since INC-00d: `IconPicker`, `IllustrationPicker` + `IllustrationMenu`,
`MarkdownEditor` (toolbar, live preview, insert illustration), `EndpointPicker`
(endpoints whose tags intersect the gadget's), `TabEndpoints`, and `src/lib/apiFetch.ts`
(the counterpart of Angular's `TokenInterceptor`; replaced by the `@armature/core` HAL
client in INC-01). Parity for these is checked by `web/conformance`, which runs the same
Playwright scenarios against both hosts.

## Stubbed or trimmed, and where each goes

- **Agent module** (`src/app/agent/AgentPanel.tsx`): open/close wiring only. The chat
  loop, A2UI renderer, and MCP app viewer are INC-00e.
- **Dynamic-form controls nobody uses yet**: `dropdown-ms` (plain MUI multi-select),
  `upload`/`date` (plain file input / native date input), `json-forms` (raw JSON ace
  editor; `@jsonforms/react` is a dependency but not wired). No `library.json` entry uses
  these control types, so they stay simplified until one does.
- **RBAC** (`_authorization/rbac.directive.ts`, `*checkPermissions`): not ported, by
  decision. INC-01 and INC-02 replace role checks in the UI with HAL links gated by
  `AccessPolicy`, so a port would be removed two increments later.
- **Library panel virtualization** (`CdkVirtualScrollViewport`): the list renders all
  gadgets directly; fine at ~11 entries, revisit with capability manifests (INC-06).
- **Row-reorder Flip animation** (GSAP Flip): dropped. React's reconciliation (gadgets
  keyed by `instanceId`) already moves gadgets smoothly across a layout change, and
  Recharts' `ResponsiveContainer` uses a `ResizeObserver`, so the original's resize
  workaround isn't needed. Chart libraries are unified in INC-04 (Chart.js custom
  elements).
- **Closed side panels stay in the accessibility tree**: unlike Angular's drawers, the
  React side panels render while closed, so their buttons (for example "Add Row") are
  still exposed to assistive technology. Found while writing the conformance suite;
  not yet fixed.

Removed rather than ported: `UserDataStoreService` / `ScheduleDataStoreService` (the
`driver`/`qc`/`lead`/`lunch` dropdowns). No `library.json` entry used them, and INC-00d
deleted them from the Angular host too.

## Running it

```
npm install
npm run dev      # http://localhost:4200
npm run build    # tsc -b && vite build
```

Static assets (`library.json`, help markdown, onboarding/illustration images) are
copied from `armature-ui/src/assets/` into `public/assets/` — re-copy manually if the
source project's assets change.
