import { describe, it, expect } from "vitest";
import { NO_DIALOG, isDialog, type SidebarDialog } from "../features/branch/model/sidebarDialog";
import { type TagItem } from "../ipc/bindings.generated";

describe("SidebarDialog", () => {
  it("starts closed", () => {
    expect(NO_DIALOG.kind).toBe("none");
  });

  it("isDialog narrows to the matching variant", () => {
    const dialog: SidebarDialog = { kind: "renameBranch", name: "feature/login" };

    expect(isDialog(dialog, "renameBranch")).toBe(true);
    if (isDialog(dialog, "renameBranch")) {
      // Compiles only because the guard narrowed the union.
      expect(dialog.name).toBe("feature/login");
    }
  });

  it("isDialog rejects a different variant", () => {
    const dialog: SidebarDialog = { kind: "deleteBranch", name: "old" };
    expect(isDialog(dialog, "renameBranch")).toBe(false);
  });

  it("carries the payload each dialog needs", () => {
    const merge: SidebarDialog = { kind: "merge", targetBranch: "develop" };
    const compare: SidebarDialog = { kind: "compare", baseRev: "main", targetRev: "feature" };
    const conflict: SidebarDialog = {
      kind: "checkoutConflict",
      targetBranch: "main",
      errorMessage: "CHECKOUT_CONFLICT",
    };

    expect(isDialog(merge, "merge") && merge.targetBranch).toBe("develop");
    expect(isDialog(compare, "compare") && compare.baseRev).toBe("main");
    expect(isDialog(conflict, "checkoutConflict") && conflict.errorMessage).toBe(
      "CHECKOUT_CONFLICT"
    );
  });

  it("replacing the dialog closes the previous one", () => {
    // The sidebar held one useState per dialog, so two could be open at once.
    // With a single union-typed slot, opening one necessarily closes the
    // other — this is the invariant that replaces the old flag juggling.
    let dialog: SidebarDialog = { kind: "createTag", commitId: "abc123" };
    expect(isDialog(dialog, "createTag")).toBe(true);

    dialog = { kind: "deleteTag", tag: { name: "v1" } as TagItem };

    expect(isDialog(dialog, "createTag")).toBe(false);
    expect(isDialog(dialog, "deleteTag")).toBe(true);
  });

  it("returns to the closed state", () => {
    let dialog: SidebarDialog = { kind: "merge", targetBranch: "develop" };
    dialog = NO_DIALOG;
    expect(isDialog(dialog, "merge")).toBe(false);
    expect(dialog.kind).toBe("none");
  });
});
