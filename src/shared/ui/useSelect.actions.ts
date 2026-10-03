import type React from "react";
import { stepIndex, type SelectOption } from "./selectOptions";

export interface SelectKeyContext {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  navigable: SelectOption[];
  activeValue: string | null;
  setActiveValue: (value: string) => void;
  choose: (option: SelectOption) => void;
}

/**
 * Keyboard handler shared by the trigger and the search input. Escape is
 * not handled here: `useEscapeKey` closes only the top-most layer, so an
 * open dropdown closes before the modal it sits in.
 */
export function createSelectKeyDown(ctx: SelectKeyContext) {
  return function onKeyDown(e: React.KeyboardEvent) {
    if (!ctx.isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        ctx.open();
      }
      return;
    }

    const { navigable } = ctx;
    const current = navigable.findIndex((option) => option.value === ctx.activeValue);
    const moveTo = (index: number) => {
      const target = navigable[index];
      if (target) ctx.setActiveValue(target.value);
    };

    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        moveTo(stepIndex(navigable.length, current, e.key === "ArrowDown" ? 1 : -1));
        break;
      case "Home":
      case "End":
        e.preventDefault();
        moveTo(e.key === "Home" ? 0 : navigable.length - 1);
        break;
      case "Enter": {
        // Also keeps Enter from submitting a surrounding form.
        e.preventDefault();
        const active = navigable[current];
        if (active) ctx.choose(active);
        break;
      }
      case "Tab":
        ctx.close();
        break;
    }
  };
}
