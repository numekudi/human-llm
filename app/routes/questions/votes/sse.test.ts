import { describe, expect, it } from "vitest";
import { selectRandomTokenWithTemperature } from "~/repository";

describe("temperature", () => {
  it("random test", () => {
    const res = selectRandomTokenWithTemperature([2, 1, 1], 0);
    expect(res).toBe(0);
  });
});

describe("temperature", () => {
  it("random test", () => {
    const res = selectRandomTokenWithTemperature([2, 3, 1], 0);
    expect(res).toBe(1);
  });
});

describe("temperature", () => {
  it("random test", () => {
    const res = selectRandomTokenWithTemperature([2, 1, 4], 0);
    expect(res).toBe(2);
  });
});
