# Reactive Framework Test Suite

Cross-library test suite for comparing reactive signal behavior across frameworks.

## Frameworks

| Framework | Package |
|-----------|---------|
| alien-signals | `alien-signals` |
| Preact Signals | `@preact/signals-core` |
| Vue Reactivity | `@vue/reactivity` |
| Reactively | `@reactively/core` |
| Tansu | `@amadeus-it-group/tansu` |
| TC39 Signals | `signal-polyfill` |
| MobX | `mobx` |
| Svelte | `svelte` |
| Solid.js | `solid-js` |
| @solidjs/signals | `@solidjs/signals` |
| S.js | `s-js` |
| Pota | `pota` |
| Angular Signals | `@angular/core` |

## Tests

### Inner Write (`innerWrite.test.ts`)

Tests the behavior when an effect writes back to a source signal through a computed chain:

```
signal(0) → computed → effect (writes signal back to 0 if > 0)
```

After `signal(1)`, `signal(2)`, `signal(3)`, the signal should always reset to `0`. This test verifies correctness and reports effect run counts per framework.

## Usage

```sh
npm install
npm test
```
