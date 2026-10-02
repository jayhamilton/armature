# SPEC-INC-00d: React host parity, part 1 (settings and form controls)

## Goal

Bring the React host to functional parity with the Angular host for everything outside the
assistant: board icons, the dedicated picker controls, the markdown editor, and endpoint
management. After this increment, every control type that `library.json` actually uses behaves the
same in both hosts, and the Board settings dialog has three working tabs in both. The assistant is
INC-00e.

This is a new increment inserted before INC-01 at the owner's request: React is the reference host
in the plan, so it should not start feature work while missing functions the Angular host has.

## Vision outcome served

**No assumptions** and **Consolidation**, indirectly. No new capability: this makes the reference
host honest so later increments (which the plan builds React first) do not start from a gap. It
also seeds the plan's host conformance suite, which is how parity stays true afterwards.

## Entry criteria

- INC-00c merged to `main` (currently only on `inc/00c-modules-patterns`).
- ADR-0016 (test gating) reviewed and accepted or amended.

## Source of the gap list

`web/hosts/react/PORTING_STATUS.md` ("Stubbed or trimmed") plus a file by file comparison of
`web/hosts/angular/src/app` against `web/hosts/react/src/app`. Only gaps a user can see are in
scope; see "Out of scope" for the rest and why.

## Scope

### 1. Icon picker

- `shared/icon-picker/IconPicker.tsx` and `icon-options.ts`, ported from
  `angular/src/app/shared/icon-picker/` (the curated Material Icons ligature list, 64 entries,
  copied verbatim). Same interaction as Angular: a trigger showing the current icon, a grid menu of
  options, current value highlighted. Controlled component (`value`, `onChange`), the React
  equivalent of the Angular `ControlValueAccessor`.
- Used in two places, exactly as in Angular:
  - **Board settings, Boards tab** (`TabBoards.tsx`): replaces the free text "Icon" field. The
    selected icon shows in the sidenav board list and board banner (already wired to `icon`).
  - **Dynamic form** `icon-picker` control type (`DynamicFormProperty.tsx`).

### 2. Illustration picker and menu

- `shared/illustrations/IllustrationMenu.tsx` and `IllustrationPicker.tsx`, ported from the
  Angular `illustration-menu` and `illustration-picker`. The options file already exists in React.
- Wired to the `illustration-picker` control type (used by the Illustration gadget).

### 3. Markdown editor

- `dynamic-form/markdown-editor/MarkdownEditor.tsx`, ported from Angular's
  `markdown-editor` (181 lines): edit and preview modes, preview rendered with the existing
  `renderMarkdown` (marked plus DOMPurify), and "insert illustration" via `IllustrationMenu`.
- Wired to the `markdown` control type (used by the Text gadget).

### 4. Endpoints: service, tab, and picker

- `configuration/tab-endpoints/endpoint.model.ts` and `endpoint.service.ts`: CRUD against the
  existing backend `/api/endpoints` (`EndpointController`, SPEC-73 start). Same calls as Angular:
  list, create, update, delete.
- `TabEndpoints.tsx`: replaces the placeholder with the Angular tab's behavior (list, create,
  edit, delete with the existing `ConfirmDialog`, reset form).
- `shared/endpoint-picker/EndpointPicker.tsx`: select an endpoint by name, populated from the
  service; wired to the `endpoint-picker` control type (used by the Table gadget). The
  `gadgetTags` filter is a `todo` in Angular too and stays unimplemented in both.

### 5. Authenticated HTTP in the React host

- `src/lib/apiFetch.ts`: the React counterpart of Angular's `TokenInterceptor`. Adds
  `Authorization` from `sessionStorage[environment.sessionToken]` and `Content-Type`, and sets
  `Accept: application/json` only when the caller did not set `Accept` (the same rule Angular
  needed for the SSE endpoint). Returns parsed JSON or throws on non 2xx.
- Used by the endpoint service now and by the assistant in INC-00e.
- Deliberately small and host local: the plan's HAL client in `@armature/core` (INC-01) replaces
  it, so it is not a port and gets no abstraction now ("add a port only when two implementations
  exist").

### 6. First host conformance scenarios (Playwright)

The plan calls for one Playwright suite run against every host. This increment starts it.

- `web/conformance/` package: `@playwright/test` (Playwright is "Keep" in the dependency policy;
  the React host already has `playwright` as a dev dependency, so this moves it to its proper home),
  config parameterized by `ARMATURE_HOST_URL`.
- Backend calls are stubbed with `page.route`, so the suite needs neither the backend nor Ollama.
- Scenarios, each passing against **both** hosts:
  1. Create a board, pick an icon in Board settings, see that icon in the sidenav.
  2. Add a Text gadget, edit its markdown, switch to preview, see the rendered heading.
  3. Add an Illustration gadget, pick an illustration, see it rendered.
  4. Create, edit, and delete an endpoint in the Endpoints tab (stubbed `/api/endpoints`).
  5. Configure a Table gadget's endpoint through the endpoint picker.
- Selectors use roles and accessible names, not framework specific classes, so the same test works
  on both hosts. Where a host lacks an accessible name, the fix goes in the host.
- CI: `.github/workflows/web-conformance.yml`, path filtered on `web/**`; builds the React host,
  serves it with `vite preview`, runs the suite. The Angular host runs the same suite locally for
  this increment (recorded in the report); adding it to CI is a decision below.

### 7. Documentation

- `web/hosts/react/PORTING_STATUS.md`: move the ported items to "Fully ported"; record the
  remaining gaps and their owner increment.
- `web/conformance/README.md`: what the suite is (the plan's Liskov at the UI level), how to run it
  against each host, how to add a scenario.
- `docs/adr/0017-host-parity-before-feature-work.md`: React parity work is inserted as INC-00d and
  INC-00e before INC-01; parity is proven by the conformance suite, not by line comparison.
- `ROADMAP.md` and the plan's increment table: add the 00d and 00e rows (the only plan edit).
- `docs/increments/INC-00d.md` via the `armature-document-increment` skill.

## Out of scope (and why)

| Item | Why not now |
| --- | --- |
| Assistant panel, AG-UI streaming, A2UI, MCP App viewer | INC-00e |
| RBAC directive (`*checkPermissions`) | The plan replaces role checks in the UI with HAL links gated by `AccessPolicy` (INC-01, INC-02). Porting it would be removed two increments later |
| `UserDataStoreService`, `ScheduleDataStoreService` (`driver`, `qc`, `lead`, `lunch` dropdowns) | No entry in `library.json` uses those keys; legacy from an earlier domain. Proposed for removal from the Angular host instead (decision 3) |
| Richer `json-forms`, `date`, `upload`, `dropdown-ms` widgets | No entry in `library.json` uses these control types today; React's simplified versions stay |
| Library panel virtualization | About 11 gadgets today; revisit with capability manifests (INC-06) |
| GSAP Flip row reorder animation | Cosmetic; React reconciliation already moves gadgets smoothly |
| Chart library unification | INC-04 rebuilds gadgets as custom elements on Chart.js |

## Files touched

- React new: `src/app/shared/icon-picker/{IconPicker.tsx,icon-options.ts}`,
  `src/app/shared/illustrations/{IllustrationMenu.tsx,IllustrationPicker.tsx}`,
  `src/app/dynamic-form/markdown-editor/MarkdownEditor.tsx`,
  `src/app/configuration/tab-endpoints/{endpoint.model.ts,endpoint.service.ts}`,
  `src/app/shared/endpoint-picker/EndpointPicker.tsx`, `src/lib/apiFetch.ts`, plus CSS.
- React edited: `TabBoards.tsx`, `TabEndpoints.tsx`, `DynamicFormProperty.tsx`, `package.json`
  (drop `playwright`), accessible names where scenarios need them.
- Angular edited: accessible names only, where a scenario needs them.
- New: `web/conformance/**`, `.github/workflows/web-conformance.yml`.
- Docs: as in section 7.

## Tests and checks

| Check | Command | Expected |
| --- | --- | --- |
| React | `cd web/hosts/react && npm ci && npm run build && npm run lint` | Pass |
| Angular | `npm ci && npx ng build && npx ng test --watch=false --browsers=ChromeHeadless` | Build passes; 26 of 26 |
| Conformance, React | `cd web/conformance && ARMATURE_HOST_URL=http://localhost:4173 npx playwright test` | 5 of 5 |
| Conformance, Angular | same, against `ng serve` | 5 of 5 |
| Backend, core, diagrams | as in INC-00c | Unchanged, pass |
| Manual parity walk | Both hosts side by side against the real backend | Recorded in the report with screenshots |

## Size

Estimated 1,100 to 1,400 changed lines excluding lock files: within the plan's 1,500 line guideline.

## Decisions (confirmed by the owner, 2026-10-01)

1. **Split:** settings and forms here (00d), assistant in 00e, rather than one large increment.
2. **RBAC not ported** (superseded by HAL links in INC-01 and INC-02).
3. **Remove the dead user and schedule datastores from the Angular host** in this increment
   (`configuration/tab-user/`, `tab-schedule/`, their services, and the `driver`, `qc`, `lead`,
   `lunch` branch of `setDropDownOptions`).
4. **Conformance in CI:** React only for now; the Angular host runs the same suite locally and the
   result is recorded in the report.
5. **Entry criteria:** built on `inc/00d-react-parity`, branched from `inc/00c-modules-patterns`.
   INC-00c merge and ADR-0016 review stay with the owner.
