import { setGitConfig, setRepoPullRebase } from "../api";
import type { Translations } from "../../../i18n/vi";
import {
  SETTINGS_SCOPE,
  PULL_STRATEGY,
  CONFIG_SCOPE,
  type SettingsScope,
  type PullStrategy,
} from "../../../domain/enums";

export interface GitBehaviorActionsContext {
  currentRepoPath: string | null;
  activeScope: SettingsScope;
  fetchPrune: boolean;
  rebaseAutostash: boolean;
  t: Translations;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  setGlobalPullRebase: (value: boolean) => void;
  setLocalPullRebase: (value: boolean | null) => void;
  setFetchPrune: (value: boolean) => void;
  setRebaseAutostash: (value: boolean) => void;
  setSaving: (value: boolean) => void;
  setAutoFetchInterval: (value: number) => void;
}

export function createGlobalPullStrategyHandler(context: GitBehaviorActionsContext) {
  return async (isRebase: boolean) => {
    context.setGlobalPullRebase(isRebase);
    context.setSaving(true);
    try {
      await setGitConfig(null, "global", "pull.rebase", String(isRebase));
      context.showSuccess(context.t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update global pull strategy:", err);
      context.showError(String(err));
    } finally {
      context.setSaving(false);
    }
  };
}

export function createRepoPullStrategyHandler(context: GitBehaviorActionsContext) {
  return async (mode: PullStrategy) => {
    const { currentRepoPath } = context;
    if (!currentRepoPath) return;
    context.setSaving(true);
    try {
      if (mode === PULL_STRATEGY.INHERIT) {
        await setGitConfig(currentRepoPath, "local", "pull.rebase", "");
        context.setLocalPullRebase(null);
      } else {
        const isRebase = mode === PULL_STRATEGY.REBASE;
        await setRepoPullRebase(currentRepoPath, isRebase);
        context.setLocalPullRebase(isRebase);
      }
      context.showSuccess(context.t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update repo pull strategy:", err);
      context.showError(String(err));
    } finally {
      context.setSaving(false);
    }
  };
}

export function createToggleFetchPruneHandler(context: GitBehaviorActionsContext) {
  return async () => {
    const nextVal = !context.fetchPrune;
    context.setFetchPrune(nextVal);
    context.setSaving(true);
    try {
      const configScope =
        context.activeScope === SETTINGS_SCOPE.REPO && context.currentRepoPath
          ? CONFIG_SCOPE.LOCAL
          : CONFIG_SCOPE.GLOBAL;
      const repo = context.activeScope === SETTINGS_SCOPE.REPO ? context.currentRepoPath : null;
      await setGitConfig(repo, configScope, "fetch.prune", String(nextVal));
      context.showSuccess(context.t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update fetch.prune:", err);
      context.showError(String(err));
    } finally {
      context.setSaving(false);
    }
  };
}

export function createToggleRebaseAutostashHandler(context: GitBehaviorActionsContext) {
  return async () => {
    const nextVal = !context.rebaseAutostash;
    context.setRebaseAutostash(nextVal);
    context.setSaving(true);
    try {
      const configScope =
        context.activeScope === SETTINGS_SCOPE.REPO && context.currentRepoPath
          ? CONFIG_SCOPE.LOCAL
          : CONFIG_SCOPE.GLOBAL;
      const repo = context.activeScope === SETTINGS_SCOPE.REPO ? context.currentRepoPath : null;
      await setGitConfig(repo, configScope, "rebase.autoStash", String(nextVal));
      context.showSuccess(context.t.settings.profile.savedSuccess);
    } catch (err) {
      console.error("Failed to update rebase.autoStash:", err);
      context.showError(String(err));
    } finally {
      context.setSaving(false);
    }
  };
}

export function createAutoFetchChangeHandler(context: GitBehaviorActionsContext) {
  return (seconds: number) => {
    context.setAutoFetchInterval(seconds);
    context.showSuccess(context.t.settings.profile.savedSuccess);
  };
}
