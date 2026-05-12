import { describe, test, afterAll } from "vitest";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { frameworks } from "./frameworks/index.js";
import { SkipTest } from "./framework.js";
import { testSuite } from "./index.js";

const resultDir = join(import.meta.dirname, "..", ".test-results");

for (const { section, cases, type } of testSuite) {
  const testNames = Object.keys(cases);
  const results: Record<string, Record<string, string>> = {};

  describe(section, () => {
    for (const fw of frameworks) {
      results[fw.name] = {};
      for (const [name, fn] of Object.entries(cases)) {
        test(`${fw.name} > ${name}`, () => {
          try {
            let result: any;
            fw.run(() => {
              result = fn(fw);
            });
            results[fw.name][name] = type === "behavioral" ? result : "✅";
          } catch (e) {
            if (e instanceof SkipTest) {
              results[fw.name][name] = "⬜";
              return;
            }
            results[fw.name][name] = type === "behavioral" ? "error" : "❌";
            if (type !== "behavioral") throw e;
          } finally {
            fw.afterEach?.();
          }
        });
      }
    }

    afterAll(() => {
      mkdirSync(resultDir, { recursive: true });
      const data: any = { section, testNames, results };
      if (type) data.type = type;
      writeFileSync(
        join(resultDir, `${section.replace(/[^a-zA-Z0-9]+/g, "_")}.json`),
        JSON.stringify(data)
      );
    });
  });
}
