import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

import {
  generateAIResponse,
  modelChainForTask,
  parseAIJson,
} from "./model-router";

describe("model-router routing", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it("routes research reports and earnings to the deep model", () => {
    expect(modelChainForTask("research-report")[0]).toBe("gpt-5");
    expect(modelChainForTask("earnings-analysis")[0]).toBe("gpt-5");
  });

  it("routes news + explain-move to the fast model", () => {
    expect(modelChainForTask("news-summary")[0]).toBe("gpt-4.1-mini");
    expect(modelChainForTask("explain-move")[0]).toBe("gpt-4.1-mini");
    expect(modelChainForTask("news-ranking")[0]).toBe("gpt-4.1-mini");
  });

  it("includes a deduplicated failover chain ending in the fallback model", () => {
    const chain = modelChainForTask("research-report");
    expect(chain).toContain("gpt-4o-mini");
    expect(new Set(chain).size).toBe(chain.length);
  });

  it("honors env model overrides", () => {
    process.env.OPENAI_DEEP_MODEL = "gpt-5-custom";
    process.env.OPENAI_FAST_MODEL = "mini-custom";
    expect(modelChainForTask("research-report")[0]).toBe("gpt-5-custom");
    expect(modelChainForTask("news-summary")[0]).toBe("mini-custom");
  });
});

describe("parseAIJson", () => {
  it("parses plain JSON", () => {
    expect(parseAIJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips code fences", () => {
    expect(parseAIJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it("extracts an object embedded in prose", () => {
    expect(parseAIJson('Here you go: {"a":3} thanks')).toEqual({ a: 3 });
  });

  it("returns null for unparseable content", () => {
    expect(parseAIJson("not json at all")).toBeNull();
  });
});

describe("generateAIResponse", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env = { ...saved, OPENAI_API_KEY: "sk-test" };
    createMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  function reply(content: string) {
    return { choices: [{ message: { content } }] };
  }

  it("returns content from the primary model", async () => {
    createMock.mockResolvedValue(reply('{"ok":true}'));
    const result = await generateAIResponse({
      task: "explain-move",
      system: "s",
      user: "u",
    });
    expect(result.content).toBe('{"ok":true}');
    expect(result.usedFallback).toBe(false);
    expect(result.model).toBe("gpt-4.1-mini");
  });

  it("omits temperature for reasoning models and sets max_completion_tokens", async () => {
    createMock.mockResolvedValue(reply("{}"));
    await generateAIResponse({
      task: "research-report",
      system: "s",
      user: "u",
      maxTokens: 999,
    });
    const params = createMock.mock.calls[0][0];
    expect(params.model).toBe("gpt-5");
    expect(params.temperature).toBeUndefined();
    expect(params.max_completion_tokens).toBe(999);
  });

  it("fails over to the next model on error", async () => {
    createMock
      .mockRejectedValueOnce(new Error("primary down"))
      .mockResolvedValueOnce(reply("recovered"));
    const result = await generateAIResponse({
      task: "research-report",
      system: "s",
      user: "u",
    });
    expect(result.usedFallback).toBe(true);
    expect(result.content).toBe("recovered");
  });

  it("throws when every model fails", async () => {
    createMock.mockRejectedValue(new Error("all down"));
    await expect(
      generateAIResponse({ task: "news-summary", system: "s", user: "u" })
    ).rejects.toThrow(/All models failed/);
  });
});
