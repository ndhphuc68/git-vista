import { describe, it, expect } from "vitest";
import { sanitizeFirstAction } from "../components/rebase/rebaseStepsHelpers";
import type { RebasePlanStep } from "../ipc/bindings.generated";

function step(commit_id: string, action: RebasePlanStep["action"]): RebasePlanStep {
  return { commit_id, action, new_message: null };
}

describe("sanitizeFirstAction", () => {
  it("returns the input unchanged for an empty list", () => {
    expect(sanitizeFirstAction([])).toEqual([]);
  });

  it("leaves a Pick-first list unchanged", () => {
    const steps = [step("a", "Pick"), step("b", "Squash")];
    expect(sanitizeFirstAction(steps)).toEqual(steps);
  });

  it("coerces a leading Squash step to Pick", () => {
    const steps = [step("a", "Squash"), step("b", "Pick")];
    const result = sanitizeFirstAction(steps);
    expect(result[0]?.action).toBe("Pick");
    expect(result[1]?.action).toBe("Pick");
  });

  it("coerces a leading Fixup step to Pick", () => {
    const steps = [step("a", "Fixup")];
    const result = sanitizeFirstAction(steps);
    expect(result[0]?.action).toBe("Pick");
  });

  it("treats the first non-Drop step as the leading step", () => {
    const steps = [step("a", "Drop"), step("b", "Squash")];
    const result = sanitizeFirstAction(steps);
    expect(result[0]?.action).toBe("Drop");
    expect(result[1]?.action).toBe("Pick");
  });

  it("does not mutate the input array", () => {
    const steps = [step("a", "Squash")];
    const original = [...steps];
    sanitizeFirstAction(steps);
    expect(steps).toEqual(original);
  });
});
