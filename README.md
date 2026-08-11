<img src="https://github.com/jayhamilton/armature/blob/main/documentation/logo.png?raw=true" alt="Armature logo" width="96">

# Armature

**A runtime for interfaces that are described rather than built.**

Gadgets, their configuration forms, and board layouts are all defined as data and composed at runtime, so adding a new gadget means adding a component and a JSON entry rather than rewriting the dashboard.

An armature is the internal skeleton a sculptor builds around, shaped to hold a form nobody has committed to yet. That is the idea here. The framework holds the structure and makes no assumptions about what gets attached to it, or when, or by whom. Increasingly that "whom" includes an AI agent composing an interface on request, which works for the same reason a person configuring a board works: every board, gadget, and configuration form is JSON rather than code.

Armature is implemented with Angular and Angular Material. The model it implements is not Angular-specific.

> Formerly **NGX Dynamic Dashboard Framework**. This project is based on the open source project https://github.com/catalogicsoftware/ngx-dynamic-dashboard-framework I created a few years ago.

![Dashboard overview](https://github.com/jayhamilton/armature/blob/main/documentation/dashboard-overview.jpg)

## Quick Start

A fresh install has no boards yet. The empty state walks through both steps needed to get a dashboard on screen — open the settings menu to create a board, then open the gadget library to populate it.

![Quick start walkthrough](https://github.com/jayhamilton/armature/blob/main/documentation/quick-start.gif)

## Design Principles

### The framework makes no assumptions about gadgets

Boards are defined and configured at **runtime**, from JSON, rather than being laid out at build time. Because of that, the framework does not assume which gadgets a board will contain, or even which gadgets will eventually exist. A gadget nobody has envisioned yet can be introduced by adding its component and a library entry; the board, layout, drag-and-drop, and configuration machinery need no changes to accommodate it.

The practical consequence is that the person *using* the dashboard decides what it presents, not the person who built it. Which gadgets appear, how many, on which boards, arranged in which layout, showing what data. All of it is a runtime decision.

### Gadgets are templates; boards hold instances

A gadget in the library is a template. What lands on a board is an **instance**. You can place many instances of the same gadget across one board or several, and each instance carries its own configuration and its own data — two Bar Charts side by side can show entirely unrelated series.

Each instance is identified by a generated `instanceId` and stores its own copy of the gadget's property pages, which is why configuring one never affects another. It also means an instance is a snapshot: a gadget already on a board keeps the property definitions it was created with, so changes to `library.json` apply to newly added instances rather than retroactively to existing ones.

### Data is configured, not wired

The framework this project is based on had a notion of data sources backed by REST API endpoints. **That is not exposed in this version.** Data is instead defined as JSON and entered directly into each gadget instance's data control, using the embedded editor in its configuration panel. This keeps the runtime self-contained and makes it possible to build and share a complete board without standing up a backend.

> **Planned:** support for REST API endpoints as a data source. It will be *supplementary to* — not a replacement for — manually configured JSON, so existing boards continue to work and either approach can be chosen per gadget instance.

### Local-first, with an optional backend

The UI is fully self-contained — boards, layouts, and gadget data all live in `localStorage`, so the dashboard runs standalone with no backend at all. A companion [microservice](https://github.com/jayhamilton/armature-ms) (Spring Boot) exists alongside this project and currently backs authentication and the agentic assistant's chat endpoint. It's optional today, but as AI functionality grows, more of the experience will come to depend on it running.

> **Planned:** move toward a true local-first architecture, where `localStorage` stays the source of truth for instant, offline-capable use and changes sync to the backend automatically in the background, rather than the backend being required up front.

### Toward report-style boards

Most of the gadgets below are chart/data widgets, but the framework is growing toward supporting mixed text-and-visualization "story" boards — narrative commentary alongside charts, in the spirit of data-journalism graphics — rather than only dashboards of isolated widgets. The Text and Video gadgets, plus the per-gadget help system (all described below), are the first steps in that direction.

## Built With

* JSON driven — gadgets and their property pages come from a library definition
* [Angular Dynamic Components](https://angular.io/guide/dynamic-component-loader) — gadgets are instantiated at runtime via a signal-based, lazily-loaded registry
* [Angular Dynamic Forms](https://angular.io/guide/dynamic-form) — configuration forms are generated from each gadget's JSON
* [NGX Charts](https://swimlane.github.io/ngx-charts/#/ngx-charts/bar-vertical) — charting gadgets
* [marked](https://marked.js.org/) — renders markdown content (Text gadget, gadget help panel) to HTML
* Angular Material 3 theming with light and dark modes

## Blog Post

[Medium Blog Post](https://jaystevenhamilton.medium.com/design-of-a-dashboard-framework-c26367cfea64)

---

## Features

### Agentic Assistant

The dashboard includes a conversational assistant exposed from the toolbar. It opens as a side panel and supports a chat-style flow for requests such as creating boards, adding widgets, moving or removing gadgets, or explaining the current view. Replies stream in as the model actually generates them — real token-by-token text over a hand-rolled AG-UI event protocol (`RUN_STARTED`, `TEXT_MESSAGE_*`, `TOOL_CALL_*`, `RUN_FINISHED`) served over SSE, not a simulated reveal — with a non-deterministic typing indicator shown until the first token arrives.

Suggestions render as real, actionable cards rather than raw data: a suggested gadget is added to the board directly, with no confirmation click (that was tried and found to add unwanted friction in practice), and a board list offers a "Switch" button per board. To keep the assistant from acting on things nobody asked for, at most one board-affecting action is taken per message — a request implying more than one gets the model asking to be asked again for the rest. The panel also supports voice, via the browser's built-in Web Speech API — a mic button transcribes spoken requests into the composer, and replies can optionally be read aloud, toggled from the header.

The backend defaults to a local Ollama model, with an Anthropic-backed alternative available behind an environment variable for comparison — see the [microservice README](https://github.com/jayhamilton/armature-ms#model-provider). A2UI-style declarative component rendering is built (`AgentUiPart`'s `a2ui-card` type, a generic Card/Text/Button renderer) but not currently wired to any live flow; iframe-based MCP app previews (`AgentUiPart`'s `iframe` type) remain a landing zone for later work.

![Agentic assistant panel](https://github.com/jayhamilton/armature/blob/main/documentation/agentic-panel.jpg)

### Boards

Multiple dashboards, each with its own title, description, and Material icon. The current board's identity is shown in a banner beneath the toolbar, and boards are switched from the navigation rail on the left. The rail collapses to icons only when you want the space back.

![Board navigation](https://github.com/jayhamilton/armature/blob/main/documentation/board-navigation.jpg)

Boards are created and edited from the configuration dialog, which also carries the description and icon shown in the banner and navigation.

![Board configuration](https://github.com/jayhamilton/armature/blob/main/documentation/board-configuration.jpg)

Icons are chosen with a searchable picker drawn from the Material Icons set — no image assets involved.

![Icon picker](https://github.com/jayhamilton/armature/blob/main/documentation/icon-picker.jpg)

### Rows and Layouts

A board is made of rows, and **each row has its own column layout** — so a three-across KPI strip can sit above a two-column detail row. Rows can be added, removed, and dragged into a different order, and the layout thumbnails apply to whichever row is selected.

Removing a row relocates its gadgets into the first remaining row rather than discarding them.

![Board layouts panel](https://github.com/jayhamilton/armature/blob/main/documentation/board-layouts-panel.jpg)

Available layouts: one column, two equal, two narrow/wide, two wide/narrow, and three equal. Gadgets can be dragged between columns and between rows.

### Gadget Library

Gadgets are added from a side panel driven entirely by the library JSON. Each card shows a colored accent matching its gadget type and lifts off the panel background with a soft shadow rather than a hard outline.

![Gadget library](https://github.com/jayhamilton/armature/blob/main/documentation/gadget-library.jpg)

The panel can also collapse to an icon-only rail — each icon still carries its gadget's color and a tooltip, and adds that gadget to the board on click. The collapsed state is persisted, so it stays out of the way once you've dismissed it.

![Gadget library, collapsed to an icon rail](https://github.com/jayhamilton/armature/blob/main/documentation/gadget-library-minimal.jpg)

| Gadget | Purpose |
|---|---|
| Bar Chart | Vertical bar chart for categorical data |
| Area Chart | Multi-series area chart for trends over time |
| Line Chart | Multi-series line chart |
| Pie Chart | Proportional data |
| Bubble Chart | Three-dimensional (x / y / size) data |
| Number Card | KPI metric tiles |
| Table | Rows of tabular data with striping, density, row numbers, and column selection |
| Statistic | A single metric with an icon, color theme, and trend indicator |
| Text | A block of markdown-formatted narrative content — headings, links, lists, quotes, code, tables, images. Title/subtitle are optional, so it can read as plain continuing text |
| Video | Embeds a YouTube video from a pasted URL or bare video ID, with an optional muted-autoplay toggle |

### Gadget Configuration

Each gadget's header carries three icons — **Help**, **Configure**, and **Remove** — instead of a dropdown menu. Selecting **Configure** opens a side panel whose form is generated from that gadget's property definitions; the card shows a configuration-mode indicator while the panel is open, and edits are applied live.

![Gadget configuration](https://github.com/jayhamilton/armature/blob/main/documentation/gadget-configuration.jpg)

Supported form controls: `textbox`, `number`, `checkbox`, `dropdown`, `dropdown-ms`, `date`, `textarea`, `upload`, `hidden`, `section`, `icon-picker`, `ace-editor`, `json-forms`, and `markdown`. Gadget data is edited as JSON in an embedded Ace editor.

The `markdown` control (used by the Text gadget's content field) is aimed at people who don't already know markdown syntax: a small toolbar inserts the right syntax at the cursor — bold, italic, headings, lists, quotes, inline code, links — and a live preview sits next to the raw text so the effect of each edit is immediately visible.

![Markdown editor](https://github.com/jayhamilton/armature/blob/main/documentation/markdown-editor.jpg)

### Gadget Help

Selecting **Help** opens a side panel with that gadget's own documentation — its purpose, its configuration options, and the JSON shape its data control expects. Help content is markdown, one file per gadget type, so it's easy to keep in sync as gadgets evolve.

![Gadget help panel](https://github.com/jayhamilton/armature/blob/main/documentation/help-panel.jpg)

### Locking a Board

A toolbar lock toggle switches a board to a protected, read-only state: gadget headers shrink to bare content — no Configure/Help/Remove icons, no title, subtitle, or icon — drag-and-drop is disabled, and the toolbar's board settings, library, and layout icons hide. Useful for a shared or kiosk display where accidental edits aren't welcome.

![Locked board](https://github.com/jayhamilton/armature/blob/main/documentation/board-locked.jpg)

### Application Configuration

Application-wide settings, independent of any single board:

- **Application title** — shown in the toolbar, persisted locally, with a reset back to the built-in default.
- **Transparent card backgrounds** — a toggle that drops the card fill and shadow from every gadget on the board, so gadgets sit directly on the page background instead of inside their own card.

![Application configuration](https://github.com/jayhamilton/armature/blob/main/documentation/application-configuration.jpg)

### Light and Dark Themes

A toolbar toggle switches the entire app — Material components, chart text, side panels, and gadgets — between light and dark. The choice is persisted across sessions.

![Light theme](https://github.com/jayhamilton/armature/blob/main/documentation/light-theme.jpg)

### Persistence

Boards, layouts, gadget instances, and their configured property values are stored in `localStorage`, so a board survives a reload without any backend. See [Gadgets are templates; boards hold instances](#gadgets-are-templates-boards-hold-instances) for how instance data is captured.

---

## Developers Guide — Creating A Gadget

### 1. Define the component, service, and view

* Bar Chart Component [bar-chart.component.ts](https://github.com/jayhamilton/armature/blob/main/src/app/gadgets/bar-chart/bar-chart.component.ts)
* Bar Chart View [bar-chart.component.html](https://github.com/jayhamilton/armature/blob/main/src/app/gadgets/bar-chart/bar-chart.component.html)
* Optionally add a service to call a REST endpoint for the gadget's data

Gadgets extend `GadgetBase`, which supplies the title, subtitle, icon, instance id, property pages, and configuration-mode state.

### 2. Define the gadget's model

Add an entry to the library array in [library.json](https://github.com/jayhamilton/armature/blob/main/src/assets/api/library.json). This entry drives both the library panel card and the generated configuration form.

Production builds read `library-prod.json`, so add the entry to both files.

### 3. Register it with the gadget registry

Add a `componentType -> dynamic import()` entry to [gadget-registry.ts](https://github.com/jayhamilton/armature/blob/main/src/app/gadgets/gadget-registry.ts):

```ts
MyNewGadgetComponent: () =>
  import('./my-new-gadget/my-new-gadget.component').then((m) => m.MyNewGadgetComponent),
```

`GadgetGridCellHostComponent` takes `gadgetData` as a signal input; a constructor `effect()` reacts to it, looks up the loader by `componentType`, and creates the resolved component via `ViewContainerRef.createComponent()`. Because each entry is a dynamic import rather than a static one, the bundler code-splits every gadget into its own chunk — a gadget type is only downloaded the first time a board actually renders one.

### 4. Gadget icons

Set `icon` to a [Material Icons](https://fonts.google.com/icons?icon.set=Material+Icons) ligature name (e.g. `"bar_chart"`) — no image file needed. It renders as a `<mat-icon>` in both the gadget header and the library panel, so it themes correctly in light and dark mode.

Boards use the same convention. The icon picker's list lives in [icon-options.ts](https://github.com/jayhamilton/armature/blob/main/src/app/shared/icon-picker/icon-options.ts) — add entries there to extend it. `IconPickerComponent` is a standard `ControlValueAccessor`, so it can be used in any reactive form.

### 5. Help content

Add a markdown file at `src/assets/help/<componentType-slug>.md` (e.g. `bar-chart.md`) describing the gadget's purpose, its configuration options, and the JSON shape its data control expects. It's rendered in the gadget's Help side panel — see [Gadget Help](#gadget-help) above.

### JSON Definition

```json
[
  {
    "componentType": "StatisticComponent",
    "title": "Statistic",
    "subtitle": "Single metric",
    "description": "Add a single statistic with an icon and color theme.",
    "icon": "speed",
    "instanceId": -1,
    "tags": [],
    "propertyPages": [
      {
        "displayName": "Configuration",
        "groupId": "config",
        "position": 10,
        "properties": [
          {
            "controlType": "textbox",
            "key": "title",
            "label": "Title",
            "value": "Statistic",
            "required": true,
            "order": 1
          },
          {
            "controlType": "icon-picker",
            "key": "statIcon",
            "label": "Icon",
            "value": "speed",
            "required": false,
            "order": 21
          },
          {
            "controlType": "dropdown",
            "key": "statTheme",
            "label": "Theme",
            "value": "brand",
            "required": false,
            "order": 22,
            "options": [
              { "key": "brand", "value": "Brand" },
              { "key": "success", "value": "Success (green)" }
            ]
          }
        ]
      }
    ],
    "actions": [{ "name": "add" }]
  }
]
```

---

## Development

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

### Development server

Run `ng serve` for a dev server, then navigate to `http://localhost:4200/`. The app reloads automatically when source files change.

Log in with username `admin` and password `admin`.

### Build

Run `ng build` to build the project. Artifacts are written to `dist/`.

### Unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Further help

Run `ng help` or see the [Angular CLI Overview and Command Reference](https://angular.io/cli).
