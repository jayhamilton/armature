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
(most control types — see below), Help panel, Board banner, all 11 gadgets
(BarChart, AreaChart, PieChart, BubbleChart, NumberCard, LineChart, Table, Statistic,
Text, Video, Illustration), the "Board settings" dialog's **Boards** and
**Application** tabs (board CRUD, app title, transparent-card toggle).

## Stubbed or trimmed — next to port

- **Agent module** (`src/app/agent/AgentPanel.tsx`): open/close wiring only. The
  actual chat loop (`agent.service.ts`), A2UI renderer, and MCP app viewer
  (`mcp-app-viewer.component.ts`, `mcp-app.service.ts`) aren't ported.
- **Endpoints tab** (`configuration/tab-endpoints/`): placeholder. Angular original is
  ~300 lines of endpoint CRUD backing the `endpoint-picker` dynamic-form control.
- **Dynamic-form controls not fully built out**: `dropdown-ms` (renders as a plain
  MUI multi-select — fine, but nothing populates its options, see next point),
  `icon-picker`/`illustration-picker`/`endpoint-picker` (render as plain text inputs
  instead of the original's dedicated picker UI), `upload`/`date`/`markdown`
  (functional but simplified — a plain file input / native date input / plain
  textarea rather than the original's richer widgets), `json-forms` (falls back to
  the same raw-JSON ace editor as `ace-editor` — `@jsonforms/react` +
  `@jsonforms/material-renderers` are already project dependencies, just not wired
  up to a `JsonFormsEditor` component yet).
- **`UserDataStoreService`/`ScheduleDataStoreService`** (`configuration/tab-user/`,
  `tab-schedule/`): not ported. These back the `driver`/`qc`/`lead`/`lunch`
  dropdown-driven options in `DynamicFormProperty`'s `setDropDownOptions` — those
  specific dropdowns stay empty until this exists.
- **RBAC** (`_authorization/rbac.directive.ts`, `*checkPermissions` in Menu's
  template): not ported — every toolbar action is always shown regardless of
  permissions.
- **HTTP auth interceptor** (`app.interceptor.ts`): not ported — nothing in this app
  yet calls a real authenticated backend endpoint (board data is localStorage-only,
  `AuthenticationService.authenticate()` posts to `environment.apihost` but the login
  page's demo-mode path, which is what actually runs by default, never reaches it).
- **Library panel virtualization** (`CdkVirtualScrollViewport`): the library list
  renders all gadgets directly rather than virtualizing — fine at library.json's
  current ~11 entries, would want revisiting at real scale.
- **Row-reorder Flip animation** (`AnimationService.beginLayoutFlip`/
  `completeLayoutFlip`, GSAP Flip): dropped. `AnimationService` here only keeps the
  simpler gadget enter/leave fades — React's own reconciliation (gadgets keyed by
  `instanceId`) already relocates/unmounts smoothly across a layout change without a
  manual before/after position capture, and Recharts' `ResponsiveContainer` (unlike
  ngx-charts) uses a `ResizeObserver` so the original's window-`resize`-event
  workaround for stale chart sizing isn't needed either.

## Running it

```
npm install
npm run dev      # http://localhost:4200
npm run build    # tsc -b && vite build
```

Static assets (`library.json`, help markdown, onboarding/illustration images) are
copied from `armature-ui/src/assets/` into `public/assets/` — re-copy manually if the
source project's assets change.
