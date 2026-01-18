import { StandardPage } from "@/components/shell/standard-page";
import { getUserLocale } from "@/lib/locale";
import { canRunResearch } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

export default function ResearchPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user } = getShellContext();

  return (
    <StandardPage
      text={text}
      pageKey="research"
      actionEnabled={canRunResearch(user.role)}
    />
  );
}
