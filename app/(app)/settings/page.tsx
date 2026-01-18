import { LocalePreference } from "@/components/settings/locale-preference";
import { StandardPage } from "@/components/shell/standard-page";
import { getUserLocale } from "@/lib/locale";
import { canManageSettings } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

export default function SettingsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user } = getShellContext();

  return (
    <section className="space-y-8">
      <StandardPage
        text={text}
        pageKey="settings"
        actionEnabled={canManageSettings(user.role)}
      />
      <LocalePreference
        initialLocale={locale}
        title={text.profile.localeTitle}
        description={text.profile.localeDescription}
        label={text.profile.localeLabel}
        saveLabel={text.profile.localeSave}
        savingLabel={text.profile.localeSaving}
        savedLabel={text.profile.localeSaved}
        errorLabel={text.profile.localeError}
        localeOptions={text.profile.localeOptions}
      />
    </section>
  );
}
