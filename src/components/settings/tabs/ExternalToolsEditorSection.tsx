import React from "react";
import { useTranslation } from "../../../i18n";
import { Input, Select } from "../../../shared/ui";
import { useSettingsStore, type DefaultEditor } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../../../features/settings";

/** Default editor picker plus the custom command field. */
export const ExternalToolsEditorSection: React.FC = () => {
  const { t } = useTranslation();
  const tools = t.settings.tools;
  const { defaultEditor, customEditorCommand, setDefaultEditor, setCustomEditorCommand } =
    useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.editor}>
      <SettingsRow
        label={tools.editorTitle}
        description={tools.editorDesc}
        help={
          <HelpTooltip
            title={t.settings.help.toolsEditorTitle}
            description={t.settings.help.toolsEditorDesc}
            tag={t.settings.help.tagIntegration}
          />
        }
      >
        <Select
          data-testid="editor-select"
          aria-label={tools.editorTitle}
          value={defaultEditor}
          onChange={(value) => setDefaultEditor(value as DefaultEditor)}
          options={[
            { value: "code", label: tools.editorVsCode },
            { value: "cursor", label: tools.editorCursor },
            { value: "subl", label: tools.editorSublime },
            { value: "notepad++", label: tools.editorNotepadPlusPlus },
            { value: "custom", label: tools.editorCustom },
          ]}
          className="w-72"
        />
      </SettingsRow>
      {defaultEditor === "custom" && (
        <SettingsRow label={tools.editorCustom} htmlFor="custom-editor-command">
          <Input
            id="custom-editor-command"
            size="md"
            mono
            className="w-72"
            data-testid="custom-editor-input"
            value={customEditorCommand}
            onChange={(e) => setCustomEditorCommand(e.target.value)}
            placeholder={tools.editorCustomPlaceholder}
          />
        </SettingsRow>
      )}
    </SettingsSection>
  );
};
