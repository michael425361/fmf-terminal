import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "server-only": resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scope coverage to the units exercised by the test suite (Phase 11).
      include: [
        "src/lib/ai/news-intelligence.ts",
        "src/lib/ai/model-router.ts",
        "src/lib/ai/research-report.ts",
        "src/lib/ai/explain-move.ts",
        "src/lib/ai/earnings-analysis.ts",
        "src/lib/ai/context-engine.ts",
        "src/lib/cache/ai-cache.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
