# Color Token Generator CLI & Default Theme Guide

## 1. Overview

The **MWI Color Token Generator CLI** (`bin/mwi-color-tokens` / [`util/color-token-cli.esm.js`](../util/color-token-cli.esm.js)) provides command-line generation of accessible design tokens and CSS custom property stylesheets for MWI applications.

It uses the same underlying color mathematics, gamut clipping, and contrast evaluation engine as the interactive color tool ([`util/color-token-generator/`](../util/color-token-generator/)), supporting both **Tonal Palette Mode** and **Anchored Brand Mode** without browser dependencies.

---

## 2. CLI Reference

### 2.1 Command Syntax

```bash
# Using the shell wrapper
bin/mwi-color-tokens [options] [config-file.json]

# Or via Deno directly
deno run --allow-read util/color-token-cli.esm.js [options] [config-file.json]
```

### 2.2 Options and Flags

| Option | Shorthand | Description |
|---|---|---|
| `--state-config` | `--state` | Output root theme state configuration CSS (`html` container and mode variables) to stdout |
| `--input <file>` | `-i <file>` | Specify input JSON configuration file path |
| `--help` | `-h` | Display help and usage instructions |
| `--version` | `-v` | Display version information |

### 2.3 Input and Output Behavior

- **Standard Output (`stdout`)**: The generated CSS stylesheet is printed to stdout. Redirect to a file (e.g., `> primary.css`) or pipe into post-processing tools.
- **File Input**: Pass a JSON file path as a positional argument or with `-i / --input`.
- **Standard Input (`stdin`)**: Pass `-` as the file path or pipe JSON into the command when no file argument is specified.
- **Diagnostics (`stderr`)**: Syntax errors, validation errors, or missing files are reported to stderr with an exit code of `1`.

---

## 3. Default Theme Structure

The [`default-theme/`](../default-theme/) directory contains baseline JSON configurations inspired by Material Design 3 (MD3) for all 8 standard MWI color families:

| File | Family | Strategy | Base Color (`oklch`) | Default Hex | Purpose |
|---|---|---|---|---|---|
| `default-theme/primary.json` | `primary` | `tonal` | `oklch(0.55 0.18 260)` | `#3454D1` | Primary actions and key UI components |
| `default-theme/secondary.json` | `secondary` | `tonal` | `oklch(0.60 0.12 210)` | `#007A99` | Secondary accents and complementary surfaces |
| `default-theme/tertiary.json` | `tertiary` | `tonal` | `oklch(0.65 0.14 150)` | `#00825A` | Contrasting accents and balance |
| `default-theme/neutral.json` | `neutral` | `tonal` | `oklch(0.55 0.02 260)` | `#6E717E` | Generative surfaces, elevation steps, borders, and typography |
| `default-theme/success.json` | `success` | `tonal` | `oklch(0.62 0.17 142)` | `#1B873F` | Success states and positive badges |
| `default-theme/info.json` | `info` | `tonal` | `oklch(0.58 0.16 235)` | `#0077B6` | Informational callouts and alerts |
| `default-theme/warning.json` | `warning` | `tonal` | `oklch(0.72 0.16 75)` | `#C06A00` | Warning badges and cautions |
| `default-theme/error.json` | `error` | `tonal` | `oklch(0.55 0.22 25)` | `#BA1A1A` | Critical alerts and destructive actions |

---

## 4. Makefile Build Automation

The project includes build automation in [`default-theme/Makefile`](../default-theme/Makefile) (invoked from the top-level [`Makefile`](../Makefile)):

### 4.1 Build Targets

- **`make default-theme`**: Compiles all `default-theme/*.json` files and the state configuration into `dist/default-theme/`:
  - `dist/default-theme/state.css`
  - `dist/default-theme/primary.css`
  - `dist/default-theme/secondary.css`
  - `dist/default-theme/tertiary.css`
  - `dist/default-theme/neutral.css`
  - `dist/default-theme/success.css`
  - `dist/default-theme/info.css`
  - `dist/default-theme/warning.css`
  - `dist/default-theme/error.css`
- **`make default-theme-bundle`**: Builds a single concatenated bundle `dist/default-theme/bundle.css` from `state.css` and all component stylesheets.
- **`make clean-default-theme`**: Removes `dist/default-theme/` and all generated CSS artifacts.

---

## 5. Manual Theme Reconstruction Tutorial

You can manually reconstruct or customize any part of the theme using `bin/mwi-color-tokens`.

### Step 1: Generate Theme State Configuration
The state configuration sets up the root `html` container (`container-name: theme-cfg`) and resolves active mode variables (`--theme-color-mode` and `--theme-contrast-mode`):

```bash
mkdir -p dist/default-theme
bin/mwi-color-tokens --state-config > dist/default-theme/state.css
```

### Step 2: Generate Primary Chromatic Tokens
Generate the container queries and 8 paired tokens for the primary color family:

```bash
bin/mwi-color-tokens default-theme/primary.json > dist/default-theme/primary.css
```

### Step 3: Generate Generative Surfaces & Neutral Tokens
Generate the generative surface elevation formulas and neutral text/border tokens:

```bash
bin/mwi-color-tokens default-theme/neutral.json > dist/default-theme/neutral.css
```

### Step 4: Generate from Custom JSON or Stdin
You can export custom theme JSON files directly from the browser tool ([`util/color-token-generator/`](../util/color-token-generator/)) and compile them:

```bash
# Compile a custom brand color in Anchored mode
cat << 'EOF' | bin/mwi-color-tokens - > dist/default-theme/brand.css
{
  "version": "1.0",
  "family": "primary",
  "strategy": "anchored",
  "anchorHex": "#0052CC",
  "tuning": {
    "containerChromaFactor": 0.35,
    "containerLightness": 0.90,
    "darkTargetLightness": 0.80
  }
}
EOF
```

---

## 6. HTML Integration Example

To consume the generated modular stylesheets in an application:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MWI Application</title>

  <!-- 1. Theme State Configuration (loaded once) -->
  <link rel="stylesheet" href="dist/default-theme/state.css">

  <!-- 2. Neutral Surfaces & Typography (foundation) -->
  <link rel="stylesheet" href="dist/default-theme/neutral.css">

  <!-- 3. Chromatic Family Tokens -->
  <link rel="stylesheet" href="dist/default-theme/primary.css">
  <link rel="stylesheet" href="dist/default-theme/secondary.css">
</head>
<body>
  <!-- Components consume tokens via CSS Custom Properties -->
  <button style="background: var(--color-primary); color: var(--color-on-primary);">
    Primary Button
  </button>
</body>
</html>
```
