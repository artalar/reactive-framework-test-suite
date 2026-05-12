import { describe, test, afterAll } from "vitest";
import { frameworks } from "./frameworks/index.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export function testMatrix(
  section: string,
  cases: Record<string, (fw: ReactiveFramework) => void>
) {
  const testNames = Object.keys(cases);
  const results: Record<string, Record<string, string>> = {};

  describe(section, () => {
    for (const fw of frameworks) {
      results[fw.name] = {};
      for (const [name, fn] of Object.entries(cases)) {
        test(`${fw.name} > ${name}`, () => {
          try {
            fw.run(() => fn(fw));
            results[fw.name][name] = "✅";
          } catch (e) {
            if (e instanceof SkipTest) {
              results[fw.name][name] = "⬜";
              return;
            }
            results[fw.name][name] = "❌";
            throw e;
          }
        });
      }
    }

    afterAll(() => {
      const maxFwLen = Math.max(
        9,
        ...Object.keys(results).map((n) => n.length)
      );
      const shortNames = testNames.map((n) => {
        const match = n.match(/^#(\d+)/);
        return match ? `#${match[1]}` : n.slice(0, 6);
      });

      const header =
        "| " +
        "Framework".padEnd(maxFwLen) +
        " | " +
        shortNames.map((s) => s.padStart(4)).join(" | ") +
        " |";
      const sep =
        "| " +
        "-".repeat(maxFwLen) +
        " | " +
        shortNames.map((s) => "-".repeat(Math.max(4, s.length))).join(" | ") +
        " |";

      const rows = Object.entries(results).map(([fw, r]) => {
        const cells = testNames.map((t, i) => {
          const v = r[t] || "⏭";
          return v.padStart(Math.max(4, shortNames[i].length));
        });
        return "| " + fw.padEnd(maxFwLen) + " | " + cells.join(" | ") + " |";
      });

      console.log(`\n${section}:`);
      console.log(header);
      console.log(sep);
      rows.forEach((r) => console.log(r));
      console.log("");
    });
  });
}
