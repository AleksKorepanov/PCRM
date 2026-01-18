import { headers } from "next/headers";

import { StandardPage } from "@/components/shell/standard-page";
import { canManageCommitments } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText, resolveLocale } from "@/lib/text";

export default function CommitmentsPage() {
  const locale = resolveLocale(headers().get("accept-language"));
  const text = getText(locale);
  const { user } = getShellContext();

  return (
    <StandardPage
      text={text}
      pageKey="commitments"
      actionEnabled={canManageCommitments(user.role)}
    />
  );
}
