import { describe, expect, test } from "vitest";
import { frameworks } from "./frameworks/index.js";

for (const fw of frameworks) {
  describe(fw.name, () => {
    test("#1 diamond", () => {
      fw.run(() => {
        //     A
        //   /   \
        //  B     C
        //   \   /
        //     D
        const a = fw.signal("a");
        const b = fw.computed(() => a.read());
        const c = fw.computed(() => a.read());

        let dCalls = 0;
        const d = fw.computed(() => {
          dCalls++;
          return b.read() + " " + c.read();
        });

        expect(d.read()).toBe("a a");
        expect(dCalls).toBe(1);

        a.write("aa");
        expect(d.read()).toBe("aa aa");
        expect(dCalls).toBe(2);
      });
    });

    test("#2 diamond + tail", () => {
      fw.run(() => {
        //     A
        //   /   \
        //  B     C
        //   \   /
        //     D
        //     |
        //     E
        const a = fw.signal("a");
        const b = fw.computed(() => a.read());
        const c = fw.computed(() => a.read());
        const d = fw.computed(() => b.read() + " " + c.read());

        let eCalls = 0;
        const e = fw.computed(() => {
          eCalls++;
          return d.read();
        });

        expect(e.read()).toBe("a a");
        expect(eCalls).toBe(1);

        a.write("aa");
        expect(e.read()).toBe("aa aa");
        expect(eCalls).toBe(2);
      });
    });

    test("#3 jagged diamond + tails", () => {
      fw.run(() => {
        //     A
        //   /   \
        //  B     C
        //  |     |
        //  |     D
        //   \   /
        //     E
        //   /   \
        //  F     G
        const a = fw.signal("a");
        const b = fw.computed(() => a.read());
        const c = fw.computed(() => a.read());
        const d = fw.computed(() => c.read());

        let eCalls = 0;
        const e = fw.computed(() => {
          eCalls++;
          return b.read() + " " + d.read();
        });

        let fCalls = 0;
        const f = fw.computed(() => {
          fCalls++;
          return e.read();
        });

        let gCalls = 0;
        const g = fw.computed(() => {
          gCalls++;
          return e.read();
        });

        expect(f.read()).toBe("a a");
        expect(g.read()).toBe("a a");

        eCalls = 0;
        fCalls = 0;
        gCalls = 0;

        a.write("b");
        expect(e.read()).toBe("b b");
        expect(eCalls).toBe(1);
        expect(f.read()).toBe("b b");
        expect(fCalls).toBe(1);
        expect(g.read()).toBe("b b");
        expect(gCalls).toBe(1);
      });
    });

    test("#5 drop A→B→A updates", () => {
      fw.run(() => {
        //     A
        //   / |
        //  B  |
        //   \ |
        //     C
        //     |
        //     D
        const a = fw.signal(2);
        const b = fw.computed(() => a.read() - 1);
        const c = fw.computed(() => a.read() + b.read());

        let dCalls = 0;
        const d = fw.computed(() => {
          dCalls++;
          return "d: " + c.read();
        });

        expect(d.read()).toBe("d: 3");
        expect(dCalls).toBe(1);

        a.write(4);
        expect(d.read()).toBe("d: 7");
        expect(dCalls).toBe(2);
      });
    });

    test("#6 subs update even if one dep unmarks it", () => {
      fw.run(() => {
        //     A
        //   /   \
        //  B     *C  <- always returns "c"
        //   \   /
        //     D
        const a = fw.signal("a");
        const b = fw.computed(() => a.read());
        const c = fw.computed(() => {
          a.read();
          return "c";
        });

        let dCalls = 0;
        const d = fw.computed(() => {
          dCalls++;
          return b.read() + " " + c.read();
        });

        expect(d.read()).toBe("a c");
        dCalls = 0;

        a.write("aa");
        expect(d.read()).toBe("aa c");
        expect(dCalls).toBe(1);
      });
    });

    test("#7 sub NOT update if all deps unmark it", () => {
      fw.run(() => {
        //     A
        //   /   \
        // *B     *C  <- both always return constant
        //   \   /
        //     D
        const a = fw.signal("a");
        const b = fw.computed(() => {
          a.read();
          return "b";
        });
        const c = fw.computed(() => {
          a.read();
          return "c";
        });

        let dCalls = 0;
        const d = fw.computed(() => {
          dCalls++;
          return b.read() + " " + c.read();
        });

        expect(d.read()).toBe("b c");
        dCalls = 0;

        a.write("aa");
        expect(d.read()).toBe("b c");
        expect(dCalls).toBe(0);
      });
    });

    test("#8 topological order", () => {
      fw.run(() => {
        // A → B → D
        // A → C → D
        // When A changes, D should update once, B and C before D
        const a = fw.signal(0);
        const order: string[] = [];

        const b = fw.computed(() => {
          const v = a.read();
          order.push("b");
          return v;
        });
        const c = fw.computed(() => {
          const v = a.read();
          order.push("c");
          return v;
        });
        const d = fw.computed(() => {
          const v = b.read() + c.read();
          order.push("d");
          return v;
        });

        expect(d.read()).toBe(0);
        order.length = 0;

        a.write(1);
        expect(d.read()).toBe(2);
        expect(order.indexOf("d")).toBeGreaterThan(order.indexOf("b"));
        expect(order.indexOf("d")).toBeGreaterThan(order.indexOf("c"));
        expect(order.filter((x) => x === "d")).toHaveLength(1);
      });
    });

    test("#9 linear convergence — propagate once", () => {
      fw.run(() => {
        // a → b
        // a + b → c
        // a + c → d
        const a = fw.signal(0);
        const b = fw.computed(() => a.read());

        let cCalls = 0;
        const c = fw.computed(() => {
          cCalls++;
          return a.read() + b.read();
        });

        let dCalls = 0;
        const d = fw.computed(() => {
          dCalls++;
          return a.read() + c.read();
        });

        expect(d.read()).toBe(0);
        cCalls = 0;
        dCalls = 0;

        a.write(1);
        expect(d.read()).toBe(3);
        expect(cCalls).toBe(1);
        expect(dCalls).toBe(1);
      });
    });

    test("#10 exponential convergence — propagate once", () => {
      fw.run(() => {
        // Naive propagation would cause exponential re-evaluations
        // a → b
        // b + a → c
        // c + b → d
        // d + c → e
        const a = fw.signal(0);
        const b = fw.computed(() => a.read());

        let cCalls = 0;
        const c = fw.computed(() => {
          cCalls++;
          return b.read() + a.read();
        });

        let dCalls = 0;
        const d = fw.computed(() => {
          dCalls++;
          return c.read() + b.read();
        });

        let eCalls = 0;
        const e = fw.computed(() => {
          eCalls++;
          return d.read() + c.read();
        });

        expect(e.read()).toBe(0);
        cCalls = 0;
        dCalls = 0;
        eCalls = 0;

        a.write(1);
        // a=1, b=1, c=1+1=2, d=2+1=3, e=3+2=5
        expect(e.read()).toBe(5);
        expect(cCalls).toBe(1);
        expect(dCalls).toBe(1);
        expect(eCalls).toBe(1);
      });
    });

    test("#11 computed chain depth", () => {
      fw.run(() => {
        // A → B → C → D → E
        const a = fw.signal(0);
        const b = fw.computed(() => a.read());
        const c = fw.computed(() => b.read());
        const d = fw.computed(() => c.read());
        const e = fw.computed(() => d.read());

        expect(e.read()).toBe(0);

        a.write(1);
        expect(e.read()).toBe(1);

        a.write(2);
        expect(e.read()).toBe(2);
      });
    });

    test("#16 lazy branch", () => {
      fw.run(() => {
        const a = fw.signal(0);
        const b = fw.computed(() => a.read());
        const c = fw.computed(() => (a.read() > 0 ? a.read() : b.read()));

        expect(c.read()).toBe(0);
        a.write(1);
        expect(c.read()).toBe(1);
        a.write(0);
        expect(c.read()).toBe(0);
      });
    });
  });
}
