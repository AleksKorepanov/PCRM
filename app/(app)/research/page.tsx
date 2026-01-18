import { headers } from "next/headers";

import { StandardPage } from "@/components/shell/standard-page";
import { canRunResearch } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText, resolveLocale } from "@/lib/text";

export default function ResearchPage() {
  const locale = resolveLocale(headers().get("accept-language"));
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
