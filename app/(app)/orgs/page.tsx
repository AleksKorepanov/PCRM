import { StandardPage } from "@/components/shell/standard-page";
import { getUserLocale } from "@/lib/locale";
import { canCreateRecords } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

export default function OrgsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user } = getShellContext();

  return (
    <StandardPage
      text={text}
      pageKey="orgs"
      actionEnabled={canCreateRecords(user.role)}
    />
  );
}
