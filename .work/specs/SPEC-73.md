# Spec: REST API endpoint data source, proxied through a single microservice endpoint

**Issue**: #73
**Date**: 2026-08-12

## Background

The original [ngx-dynamic-dashboard-framework](https://github.com/catalogicsoftware/ngx-dynamic-dashboard-framework) (this project's predecessor, cloned locally for reference at `../ngx-dynamic-dashboard-framework-src`) had a working "EndPoint" data-source feature:

- `src/app/configuration/tab-endpoint/endpoint.model.ts` — an `EndPoint` (name, address, credential fields, description, `tags: [{name}]`).
- `src/app/configuration/tab-endpoint/endpoint.service.ts` — CRUD backed by `localStorage`, seeded with a few read-only mock endpoints.
- `src/app/dynamic-form/dynamic-form-property.component.ts` — a `dynamicdropdown` control type that lists only the endpoints whose `tags` case-insensitively intersect the gadget's own `gadgetTags`.
- `src/app/gadgets/_common/gadget-base.ts` — `configureGadget()` resolves the gadget's `endpoint` property (an endpoint *name*) to the matching `EndPoint` object; each gadget's own service (e.g. `barchart/service.ts`) then did a **direct client-side `HttpClient.get(endpoint.address)`**.

That direct-GET design has two problems this version should not repeat:
1. It requires every target API to support CORS from the browser's origin.
2. Credentials (`credential`, `tokenAPI`/`tokenAPIHeader`/`tokenAPIProperty`) would have to be sent from, or fetched by, the browser — the original's `api-token.service.ts` did exactly this (fetches a token client-side via HTTP Basic auth) but was only ever wired into one gadget (`donut`), suggesting it was unfinished/abandoned as impractical.

This version already has a real backend (`armature-ms`) that the browser already talks to (auth, agent chat). This spec routes gadget data-source fetches through it instead.

## Current state in this codebase

- `IGadget.tags: ITag[]` (`{facet, name}`) exists on every gadget and is already threaded down to `DynamicFormPropertyComponent.gadgetTags` (`src/app/dynamic-form/dynamic-form-property.component.ts`) — unused today. Every gadget in `library.json` currently has `"tags": []`.
- Gadget data today is exclusively manual: a `chartData`-style property edited as JSON in the embedded Ace editor (`ace-editor` control type), read via `GadgetBase.getJson()`.
- `GadgetBase` (`src/app/gadgets/common/gadget-common/gadget-base/gadget.base.ts`) has no HTTP dependency and no polling/subscription lifecycle today — that needs to be added.
- `armature-ms` has no per-resource controllers yet beyond `HelloController` and the agent chat endpoint — no established REST resource pattern to match beyond springdoc `@Tag`/`@Operation` annotations and constructor-injected services.
- No `SecurityFilterChain` exists yet in `armature-ms` — auth for a new endpoint is a `# Open question`, not solved here.

## Approach

### 1. Data source config: a new "Endpoints" tab

Add a third tab to the `Configuration` dialog (`src/app/configuration/`), alongside `tab-boards` and the application tab, following the same structure as `tab-boards`:

- `src/app/configuration/tab-endpoints/endpoint.model.ts` — `IEndpoint { id: string; name: string; address: string; description: string; tags: ITag[]; authType: 'none' | 'header' | 'basic'; authHeaderName?: string; }`. **No credential value field on this model** — see §3 for why secrets don't round-trip through the browser.
- `src/app/configuration/tab-endpoints/endpoint.service.ts` — CRUD against `armature-ms` (`GET/POST/PUT/DELETE /api/endpoints`), not `localStorage`: endpoint definitions (and especially their credential references) are exactly the kind of thing this project's "local-first, optional backend" model should *not* extend to, since a credential sitting in `localStorage` in cleartext is worse than the problem this spec is trying to solve.
- `src/app/configuration/tab-endpoints/endpoint-tab.component.ts` — mirrors `tab-boards.component.ts`: a "Define a new endpoint" form + a table of existing endpoints with edit/delete, using the same `app-icon-picker`-style tag input (a chip list, since an endpoint can carry multiple tags).

### 2. Gadget-side: an `endpoint-picker` control type

- `src/app/shared/endpoint-picker/` — new `EndpointPickerComponent`, a `ControlValueAccessor` modeled directly on `IllustrationPickerComponent` (`src/app/shared/illustrations/illustration-picker/`): a trigger button + `mat-menu` containing a filtered list.
- Filtering logic (the direct port of the original's `ngAfterViewInit` tag-intersection loop, now case-insensitive `Set` intersection instead of nested `forEach`): given `@Input() gadgetTags: ITag[]`, show only endpoints where `endpoint.tags` shares at least one `name` with `gadgetTags`, **plus a permanent leading "Manual" entry** that is always present regardless of tags.
- `DynamicFormPropertyComponent` (`src/app/dynamic-form/dynamic-form-property.component.ts`) gets a new `@case ('endpoint-picker')` alongside `icon-picker`/`illustration-picker`, passing `[gadgetTags]="gadgetTags"` (that input already exists on the component, per the `//todo` comment left in the original).
- A gadget that wants a REST-backed data option adds two properties to its `library.json` entry: `controlType: 'endpoint-picker'` (key: `dataSource`, value defaults to `'manual'`) and keeps its existing manual-JSON property (e.g. `chartData`) as today. `dataSource: 'manual'` (the default) means nothing changes from current behavior; any other value is an endpoint id.

### 3. The proxy: one microservice endpoint, not one per gadget

`armature-ms`, new package `com.addf.backend.armature.datasource`:

- `Endpoint` entity/record + a repository (persistence mechanism TBD — see Open Questions) for the CRUD in §1. Credential *values* (API keys, passwords) are stored server-side only, referenced from the frontend's `IEndpoint` by id, never round-tripped to the browser after creation — the create/update form collects a credential once and the backend stores it (encrypted at rest — mechanism TBD), returning only the non-secret fields on subsequent reads.
- `DataSourceController`:
  ```java
  @PostMapping("/api/datasource/fetch")
  public ResponseEntity<Object> fetch(@RequestBody DataSourceFetchRequest request)
  ```
  `DataSourceFetchRequest { String endpointId; Map<String,String> queryParams; }` — the frontend never sends a raw target URL, only the id of an `Endpoint` it's allowed to read (its config's `address` and credential are resolved server-side). This is what makes it "a single API that proxies GET requests" per the ask: one route handles every gadget type, because the target address and auth live in the stored `Endpoint`, not in the request.
  The controller resolves the `Endpoint` by id, builds the outbound `GET` (target address + query params + resolved credential, per `authType`) using a `RestClient`/`WebClient`, and returns the response body verbatim (proxying status code and content-type where reasonable) rather than a bespoke response envelope, since the shape of gadget data is gadget-defined, not proxy-defined.
- Errors (target unreachable, 4xx/5xx from target, endpoint id not found) come back as a normal error response body the frontend gadget can render through its existing `errorObject`/`handleError` pattern (`gadget-base.ts` in the original had this; current `GadgetBase` doesn't yet and would need an equivalent).

### 4. Security: server-side fetch of a user-configured URL is SSRF, and it's not a function of endpoint count

This is the load-bearing risk in this design, so it gets called out on its own rather than folded into the general risk list below.

The original fetched `endpoint.address` **from the browser**. A malicious or careless `Endpoint.address` could only ever reach what the *browser's* network position could reach — the public internet, same as any other page the user's browser can load. Moving that fetch server-side (§3) is the whole point of this spec (CORS, credentials), but it also moves the network position doing the fetching from "the browser" to "the backend" — and `Endpoint.address` is still admin-configured at runtime through the Endpoints tab, not a fixed set of URLs a developer chose. That combination — a runtime-configurable target, fetched from server-side network position — is textbook SSRF: someone with access to the Endpoints tab could point an `Endpoint` at `http://169.254.169.254/latest/meta-data/` (cloud instance metadata), `http://localhost:8080/actuator/env`, or any other internal-only address `armature-ms` can reach but the outside world can't, and have the backend fetch it on their behalf and relay the response back through `/api/datasource/fetch`.

**This is orthogonal to the one-endpoint-vs-many-endpoints question.** Splitting `DataSourceController` back into one endpoint per gadget type would not reduce this exposure at all, because the exposure comes from the target address being runtime-configurable, not from how many backend routes exist. The only way per-gadget-type endpoints would actually close this hole is by making their targets fixed and developer-authored instead of admin-configured at runtime — which is a different feature (bespoke integrations) than the tag-matched, admin-defined `Endpoint` model both this spec and the original share.

**Required mitigations, not optional hardening — this should block shipping `DataSourceController`, not follow it:**
- Before issuing the outbound `GET`, resolve `Endpoint.address`'s host and reject the request if it resolves to a loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`, `fe80::/10` — this is specifically what covers the cloud-metadata case above), or private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) range. Check the *resolved* IP, not just the hostname string, to close DNS-rebinding (a hostname that resolves to a public IP at creation time but a private one at fetch time).
- Re-check on every fetch, not just at `Endpoint` creation time, for the same DNS-rebinding reason.
- Restrict who can create/edit `Endpoint` records to whatever this app's most-privileged role is (today's `admin`/`admin` login is the only account, so this constrains a future multi-user auth model more than it changes anything immediately — but the constraint needs to exist in the design now, not get bolted on after multi-user auth arrives).
- Cap response size and request timeout on the outbound fetch, so the proxy can't be used to tie up backend threads or relay unbounded responses.

### 5. `armature-ui`: fetching through the proxy

- `src/app/shared/datasource/datasource.service.ts` — one method, `fetch(endpointId: string, params?: Record<string,string>): Observable<unknown>`, POSTing to `/api/datasource/fetch`. This is the *only* HTTP call site for every gadget's REST-backed data, replacing what the original did with a per-gadget-type service (`barchart/service.ts`, etc.) each calling `HttpClient.get()` directly.
- `GadgetBase` gains: reading the `dataSource` property in `loadProperties()`-equivalent; when it's not `'manual'`, calling `DataSourceService.fetch(dataSource)` instead of (or to populate) the manual JSON property, on an interval (the original polled every 15s per gadget instance — `barchart-gadget.component.ts`'s `POLL_INTERVAL`) via `interval().pipe(startWith(0), switchMap(...))`, unsubscribed in `ngOnDestroy`. This is a base-class addition, not per-gadget, so it should live in `GadgetBase` once rather than being copy-pasted per gadget as the original did.
- Each gadget component's existing "apply data to the chart" step (already gadget-specific today, e.g. how `BarChartComponent` turns `chartData` into ngx-charts' input shape) stays gadget-specific — only *how the JSON arrives* (manual vs. fetched-and-injected-into-the-same-property) changes, not what each gadget does with it.

## Files to Change / Add

**armature-ui**
- `src/app/configuration/tab-endpoints/` (new) — model, service, tab component + template/styles
- `src/app/configuration/configuration.component.ts`/`.html` — add the third tab
- `src/app/shared/endpoint-picker/` (new) — `ControlValueAccessor`, modeled on `illustration-picker`
- `src/app/dynamic-form/dynamic-form-property.component.ts`/`.html` — new `endpoint-picker` case
- `src/app/shared/datasource/datasource.service.ts` (new)
- `src/app/gadgets/common/gadget-common/gadget-base/gadget.base.ts` — polling/fetch lifecycle, error state
- `src/assets/api/library.json` (+ `library-prod.json`) — opt individual gadgets into `dataSource` property
- `src/assets/help/*.md` — document the new control on gadgets that adopt it

**armature-ms**
- `com.addf.backend.armature.datasource.Endpoint` (entity/record)
- `com.addf.backend.armature.datasource.EndpointController` (CRUD, backs §1's tab)
- `com.addf.backend.armature.datasource.DataSourceController` (the proxy, §3)
- `com.addf.backend.armature.datasource.DataSourceService` (outbound fetch + credential resolution)
- Persistence layer for `Endpoint` (see Open Questions)

## Risks / Open Questions

- **Persistence for `Endpoint` records in `armature-ms`.** No datastore exists in the backend yet (board data is still `localStorage`-only per `IBoardRepository`'s current `LocalStorageBoardRepository` implementation). This spec needs either a lightweight embedded store (H2/SQLite) or an explicit decision to keep `Endpoint` definitions in-memory-only until a real datastore lands — worth resolving before implementation starts, not during it.
- **Credential encryption at rest.** Storing API keys/passwords server-side is strictly better than in `localStorage`, but "encrypted at rest — mechanism TBD" is a real gap (Spring's `Jasypt`/a KMS/env-var-derived key are the usual options) that needs a decision, not just a note, before real credentials go through this.
- **No `SecurityFilterChain` exists yet.** `/api/datasource/fetch` and `/api/endpoints` should require at minimum the same auth the rest of `armature-ms` expects from `armature-ui`'s `TokenInterceptor` before they ship. This is necessary but not sufficient on its own — it stops an anonymous caller from hitting the proxy at all, but doesn't stop an *authenticated* user from using it as an SSRF vector, which is what §4's mitigations are specifically for. Both are required; neither substitutes for the other.
- **Polling vs. push.** The original polled every 15s per gadget instance client-side; this spec keeps that (simplest, matches prior behavior) but doesn't address N gadget instances on one board independently polling the same endpoint — a shared/de-duped polling layer is a reasonable follow-up, not in scope here.
- **`GadgetBase` currently has no error-display convention** (the original's `errorObject`/`handleError`/`errorExists` don't have a direct equivalent in the current `gadget.base.ts`) — this spec needs to add one, which is a small but real base-class behavior change every existing gadget inherits.
