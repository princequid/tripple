# Prototypes (P06)

Static HTML/CSS screen prototypes built on the approved design foundation (G3, A-15). They sit outside `src/`, import `../design-system/index.css` directly and **never ship** (workflow rule 14). Open [`index.html`](index.html) for the list of R1 surfaces and their status.

```text
prototypes/
├── index.html          every surface from WIREFRAME_SPECIFICATION, linked when its page exists
├── _shared/
│   ├── proto.js        state switcher (?state=…), prototype-only
│   └── icons.svg       placeholder icon sprite (real icon set chosen in P08)
├── r1/                 P06-05 · one page per surface, named <surface-id>-<slug>.html
│   └── _template.html  copy this to start a page (header, main, footer, state wiring)
├── r2/, r3/            P06-06, P06-07
└── tools/              screenshot + layout-check harness (T-18)
```

## Rules for prototype pages

- Only design-system classes and tokens. Page-specific CSS may use `var(--…)` only, never raw colours (T-16).
- One page per wireframe surface. List its states in `<meta name="proto-states" content="default loading empty error">` (first = default) and mark state-specific markup with `data-proto-state="…"`.
- Link every page from `index.html`; the harness fails otherwise.
- Copy and labels follow the requirements (neutral wording, e.g. "Recent", "Message"); artwork is placeholder gradients or licence-cleared images (A-10).

## Screenshots and checks (one command)

```bash
cd prototypes/tools
npm install          # first time: playwright 1.58.2, axe-core 4.10.3 (needs Google Chrome installed)
npm run shots        # every page × every state × 1440/1280/1024/768/390/360
npm run shots:axe    # same, plus axe-core at 1440 and 390
npm run shots -- r1/scr-02   # only pages whose path contains the filter
```

Screenshots go to `docs/08-testing/design/screenshots/prototypes/<page>/<state>-<width>.png` with a `report.json`. The run exits with code 1 on horizontal overflow, targets under 44 px, raised neumorphism inside glass, page or network errors, axe violations, or a page missing from the index.
