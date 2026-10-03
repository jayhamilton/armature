# Host conformance suite

One Playwright suite, run unchanged against every Armature UI host. If a host passes, it behaves
like the others for everything the suite covers. This is the plan's Liskov principle at the UI
level: any host can stand in for any other.

## Rules

- **Roles and accessible names only.** Tests find elements the way a screen reader does
  (`getByRole('button', { name: 'Choose an icon' })`), never by CSS class or framework markup.
- **Fix the host, not the test.** When a scenario passes on one host and not another, add the
  missing accessible name or role to the failing host. A test never branches on which host it is
  running against.
- **No backend needed.** `support/backend-stub.ts` answers calls to `http://localhost:8080` in
  memory, per test, and `support/agent-stub.ts` answers `/api/agent/chat` with an AG-UI event
  sequence from `fixtures/agui/`, so no model is needed either. Static assets (`library.json`,
  illustrations) come from the host itself.

## Run it

Start a host, then point the suite at it with `ARMATURE_HOST_URL` (default
`http://localhost:4173`).

```bash
# React (the reference host; this is what CI runs)
cd web/hosts/react && npm ci && npm run build && npx vite preview --port 4173

# Angular
cd web/hosts/angular && npm ci && npx ng serve --port 4300

# The suite
cd web/conformance && npm ci && npx playwright install chromium
ARMATURE_HOST_URL=http://localhost:4173 npm test
ARMATURE_HOST_URL=http://localhost:4300 npm test
```

`npm run typecheck` checks the suite's TypeScript.

## Layout

| Path | What it holds |
| --- | --- |
| `tests/*.spec.ts` | Scenarios, grouped by the increment that introduced them |
| `support/host.ts` | Shared steps (log in, create a board, add and configure a gadget) |
| `support/backend-stub.ts` | The in memory backend stand in |
| `support/agent-stub.ts` | Streams a fixture as the assistant's reply, and records what the host sent |
| `fixtures/agui/*.json` | AG-UI event sequences in the shape armature-ms sends (run, text, ui parts, finish or error) |

## Add a scenario

1. Write it against one host with role and name selectors, reusing the steps in `support/host.ts`.
2. Run it against every host. Where it fails, fix that host's accessibility, not the test.
3. If it needs a backend call, extend `stubBackend` rather than mocking inside the test. For an
   assistant reply, add a fixture to `fixtures/agui/` and pass its name to `stubAgentChat`.

## Scenarios

| Scenario | Since |
| --- | --- |
| A board icon chosen in Board settings shows in the board list | INC-00d |
| Markdown typed in the Text gadget editor renders in its preview | INC-00d |
| An illustration picked for the Illustration gadget is shown on the board | INC-00d |
| Endpoints can be created, edited, and deleted in Board settings | INC-00d |
| The Bar Chart gadget's data source is picked from endpoints that share its tags | INC-00d |
| A streamed reply appears in full and the typing indicator clears | INC-00e |
| A gadget suggestion adds the gadget with the title the model chose | INC-00e |
| The board list switches to the board picked | INC-00e |
| Move and remove act on the gadget whose title matches; an unmatched title changes nothing | INC-00e |
| A row is added; a layout change for a row that does not exist changes nothing | INC-00e |
| A run error shows the error reply and the assistant can be asked again | INC-00e |
