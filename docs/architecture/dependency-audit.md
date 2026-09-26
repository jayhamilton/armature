# Dependency audit

Every capability Armature adds should rest on libraries that will still be maintained when the
capability is: consolidation without a new monolith fails if the platform itself accumulates
abandoned code. This page gives every **direct** dependency a verdict against the dependency
policy ([ADR-0005](../adr/0005-dependency-policy.md)) and is re-checked in each increment report.

Audited on 2026-09-26 (INC-00b) against npm and Maven Central metadata.

## Method

- **Criteria (ADR-0005):** backed by a foundation or vendor, or clearly active (a release within 12
  months and more than one maintainer); supports the current Spring Boot major and the current
  major of each UI framework. Anything in the domain path sits behind a port.
- **Verdicts:** **Keep** (meets the policy), **Watch** (meets it today but has a known risk, or
  lags a major version), **Retire** (to be replaced in a named increment), **Remove** (to be
  deleted; no replacement needed).
- "Last release" is the registry's last publish date. npm maintainer counts are publishing
  accounts, which undercount real maintainers of vendor backed packages, so vendor backing is
  judged by the owning organization instead.
- Transitive dependencies are out of scope. Removing or upgrading anything other than
  `ace-editor-builds` is also out of scope for INC-00b; each Watch, Retire, or Remove verdict
  names the increment expected to act on it.

## Backend (`backend/pom.xml`)

| Dependency | Declared | Verdict | Reason |
| --- | --- | --- | --- |
| `spring-boot-starter-parent` | 4.1.0 | Keep | Vendor (Broadcom); current Boot 4 line |
| `spring-boot-starter-web`, `-webflux`, `-restclient`, `-actuator`, `-test` | Boot managed | Keep | Vendor, Boot 4 line. `webflux` supplies the Reactor `Flux` that `AgentService` consumes from Spring AI's streaming chat; the HTTP side is already Spring MVC `SseEmitter` |
| `spring-ai-bom` and the `mcp-server-webmvc`, `model-ollama`, `model-anthropic` starters | 2.0.0 | Keep | Vendor, Boot 4 compatible |
| `spring-ai-a2a-server-autoconfigure` (community) | 0.3.0 | Watch | Pre 1.0 community module, as the policy already says; its autoconfiguration is excluded today. Compared with the A2A Java SDK in INC-08 |
| `jackson-databind` (`com.fasterxml`) | Boot managed | Watch | Jackson 2 declared explicitly while Boot 4 defaults to Jackson 3 (`tools.jackson`); 9 main classes import Jackson 2 annotations. Decide on migration in INC-01 when resources are added |
| `json-path` | 2.4.0 | Remove | Released 2017 (current is 3.0.0); nothing in `src/` imports it directly, and `spring-boot-starter-test` already brings a managed version. Remove in INC-00c |
| `springdoc-openapi-starter-webmvc-ui` | 2.8.6 | Watch | Community project, active, but 2.x targets Boot 3; the Boot 4 line is 3.x (3.1.1). Tests pass today; upgrade in INC-01 with the first TMF 630 resources |
| `spring-restdocs-mockmvc` (test) | Boot managed | Remove | Vendor maintained but unused: nothing in `src/` imports it. Remove in INC-00c |
| `spring-boot-maven-plugin`, `maven-surefire-plugin` | Boot managed | Keep | Vendor, foundation (Apache) |
| Maven wrapper | 3.3.2, Maven 3.9.9 | Keep | Apache Software Foundation |

## Angular host (`web/hosts/angular/package.json`)

| Dependency | Declared | Last release | Verdict | Reason |
| --- | --- | --- | --- | --- |
| `@angular/*` (animations, cdk, common, compiler, core, forms, material, platform-browser, platform-browser-dynamic, router) | ^22.1.0 | 2026-09 | Keep | Vendor (Google) |
| `@angular/cli`, `@angular-devkit/build-angular`, `@angular/compiler-cli` (dev) | ^22.1 | 2026-09 | Keep | Vendor (Google) |
| `@jsonforms/core`, `angular`, `angular-material`, `material-renderers` | ^3.8.0 | 2026-08 | Keep | Foundation (Eclipse Foundation) |
| `@modelcontextprotocol/sdk` | ^1.30.0 | 2026-09 | Keep | Official protocol SDK |
| `@modelcontextprotocol/ext-apps` | ^1.7.5 | 2026-09 | Watch | Official SDK; a 2.0.0 major is out. Evaluate in INC-07 (MCP Apps as gadgets) |
| `@swimlane/ngx-charts` | ^25.0.0 | 2026-09 | Retire | Lags Angular majors (policy table); replaced by Chart.js custom elements in INC-04 |
| `ace-builds` | ^1.43.2 | 2026-05 | Keep | Active, three maintainers |
| `ace-editor-builds` | ^1.2.4 | n/a | **Removed in INC-00b** | Stale duplicate of `ace-builds`; not imported anywhere |
| `gsap` | ^3.15.0 | 2026-04 | Keep | Vendor (Webflow) |
| `marked` | ^18.0.7 | 2026-09 | Keep | Listed Keep in the policy table |
| `rxjs` | ^7.8.2 | 2026-08 | Keep | Active; required by Angular |
| `tslib` | ^2.3.0 | 2026-06 | Keep | Vendor (Microsoft) |
| `zone.js` | ~0.15.0 | 2026-09 | Watch | Vendor (Google), but Angular is moving to zoneless change detection; decide when the host moves onto `@armature/elements` (INC-04) |
| `typescript` (dev) | ~6.0.3 | 2026-09 | Watch | Vendor (Microsoft); 7.0 is out. Upgrade when Angular supports it |
| `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter` (dev) | ~6.3, ~3.1, ~2.1, ~4.0, ~1.7 | 2023 to 2024 (most) | Retire | Karma is deprecated by its maintainers and Angular's default runner has moved on; most packages have no release in 12 months. Replace with the runner chosen for the Playwright and unit test stack in INC-00c |
| `jasmine-core`, `@types/jasmine` (dev) | ~3.10 | 2026 | Watch | Active, but pinned three majors behind (current 7.x); retires with Karma |
| `istanbul-lib-instrument` (dev) | ^6.0.3 | 2024-06 | Retire | No release in 12 months; only needed by the Karma coverage setup, so it retires with Karma |
| `@types/node` (dev) | ^12.11.1 | 2026-09 | Watch | Types for Node 12 while CI runs Node 24; align with Node 24 in INC-00c |
| `@types/d3` (dev) | ^7.1.0 | 2025-08 | Retire | Only needed for ngx-charts internals; retires with it in INC-04 |
| `node-forge` (dev) | >=1.0.0 | 2026-03 | Watch | Active; appears to be pinned for a security floor rather than used directly. Confirm and replace with an `overrides` entry in INC-00c |
| `schematics-scss-migrate` (dev) | 1.3.14 | 2023-03 | Remove | One off migration tool, single maintainer, no release in over three years. Remove in INC-00c |

## React host (`web/hosts/react/package.json`)

| Dependency | Declared | Last release | Verdict | Reason |
| --- | --- | --- | --- | --- |
| `react`, `react-dom` | ^19.2.8 | 2026-09 | Keep | Vendor (Meta) |
| `react-router-dom` | ^7.18.3 | 2026-09 | Keep | Vendor (Shopify, Remix team) |
| `@mui/material`, `@mui/icons-material` | ^7.3.11 | 2026-08 | Watch | Vendor (MUI), but two majors behind (current 9.x). Decide when the React host becomes the reference on `@armature/elements` (INC-04) |
| `@mui/x-date-pickers` | ^8.29.3 | 2026-09 | Watch | Vendor (MUI); one major behind; moves with `@mui/material` |
| `@emotion/react`, `@emotion/styled` | ^11.14 | 2026-05 | Keep | Active; required by MUI |
| `@jsonforms/core`, `react`, `material-renderers` | ^3.8.0 | 2026-08 | Keep | Foundation (Eclipse Foundation) |
| `@dnd-kit/core`, `sortable`, `utilities` | ^6.3.1, ^10.0.0, ^3.2.2 | 2023-11 to 2024-12 | Watch | Single maintainer, no release in 12 months: fails the "clearly active" test. Board drag and drop moves into `@armature/elements` in INC-04; do not build on it further |
| `ace-builds` | ^1.44.0 | 2026-05 | Keep | Active, three maintainers |
| `react-ace` | ^15.0.0 | 2026-07 | Watch | Single maintainer; replaced when the markdown editor becomes a shared element |
| `date-fns` | ^4.4.0 | 2026-05 | Keep | Active, large community |
| `dompurify` | ^3.4.14 | 2026-09 | Keep | Vendor (Cure53), security library |
| `@types/dompurify` (dev) | ^3.0.5 | 2024-11 | Remove | Deprecated stub: `dompurify` ships its own types. Remove in INC-00c |
| `gsap` | ^3.15.0 | 2026-04 | Keep | Vendor (Webflow) |
| `marked` | ^18.0.11 | 2026-09 | Keep | Listed Keep in the policy table |
| `recharts` | ^3.10.1 | 2026-09 | Retire | Retires with ngx-charts in INC-04 (policy table) |
| `rxjs` | ^7.8.2 | 2026-08 | Keep | Active |
| `zustand` | ^5.0.15 | 2026-08 | Keep | Active, three maintainers |
| `vite`, `@vitejs/plugin-react` (dev) | ^8.2.2, ^6.1.0 | 2026-09 | Keep | Listed Keep in the policy table |
| `typescript` (dev) | ~6.0.2 | 2026-09 | Watch | As for the Angular host |
| `@types/react`, `@types/react-dom`, `@types/node` (dev) | ^19, ^24 | 2026-09 | Keep | DefinitelyTyped (Microsoft backed) |
| `oxlint` (dev) | ^1.79.0 | 2026-09 | Keep | Vendor (VoidZero) |
| `playwright` (dev) | ^1.62.1 | 2026-09 | Keep | Vendor (Microsoft); listed Keep in the policy table |

## Build and CI tools

| Tool | Version | Verdict | Reason |
| --- | --- | --- | --- |
| PlantUML (with its bundled C4-PlantUML library) | 1.2026.8, checksum pinned in `docs/architecture/plantuml.sh` | Keep | Listed Keep in the policy table; build time only |
| `actions/checkout`, `actions/setup-java`, `actions/setup-node`, `actions/cache` | v4 | Keep | Vendor (GitHub) |
| Temurin JDK | 25 | Keep | Foundation (Eclipse Adoptium) |
| Node.js | 24.x | Keep | Foundation (OpenJS); satisfies Angular 22's engines range |

## Summary of follow ups

| Increment | Action |
| --- | --- |
| INC-00c | Remove `json-path`, `spring-restdocs-mockmvc`, `schematics-scss-migrate`, `@types/dompurify`; confirm `node-forge`; align `@types/node`; choose the unit test runner that replaces Karma |
| INC-01 | Upgrade springdoc to the Boot 4 line; decide Jackson 2 or 3 |
| INC-04 | Retire ngx-charts, `@types/d3`, and Recharts; decide on MUI majors, `@dnd-kit`, `react-ace`, and zone.js as hosts move onto `@armature/elements`; restore the Angular `initial` budget to 2 MB |
| INC-07 | Evaluate `@modelcontextprotocol/ext-apps` 2.x |
| INC-08 | Compare `spring-ai-a2a` with the A2A Java SDK |
