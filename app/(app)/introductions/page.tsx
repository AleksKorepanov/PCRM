import { StandardPage } from "@/components/shell/standard-page";
import { getUserLocale } from "@/lib/locale";
import { canCoordinateIntroductions } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

export default function IntroductionsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user } = getShellContext();

  return (
    <StandardPage
      text={text}
      pageKey="introductions"
      actionEnabled={canCoordinateIntroductions(user.role)}
    />
  );
}
