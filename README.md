# Mesgjs Web Interface (MWI)

Mesgjs Web Interface (**MWI**) is a high-performance, cross-runtime component and document framework built on top of [Mesgjs](https://github.com/mesgjs/mesgjs), [NANOS](https://github.com/mesgjs/nanos), and [Reactive](https://github.com/mesgjs/reactive). MWI provides declarative document modeling, isomorphic Server-Side Rendering (SSR) and Client-Side Rendering (CSR), reactive DOM synchronization, component slotting, scoped CSS aggregation, and an accessible OKLCH color token design system.

---

## Features

- **Isomorphic Rendering**: Seamlessly render to HTML strings (`getHTML()`) in server/CLI environments or live reactive DOM nodes (`getDOM()`) in client/browser environments.
- **Bilingual Interface**: Intuitive duality where every node supports both Mesgjs message-passing syntax (e.g., `node(getAttr class)`) and idiomatic JavaScript method calls (e.g., `node.getAttr('class')`).
- **Reactive Document Trees**: Powered by fine-grained reactivity, DOM updates occur surgically and automatically when attributes, text, or children mutate.
- **Component Slotting & Composition**: Flexible content slotting (`m.slot`) and attribute slotting (`m.slat`, `m.coat`) across template boundaries.
- **Aggregated & Scoped CSS**: Automated deduplication and scoping of component styles (`m.scpcss`) and dynamic style properties (`m.stag`).
- **Accessible OKLCH Color Engine**: Built-in WCAG AA/AAA compliant color generator CLI and theme token architecture supporting Tonal and Anchored Brand modes.
- **Cross-Engine Portability**: 100% pure standard ECMAScript Modules (ESM) runnable across **Deno**, **Bun**, **Node.js**, and modern **Web Browsers**.

---

## Cross-Engine Portability & Execution

MWI is engineered without proprietary runtime global bindings or engine-specific locks. All test runners, CLI tools, and core modules consume standard ESM abstractions resolved through unified import maps.

### Unified Module Resolution with WebLoad

Module specifiers (such as `@nanos`, `@reactive`, `@std/assert`, `@compat/*`) are defined in [`deno.json`](deno.json) and [`webload.json`](webload.json):

| Environment | Module Resolution Mechanism | Command / Invocation |
|---|---|---|
| **Browsers** | Native `<script type="module">` & browser import map | Native browser loader |
| **Deno** | Built-in import map resolution | `deno run --config deno.json ...` / `deno test` |
| **Bun** | WebLoad loader (`wicbun` / preload) | `wicbun --config webload.json ...` |
| **Node.js** | WebLoad loader (`wicnode` / ESM import loader) | `wicnode --config webload.json ...` |

WebLoad (NPM package `@bkatzung/webload`) automatically handles URL imports, CDN resolution, access control, and disk caching when running under Node.js and Bun.

### CLI Shell Wrappers & Engine Auto-Probing

All executables in [`bin/`](bin/) are self-contained shell wrappers that probe available JavaScript runtimes in priority order:

1. **Deno** (`deno`)
2. **Bun / wicbun** (`wicbun` + `bun`)
3. **Node.js / wicnode** (`wicnode` + `node`)

#### Selecting a Runtime via `MESGJS_ENGINE`

You can explicitly force an execution engine using the `MESGJS_ENGINE` environment variable:

```bash
# Force Deno
MESGJS_ENGINE=deno bin/mwi-color-tokens --state-config

# Force Bun
MESGJS_ENGINE=bun bin/mwi-color-tokens default-theme/primary.json

# Force Node.js
MESGJS_ENGINE=node bin/mwi-color-tokens default-theme/neutral.json
```

---

## Command-Line Tools

MWI provides command-line utilities in [`bin/`](bin/) and [`util/`](util/):

### 1. Color Token Generator (`bin/mwi-color-tokens`)

Generates accessible design tokens and CSS custom property stylesheets from JSON theme configurations:

```bash
# Generate root theme state configuration CSS (color-scheme, container queries, mode variables)
bin/mwi-color-tokens --state-config > dist/default-theme/state.css

# Compile a chromatic theme family
bin/mwi-color-tokens default-theme/primary.json > dist/default-theme/primary.css

# Compile neutral surface tokens and elevation steps
bin/mwi-color-tokens default-theme/neutral.json > dist/default-theme/neutral.css

# Stream JSON input via standard input
bin/mwi-color-tokens - < default-theme/success.json > dist/default-theme/success.css
```

See [`docs/Color-Tokens-CLI.md`](docs/Color-Tokens-CLI.md) for full CLI documentation and theme recipes.

### 2. Markdown to MWI Converter (`bin/md-to-mwi`)

Converts Markdown documents to compact NANOS-based MWI document specifications (SLID format):

```bash
bin/md-to-mwi docs/Glossary.md > dist/glossary.slid
```

### 3. MWI Spec to HTML Renderer (`bin/mwi-to-html`)

Renders SLID document specifications directly to semantic HTML markup:

```bash
bin/mwi-to-html dist/glossary.slid > dist/glossary.html

# Or via pipeline
bin/md-to-mwi README.md | bin/mwi-to-html > dist/readme.html
```

---

## Testing

The test suite uses standard BDD testing syntax (`describe`, `it`, `beforeEach`, `afterEach`) via `@compat/test` and assertions from `@std/assert`:

```bash
# Run all tests via Deno
make test-all

# Or run specific test suites
deno test test/core/
deno test test/ssr-html/
deno test test/csr-dom/
deno test test/ssr-csr-hyd/
deno test test/color-token-tool.test.js
deno test test/color-token-cli.test.js
```

---

## Project Structure

```
├── bin/                       # Cross-runtime CLI wrappers (auto-probing)
│   ├── md-to-mwi
│   ├── mwi-color-tokens
│   └── mwi-to-html
├── default-theme/             # Material Design 3 baseline theme JSON configs
├── docs/                      # Technical documentation and guides
├── src/                       # MWI component definitions and interfaces
├── test/                      # Comprehensive cross-runtime test suites
│   ├── core/                  # Core document, slotting, and node tests
│   ├── ssr-html/              # Server-Side Rendering HTML generation tests
│   ├── csr-dom/               # Client-Side DOM reactive rendering tests
│   └── ssr-csr-hyd/           # SSR-to-CSR hydration & DOM synchronization tests
├── util/                      # CLI modules and interactive color tools
├── deno.json                  # Deno configuration & import map
└── webload.json               # WebLoad cross-runtime import map
```

---

## License

[MIT](LICENSE)
