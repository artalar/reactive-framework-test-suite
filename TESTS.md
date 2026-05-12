# Signal Library Test Cases — Cross-Framework Survey (Deduplicated)

Collected from 10 signal/reactive libraries. Each test case appears exactly once.
Only includes tests universally applicable via `signal/computed/effect` interface.
Framework-specific API tests (Vue collections, MobX decorators, Angular DI, etc.) excluded.

Libraries: **alien** (alien-signals), **preact** (@preact/signals-core), **vue** (@vue/reactivity),
**solid** (solid-js), **polyfill** (signal-polyfill/TC39), **angular** (@angular/core),
**tansu** (@amadeus-it-group/tansu), **mobx**, **svelte**, **S** (S.js), **reactively** (@reactively/core)

---

## 1. Graph Propagation

Tests that updates propagate correctly through the dependency graph without glitches.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 1 | Diamond: A→B, A→C, B+C→D — D updates exactly once | alien, preact, vue, solid, polyfill, angular, tansu, S |
| 2 | Diamond + tail: node after diamond merge point | alien, preact, polyfill |
| 3 | Jagged diamond (uneven depth) + tails | alien, preact, polyfill |
| 4 | Asymmetric diamond (different path lengths) | tansu |
| 5 | A→B→A: redundant back-edge update is dropped | alien, preact, polyfill |
| 6 | Sub still updates when only some deps unmark it as clean | alien, preact, polyfill |
| 7 | Sub does NOT update when ALL deps unmark it as clean | alien, preact, polyfill |
| 8 | Topological order: parents always update before children | solid, polyfill, S |
| 9 | Convergence: propagate once despite multiple paths (linear) | solid, polyfill, S |
| 10 | Convergence: propagate once despite multiple paths (exponential) | solid, polyfill, S |
| 11 | Computed chain depth: A→B→C→D propagates correctly | alien, vue |

---

## 2. Dynamic Dependency Tracking

Tests that the system correctly adds/removes dependencies when computation code paths change.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 12 | Active dep triggers update; inactive dep does not | solid, polyfill, S, preact, reactively |
| 13 | Switching branches: obsolete deps deactivated, new deps activated | solid, polyfill, S, vue |
| 14 | New deps are updated before the dependee reads them | solid, polyfill, S |
| 15 | Only subscribes to signals actually read (not just reachable) | alien, preact |
| 16 | Lazy branch: unaccessed computed in branch is not evaluated | alien, preact, polyfill |

---

## 3. Computed Evaluation

Tests computed laziness, caching, re-evaluation, and ordering.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 17 | Lazy: not evaluated until first read | preact, vue, angular |
| 18 | Cached: not re-evaluated if deps unchanged | preact, vue, angular |
| 19 | Returns updated value after dep change | preact, vue, polyfill |
| 20 | Chained computed (computed of computed) works correctly | vue, preact |
| 21 | Chained computed dirty reallocation after trigger | vue |
| 22 | Chained computed avoids redundant re-compute | vue |
| 23 | Sync access of invalidated chained computed still runs final effect | vue |
| 24 | Dependency evaluation order is consistent with last access | vue |
| 25 | No re-compute if computed has zero dependencies | angular |
| 26 | Computed remains live after losing all subscribers (no premature GC) | vue |
| 27 | Downstream computations not re-evaluated unless value actually changed | solid, polyfill |

---

## 4. Equality & Same-Value Optimization

Tests that identical-value writes are correctly skipped.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 28 | Signal: same primitive value → no propagation | vue, angular, tansu, preact |
| 29 | Signal: NaN === NaN treated as no-change | vue, mobx, tansu |
| 30 | Signal: object identity as default equality | angular |
| 31 | Signal: custom equality comparator | preact, angular, polyfill, tansu, S, reactively |
| 32 | Computed: same result → no downstream propagation | alien, preact, vue, polyfill |
| 33 | Computed: custom equality comparator | angular, polyfill, tansu |
| 34 | Pruning: re-evaluation stops at first node returning equal value | polyfill |

---

## 5. Effect Lifecycle

Tests effect execution, cleanup, and disposal.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 35 | Effect runs callback immediately on creation | preact, vue, solid |
| 36 | Effect re-runs when dependency changes | preact, vue, angular, S |
| 37 | Effect disposal: no more re-runs after dispose | preact, vue, angular, S |
| 38 | Effect cleanup fn called before each re-run | preact |
| 39 | Effect cleanup fn called on disposal | preact |
| 40 | Effect cleanup runs outside reactive evaluation context | preact |
| 41 | Disposed effect never re-notified on later updates | alien, preact |
| 42 | Effect not executed if disposed during pending batch | preact |

---

## 6. Nested Effects & Ordering

Tests behavior of effects created inside other effects.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 43 | Outer effect runs before inner effect | alien |
| 44 | Inner effect auto-cleaned when outer re-runs | alien, svelte |
| 45 | Untracked inner effect does not subscribe to deps | alien |
| 46 | Duplicate subscribers don't affect notification order | alien |
| 47 | Effect recursion handled on first execution | alien |
| 48 | Nested effects depend on state of outer effects | svelte |

---

## 7. Inner Write

Tests behavior when effect/computed writes back to a source signal.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 49 | Consecutive inner resets through computed chain (s→c→effect→s(0)) | alien |
| 50 | Effect writes back to signal (set inside reaction) | reactively, S |
| 51 | Effect cleanup modifying dependency does not retrigger effect | preact |
| 52 | Computed writing to signal: allowed vs forbidden | angular (forbid), polyfill (allow) |
| 53 | Derived/computed inner write: only final value observed, no glitch | tansu |
| 54 | Inner mutations propagate until changes settle | S |
| 55 | Effect re-scheduled when writing signal before reading | svelte |
| 56 | Effect re-scheduled when writing signal after reading from derived | svelte |
| 57 | Computed side effect should be able to trigger | vue |

---

## 8. Cycle & Infinite Loop Detection

Tests that circular or infinite update loops are caught.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 58 | Detect trivial cycle (A↔B) | preact, angular, polyfill |
| 59 | Detect deep cycle (A→B→C→…→A) | preact, angular |
| 60 | Computed depending on itself | preact, vue, tansu |
| 61 | Indirect cycle through effects | preact |
| 62 | Infinite loop from continually setting a dependency | solid, S, mobx |
| 63 | Cycle from modifying a branch (dynamic cycle creation) | solid, S |
| 64 | Max iteration limit reached → error | tansu, mobx |

---

## 9. Batching / Transaction

Tests grouping multiple updates into one propagation pass.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 65 | Writes delayed until batch/transaction completes | preact, S, tansu, vue |
| 66 | Nested batches: outer completion triggers propagation | preact, tansu |
| 67 | Signals readable with updated value inside batch | preact |
| 68 | Computed readable with updated sources inside batch | preact |
| 69 | Pending effects run even if batch callback throws | preact |
| 70 | Effect first run is immediate even inside batch | preact |
| 71 | No duplicate listener notifications within batch | tansu |
| 72 | Intermediate values skipped (only final value observed) | tansu |
| 73 | Back-and-forth write: value returns to original → no notification | tansu |
| 74 | Multiple signals grouped in single update | solid |

---

## 10. Untracked / Unsampled Reads

Tests reading a signal without establishing a dependency.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 75 | Untracked read in effect does not create dependency | preact, alien, S, polyfill, solid, angular |
| 76 | Untracked read in computed does not create dependency | preact, alien |
| 77 | Nested untracked-inside-effect still blocks tracking | preact |

---

## 11. Effect Scope / Ownership

Tests scope-based lifecycle management of reactive subscriptions.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 78 | Scope stop: all effects within scope stop reacting | alien, vue |
| 79 | Scope collects and batch-disposes effects | vue |
| 80 | Nested scope can be detached from parent | vue |
| 81 | Parent update disposes old child computations | S |
| 82 | Owned deriveds cleanup when disconnected from graph | svelte |
| 83 | Inner scope signal updates tracked by outer effect | alien |

---

## 12. Error Handling

Tests exception behavior within the reactive graph.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 84 | Graph stays consistent after error during initial activation | alien, preact |
| 85 | Graph stays consistent after error in computed re-evaluation | alien, preact |
| 86 | Computed caches thrown exception, recomputes only after dep change | preact, angular, polyfill |
| 87 | Errors in one computed don't leak to unrelated dependents | preact, polyfill |
| 88 | Effect does not subscribe if first run throws | preact |
| 89 | Effect cleanup reset when effect throws | preact |
| 90 | Effect disposed when cleanup throws | preact |
| 91 | Exception halts propagation but non-excepted branches remain intact | S |
| 92 | No stale scheduled updates left after exception | S |
| 93 | Exception recovery in computed (re-evaluates after dep change) | mobx |

---

## 13. Stale Evaluation Order

Tests correct handling of stale (already-invalidated) computations during propagation.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 94 | Stale invocation does not trigger subsequent pending computations | solid, polyfill |
| 95 | Stale computations evaluated before their dependees | solid, polyfill |
| 96 | Downstream correctly marked stale on dep change | solid, polyfill |
| 97 | Flags indirectly updated during dirty-checking | alien |

---

## 14. Memory & GC

Tests that the reactive system doesn't leak memory.

| # | Test Case | Tested By |
|---|-----------|-----------|
| 98 | Subscriptions cleared when all subscribers removed | alien |
| 99 | Computed collectable by GC if nothing listening | preact, vue |
| 100 | Scope dereferences child after stopping (no leak) | vue |
| 101 | Disposed effect's graph links fully cleaned up | alien |

---

## Summary

**101 unique test cases** across 14 categories, deduplicated from ~1500+ raw tests across 10 libraries.

### Coverage by Category

| Category | Test Cases | Libraries (3+) |
|----------|-----------|----------------|
| Graph Propagation | 11 | 8 libs test diamond |
| Dynamic Dependencies | 5 | 5 libs |
| Computed Evaluation | 11 | 5 libs |
| Equality | 7 | 7 libs |
| Effect Lifecycle | 8 | 5 libs |
| Nested Effects | 6 | 3 libs |
| Inner Write | 9 | 7 libs |
| Cycle Detection | 7 | 7 libs |
| Batching | 10 | 5 libs |
| Untracked | 3 | 6 libs |
| Effect Scope | 6 | 4 libs |
| Error Handling | 10 | 5 libs |
| Stale Evaluation | 4 | 3 libs |
| Memory & GC | 4 | 3 libs |

### Coverage Heat Map (test cases per library)

| Library | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | Total |
|---------|---|---|---|---|---|---|---|---|---|----|----|----|----|-----|-------|
| alien | 6 | 2 | - | 1 | 2 | 5 | 1 | - | - | 2 | 2 | 2 | 1 | 2 | 26 |
| preact | 6 | 1 | 5 | 2 | 5 | - | 1 | 4 | 5 | 2 | - | 7 | - | 1 | 39 |
| vue | 2 | 1 | 9 | 2 | 2 | - | 1 | 1 | 1 | 1 | 2 | - | - | 2 | 24 |
| solid | 4 | 3 | - | - | 1 | - | - | 2 | 1 | 1 | - | - | 2 | - | 14 |
| polyfill | 7 | 2 | 2 | 2 | - | - | 1 | 2 | - | 1 | - | 2 | 2 | - | 21 |
| angular | 1 | - | 3 | 3 | 2 | - | 1 | 2 | - | 1 | - | 1 | - | - | 14 |
| tansu | 1 | - | - | 2 | - | - | 1 | 2 | 5 | - | - | - | - | - | 11 |
| mobx | - | - | - | 1 | - | - | - | 2 | - | - | - | 1 | - | - | 4 |
| svelte | - | - | - | - | - | 2 | 2 | - | - | - | 1 | - | - | - | 5 |
| S | 3 | 3 | - | 1 | 1 | - | 2 | 2 | 1 | 1 | 1 | 2 | - | - | 17 |
| reactively | - | 1 | - | 1 | - | - | 1 | - | - | - | - | - | - | - | 3 |
