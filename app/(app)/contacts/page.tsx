import { StandardPage } from "@/components/shell/standard-page";
import { getUserLocale } from "@/lib/locale";
import { canCreateRecords } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

export default function ContactsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user } = getShellContext();

  return (
    <StandardPage
      text={text}
      pageKey="contacts"
      actionEnabled={canCreateRecords(user.role)}
    />
  );
}
