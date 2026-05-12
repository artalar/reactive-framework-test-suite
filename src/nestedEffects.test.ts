import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Nested Effects & Ordering", {
  "#43 outer effect runs before inner effect"(fw: ReactiveFramework) {
    const order: string[] = [];
    const a = fw.signal(0);

    fw.effect(() => {
      order.push("outer");
      a.read();
      fw.effect(() => {
        order.push("inner");
        a.read();
      });
    });

    expect(order[0]).toBe("outer");
  },

  "#46 duplicate subscribers don't cause duplicate notifications"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      a.read();
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    a.write(1);
    expect(runs).toBe(2);
  },
});
