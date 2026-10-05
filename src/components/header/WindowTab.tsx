import React from "react";
import { TAB_TYPE } from "../../domain/enums";
import { type TabItem } from "../../types/tab";
import { HomeWindowTab } from "./HomeWindowTab";
import { RepoWindowTab } from "./RepoWindowTab";

interface WindowTabProps {
  tab: TabItem;
  isActive: boolean;
  showSeparator: boolean;
  onSelect: () => void;
  onClose: () => void;
}

/** A single tab in the WindowTabBar: either the fixed Home tab or an opened repo tab. */
export const WindowTab: React.FC<WindowTabProps> = ({
  tab,
  isActive,
  showSeparator,
  onSelect,
  onClose,
}) => {
  if (tab.type === TAB_TYPE.HOME) {
    return <HomeWindowTab isActive={isActive} showSeparator={showSeparator} onSelect={onSelect} />;
  }

  return (
    <RepoWindowTab
      tab={tab}
      isActive={isActive}
      showSeparator={showSeparator}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
};
