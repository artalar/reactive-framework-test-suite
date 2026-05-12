import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Behavioral Differences";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
  "#17 computed evaluation timing"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      return a.read();
    });
    const eagerCalls = calls;
    b.read();
    return eagerCalls === 0 ? "lazy" : "eager";
  },

  "#15 unread computed subscription"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const b = fw.computed(() => a.read());

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read();
    });
    // c is never read
    b.read();
    const callsBefore = cCalls;
    a.write("aa");
    b.read();
    return cCalls === callsBefore ? "no subscription" : "subscribes eagerly";
  },

  "#146 recompute count on multiple dep changes"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read() + b.read();
    });
    c.read();
    cCalls = 0;
    a.write(1);
    b.write(1);
    c.read();
    return cCalls <= 1 ? "single recompute" : `${cCalls} recomputes`;
  },

  "#29 NaN equality semantics"(fw: ReactiveFramework) {
    const a = fw.signal(NaN);
    let calls = 0;
    const c = fw.computed(() => {
      calls++;
      return a.read();
    });
    c.read();
    calls = 0;
    a.write(NaN);
    c.read();
    return calls === 0 ? "Object.is" : "===";
  },

  "#167 computed NaN downstream propagation"(fw: ReactiveFramework) {
    const a = fw.signal(1);
    let value: number = 5;
    const c = fw.computed(() => {
      a.read();
      return value;
    });
    let dCalls = 0;
    const d = fw.computed(() => {
      dCalls++;
      return c.read();
    });
    d.read();

    value = NaN;
    a.write(2);
    d.read();
    dCalls = 0;

    a.write(3);
    d.read();
    return dCalls === 0 ? "Object.is" : "===";
  },

  "#30 same-reference signal write"(fw: ReactiveFramework) {
    const obj = { x: 1 };
    const a = fw.signal(obj);
    let calls = 0;
    const c = fw.computed(() => {
      calls++;
      return a.read();
    });
    c.read();
    calls = 0;
    a.write(obj);
    c.read();
    return calls === 0 ? "skips" : "propagates";
  },

  "#176 batch return value"(fw: ReactiveFramework) {
    if (!fw.batch) throw new SkipTest("no batch");
    const result = (fw.batch as Function)(() => 42);
    return result === 42 ? "returns value" : "returns void";
  },

  "#173 mid-propagation read isolation"(fw: ReactiveFramework) {
    const a = fw.signal(false);
    const b = fw.signal(0);
    let readerSaw: number | undefined;
    try {
      fw.effect(() => {
        if (a.read()) b.write(1);
      });
      fw.effect(() => {
        if (a.read()) readerSaw = b.read();
      });
      a.write(true);
      if (readerSaw === 0) return "pre-write";
      if (readerSaw === 1) return "post-write";
      return "unknown";
    } catch {
      return "throws";
    }
  },

  "#174 intra-run read-after-write"(fw: ReactiveFramework) {
    const a = fw.signal(false);
    const b = fw.signal(0);
    let readAfterWrite: number | undefined;
    try {
      fw.effect(() => {
        if (a.read()) {
          b.write(1);
          readAfterWrite = b.read();
        }
      });
      a.write(true);
      if (readAfterWrite === 0) return "pre-write";
      if (readAfterWrite === 1) return "post-write";
      return "unknown";
    } catch {
      return "throws";
    }
  },

  "#88 effect subscription after first-run throw"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs = 0;
    try {
      fw.effect(() => {
        runs++;
        a.read();
        throw new Error("first run error");
      });
    } catch {}
    runs = 0;
    try {
      a.write(1);
    } catch {}
    return runs === 0 ? "unsubscribes" : "keeps subscribed";
  },

  "#106 effect throw isolation in flush"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs1 = 0;
    let runs3 = 0;
    fw.effect(() => {
      a.read();
      runs1++;
    });
    try {
      fw.effect(() => {
        const v = a.read();
        if (v === 1) throw new Error("effect2 error");
      });
    } catch {}
    fw.effect(() => {
      a.read();
      runs3++;
    });
    runs1 = 0;
    runs3 = 0;
    try {
      a.write(1);
    } catch {}
    return runs1 > 0 && runs3 > 0 ? "continues" : "halts flush";
  },

  "#86 computed error caching"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      if (a.read() === 0) throw new Error("cached error");
      return a.read();
    });
    try {
      b.read();
    } catch {}
    const callsAfter = calls;
    let secondThrew = false;
    try {
      b.read();
    } catch {
      secondThrew = true;
    }
    if (calls > callsAfter) return "re-evaluates";
    if (secondThrew) return "caches error";
    return "returns stale";
  },

  "#107 non-Error throw caching"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      if (a.read() === 0) throw "string error";
      return a.read();
    });
    try {
      b.read();
    } catch {}
    const callsAfter = calls;
    let secondThrew = false;
    try {
      b.read();
    } catch {
      secondThrew = true;
    }
    if (calls > callsAfter) return "re-evaluates";
    if (secondThrew) return "caches error";
    return "returns stale";
  },

  "#49 inner write re-run through computed chain"(fw: ReactiveFramework) {
    const s = fw.signal(0);
    const c = fw.computed(() => s.read());
    let runs = 0;

    try {
      fw.effect(() => {
        runs++;
        if (runs > 20) throw new Error("bail");
        if (c.read() > 0) s.write(0);
      });
    } catch {}

    runs = 0;
    try { s.write(1); } catch {}
    const run1 = runs;
    const val1 = s.read();

    runs = 0;
    try { s.write(2); } catch {}
    const run2 = runs;
    const val2 = s.read();

    if (run1 === 0) return "no re-run";
    if (val1 !== 0) return "broken";
    if (val2 !== 0 || run2 === 0) return `runs ${run1}x, then blocks`;
    return `runs ${run1}x per write`;
  },

  "#62 infinite loop in effect"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let iterations = 0;
    try {
      fw.effect(() => {
        if (iterations++ > 200) throw new Error("bail");
        a.write(a.read() + 1);
      });
      return "no throw";
    } catch {
      return iterations <= 200 ? "cycle detected" : "manual bail (200+)";
    }
  },

  "#175 effect multi-signal write batching"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    const c = fw.signal(0);
    fw.effect(() => {
      const v = a.read();
      b.write(v + 1);
      c.write(v + 2);
    });
    const d = fw.computed(() => b.read() + c.read());
    let runs = 0;
    fw.effect(() => {
      d.read();
      runs++;
    });
    runs = 0;
    a.write(10);
    return runs <= 1 ? "batched" : `unbatched (${runs} runs)`;
  },
};
