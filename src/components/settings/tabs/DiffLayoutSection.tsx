import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl } from "../../../shared/ui";
import {
  useSettingsStore,
  type DiffFontSize,
  type DiffTabSize,
  type DiffViewMode,
} from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { DiffModeDiagram } from "../helpDiagrams";
import { SettingsRow, SettingsSection } from "../../../features/settings";

const FONT_SIZES: DiffFontSize[] = [12, 13, 14, 16];
const TAB_SIZES: DiffTabSize[] = [2, 4, 8];

/** Diff view mode, code font size and tab width. */
export const DiffLayoutSection: React.FC = () => {
  const { t } = useTranslation();
  const d = t.settings.diff;
  const h = t.settings.help;
  const s = useSettingsStore();
  const fontLabels: Record<DiffFontSize, string> = {
    12: d.fontSize12,
    13: d.fontSize13,
    14: d.fontSize14,
    16: d.fontSize16,
  };
  const tabLabels: Record<DiffTabSize, string> = { 2: d.tabSize2, 4: d.tabSize4, 8: d.tabSize8 };

  return (
    <SettingsSection title={t.settings.sections.layout}>
      <SettingsRow
        label={d.viewModeTitle}
        labelId="diff-mode-label"
        description={s.diffViewMode === "split" ? d.viewModeSplitDesc : d.viewModeUnifiedDesc}
        help={
          <HelpTooltip
            title={h.diffModeTitle}
            description={h.diffModeDesc}
            tag={h.tagVisual}
            diagram={<DiffModeDiagram />}
          />
        }
      >
        <SegmentedControl<DiffViewMode>
          aria-labelledby="diff-mode-label"
          value={s.diffViewMode}
          onChange={s.setDiffViewMode}
          options={[
            { value: "unified", label: d.viewModeUnifiedShort, testId: "diff-mode-unified" },
            { value: "split", label: d.viewModeSplitShort, testId: "diff-mode-split" },
          ]}
        />
      </SettingsRow>
      <SettingsRow
        label={d.fontSizeTitle}
        labelId="diff-fontsize-label"
        help={<HelpTooltip title={h.diffFontSizeTitle} description={h.diffFontSizeDesc} />}
      >
        <SegmentedControl<DiffFontSize>
          aria-labelledby="diff-fontsize-label"
          value={s.diffFontSize}
          onChange={s.setDiffFontSize}
          options={FONT_SIZES.map((size) => ({
            value: size,
            label: fontLabels[size],
            testId: `diff-fontsize-${size}`,
          }))}
        />
      </SettingsRow>
      <SettingsRow label={d.tabSizeTitle} labelId="diff-tabsize-label">
        <SegmentedControl<DiffTabSize>
          aria-labelledby="diff-tabsize-label"
          value={s.diffTabSize}
          onChange={s.setDiffTabSize}
          options={TAB_SIZES.map((size) => ({
            value: size,
            label: tabLabels[size],
            testId: `diff-tabsize-${size}`,
          }))}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
