import { describe, expect, it } from "vitest";
import { readStoredGradeBMode, writeStoredGradeBMode } from "./GradeBModeContext";

describe("Grade B Mode storage", () => {
  it("reads disabled mode from empty storage", () => {
    const storage = { getItem: () => null };

    expect(readStoredGradeBMode(storage)).toBe(false);
  });

  it("persists enabled and disabled states", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    writeStoredGradeBMode(true, storage);
    expect(readStoredGradeBMode(storage)).toBe(true);

    writeStoredGradeBMode(false, storage);
    expect(readStoredGradeBMode(storage)).toBe(false);
  });
});
