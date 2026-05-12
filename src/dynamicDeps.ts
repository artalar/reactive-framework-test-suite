import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Dynamic Dependencies";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
  "#12 active dep triggers, inactive dep does not"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const b = fw.signal("b");
    const cond = fw.signal(true);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return cond.read() ? a.read() : b.read();
    });

    expect(c.read()).toBe("a");
    expect(cCalls).toBe(1);

    // b is inactive, changing it should not trigger c
    b.write("bb");
    expect(c.read()).toBe("a");
    expect(cCalls).toBe(1);

    // a is active, changing it should trigger c
    a.write("aa");
    expect(c.read()).toBe("aa");
    expect(cCalls).toBe(2);
  },

  "#13 switching branches deactivates old deps"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const b = fw.signal("b");
    const cond = fw.signal(true);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return cond.read() ? a.read() : b.read();
    });

    expect(c.read()).toBe("a");
    cCalls = 0;

    // Switch to b branch
    cond.write(false);
    expect(c.read()).toBe("b");
    cCalls = 0;

    // a is now inactive
    a.write("aa");
    expect(c.read()).toBe("b");
    expect(cCalls).toBe(0);

    // b is now active
    b.write("bb");
    expect(c.read()).toBe("bb");
    expect(cCalls).toBe(1);
  },

  "#14 new deps updated before dependee"(fw: ReactiveFramework) {
    const a = fw.signal(1);
    const b = fw.signal(10);
    const cond = fw.signal(false);

    const c = fw.computed(() => a.read());
    const d = fw.computed(() => (cond.read() ? c.read() : b.read()));

    expect(d.read()).toBe(10);

    // Switch to c branch, and change a at the same time
    cond.write(true);
    a.write(2);
    // d should see the updated a through c
    expect(d.read()).toBe(2);
  },

  "#16 lazy branch"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read());
    const c = fw.computed(() => (a.read() > 0 ? a.read() : b.read()));

    expect(c.read()).toBe(0);
    a.write(1);
    expect(c.read()).toBe(1);
    a.write(0);
    expect(c.read()).toBe(0);
  },

  "#165 computed dep cleanup doesn't delete sibling subscription"(
    fw: ReactiveFramework
  ) {
    const toggle = fw.signal(true);
    const state = fw.signal(1);

    const p = fw.computed(() => (toggle.read() ? state.read() : 111));
    const pp = fw.computed(() => state.read());

    fw.effect(() => {
      p.read();
    });

    toggle.write(false);
    expect(p.read()).toBe(111);

    state.write(2);
    expect(pp.read()).toBe(2);
  },

  "#166 after dep removed via branch switch, re-subscribing works"(
    fw: ReactiveFramework
  ) {
    const flag = fw.signal(true);
    const src = fw.signal(1);
    const c = fw.computed(() => (flag.read() ? src.read() : 0));
    let seen = -1;

    fw.effect(() => {
      seen = c.read();
    });
    expect(seen).toBe(1);

    flag.write(false);
    expect(seen).toBe(0);

    src.write(2);

    flag.write(true);
    expect(seen).toBe(2);
  },

  "#193 sequential dirty check: branch switch skips unreachable computed"(
    fw: ReactiveFramework
  ) {
    // a → b, b → c, d reads c only when b is truthy.
    // When a becomes null, b becomes null, d skips c.
    // c should NOT re-evaluate even though its dep b changed.
    let cCalls = 0;
    const a = fw.signal<{ v: number } | null>({ v: 1 });
    const b = fw.computed(() => a.read());
    const c = fw.computed(() => {
      cCalls++;
      return b.read()?.v;
    });
    const d = fw.computed(() => {
      if (b.read()) {
        return c.read();
      }
      return 0;
    });

    d.read();
    expect(cCalls).toBe(1);

    a.write(null);
    d.read();
    // c should not have been re-evaluated — d skipped it
    expect(cCalls).toBe(1);
  },

  "#194 chained computed dirty reallocation via effect"(
    fw: ReactiveFramework
  ) {
    // items → isLoaded (boolean) → msg (string)
    // effect observes msg. Repeated writes to items.
    let seen = "";
    const items = fw.signal<number[] | undefined>(undefined);
    const isLoaded = fw.computed(() => !!items.read());
    const msg = fw.computed(() =>
      isLoaded.read() ? "loaded" : "not loaded"
    );

    fw.effect(() => {
      seen = msg.read();
    });
    expect(seen).toBe("not loaded");

    items.write([1, 2, 3]);
    expect(seen).toBe("loaded");

    items.write([4, 5]);
    expect(seen).toBe("loaded");

    items.write(undefined);
    expect(seen).toBe("not loaded");
  },

  "#195 chained computed dirty reallocation via manual read"(
    fw: ReactiveFramework
  ) {
    // Same chain as #194 but driven by manual reads with
    // intermediate computed reads interleaved.
    const items = fw.signal<number[] | undefined>(undefined);
    const isLoaded = fw.computed(() => !!items.read());
    const msg = fw.computed(() =>
      isLoaded.read() ? "loaded" : "not loaded"
    );

    expect(msg.read()).toBe("not loaded");

    items.write([1, 2, 3]);
    // Read intermediate computed before final
    isLoaded.read();
    expect(msg.read()).toBe("loaded");

    items.write(undefined);
    expect(msg.read()).toBe("not loaded");
  },

  "#196 maybe-dirty diamond: first dep unmarked, second still triggers"(
    fw: ReactiveFramework
  ) {
    // c1 = src1, c2 = (src1 % 2) + src2, c3 = f(c1, c2)
    // When src1: 0→2, c1 changes but c2 stays 0. c3 must still re-evaluate.
    // When src2: 0→1, c2 changes. c3 must re-evaluate again.
    let c3Calls = 0;
    const src1 = fw.signal(0);
    const src2 = fw.signal(0);
    const c1 = fw.computed(() => src1.read());
    const c2 = fw.computed(() => (src1.read() % 2) + src2.read());
    const c3 = fw.computed(() => {
      c3Calls++;
      return c1.read() + c2.read();
    });

    c3.read();
    expect(c3Calls).toBe(1);

    src1.write(2);
    c3.read();
    expect(c3Calls).toBe(2);

    src2.write(1);
    c3.read();
    expect(c3Calls).toBe(3);
  },

  "#197 chained value-equality stops propagation across multiple writes"(
    fw: ReactiveFramework
  ) {
    // src → c1 (src % 2) → c2 (c1 + 1) → effect
    // Multiple writes to src that don't change c1's output.
    // c2 and effect should not re-run.
    let c1Calls = 0;
    let c2Calls = 0;
    let effectRuns = 0;

    const src = fw.signal(0);
    const c1 = fw.computed(() => {
      c1Calls++;
      return src.read() % 2;
    });
    const c2 = fw.computed(() => {
      c2Calls++;
      return c1.read() + 1;
    });

    fw.effect(() => {
      c2.read();
      effectRuns++;
    });

    expect(effectRuns).toBe(1);
    c1Calls = 0;
    c2Calls = 0;
    effectRuns = 0;

    // All even numbers: c1 stays 0
    src.write(2);
    src.write(4);
    src.write(6);

    expect(c1Calls).toBeGreaterThanOrEqual(1);
    expect(c2Calls).toBe(0);
    expect(effectRuns).toBe(0);
  },

  "#198 effect discovers new branch deps"(fw: ReactiveFramework) {
    // Effect has dynamic branch: cond ? a : "other".
    // Initially cond=false, a is not tracked.
    // After cond→true, changing a should trigger effect.
    const cond = fw.signal(false);
    const a = fw.signal("value");
    let runs = 0;
    let seen = "";

    fw.effect(() => {
      runs++;
      seen = cond.read() ? a.read() : "other";
    });

    expect(seen).toBe("other");
    expect(runs).toBe(1);

    // a is inactive — should not trigger
    a.write("Hi");
    expect(seen).toBe("other");
    expect(runs).toBe(1);

    // Switch branch → a becomes active
    cond.write(true);
    expect(seen).toBe("Hi");
    expect(runs).toBe(2);

    // a is now active
    a.write("World");
    expect(seen).toBe("World");
    expect(runs).toBe(3);
  },

  "#199 effect ignores inactive branch dep"(fw: ReactiveFramework) {
    // Effect has dynamic branch: cond ? a : "other".
    // Initially cond=true, a is tracked.
    // After cond→false, changing a should NOT trigger effect.
    const cond = fw.signal(true);
    const a = fw.signal("value");
    let runs = 0;
    let seen = "";

    fw.effect(() => {
      runs++;
      seen = cond.read() ? a.read() : "other";
    });

    expect(seen).toBe("value");
    expect(runs).toBe(1);

    // Switch to inactive branch
    cond.write(false);
    expect(seen).toBe("other");
    expect(runs).toBe(2);

    // a is now inactive — should not trigger
    a.write("changed");
    expect(seen).toBe("other");
    expect(runs).toBe(2);
  },

  "#200 independent dep tracking across effects with dynamic deps"(
    fw: ReactiveFramework
  ) {
    // Two effects with overlapping deps that change branches
    // based on a shared condition signal.
    // fx1: c<2 → reads a; c>1 → reads b
    // fx2: c>1 → reads a; c<3 → reads b; also reads fx1 output
    const a = fw.signal(1);
    const b = fw.signal(2);
    const c = fw.signal(0);
    const fx1Out = fw.signal(0);
    const fx2Out = fw.signal(0);

    let fx1Runs = 0;
    fw.effect(() => {
      fx1Runs++;
      let result = 0;
      if (c.read() < 2) result += a.read();
      if (c.read() > 1) result += b.read();
      fx1Out.write(result);
    });

    let fx2Runs = 0;
    fw.effect(() => {
      fx2Runs++;
      let result = 0;
      if (c.read() > 1) result += a.read();
      if (c.read() < 3) result += b.read();
      result += fx1Out.read();
      fx2Out.write(result);
    });

    // c=0: fx1 reads a(1)→1, fx2 reads b(2)+fx1Out(1)→3
    expect(fx1Out.read()).toBe(1);
    expect(fx2Out.read()).toBe(3);

    fx1Runs = 0;
    fx2Runs = 0;

    // b changes: fx1 doesn't read b (c<2 only), fx2 reads b
    b.write(3);
    expect(fx1Out.read()).toBe(1);
    expect(fx2Out.read()).toBe(4);
    expect(fx1Runs).toBe(0);
    expect(fx2Runs).toBe(1);

    fx1Runs = 0;
    fx2Runs = 0;

    // c=2: fx1 reads b(3)→3, fx2 reads a(1)+b(3)+fx1Out(3)→7
    c.write(2);
    expect(fx1Out.read()).toBe(3);
    expect(fx2Out.read()).toBe(7);
  },
};
