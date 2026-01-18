import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { TextCopy } from "@/lib/text";

type StandardPageProps = {
  text: TextCopy;
  pageKey: keyof TextCopy["pages"];
  actionEnabled: boolean;
};

export function StandardPage({
  text,
  pageKey,
  actionEnabled,
}: StandardPageProps) {
  const page = text.pages[pageKey];
  const actionTitle = actionEnabled ? undefined : text.actions.accessRestricted;

  return (
    <section className="space-y-6">
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!actionEnabled}
            title={actionTitle}
          >
            {page.actionLabel}
          </Button>
        }
      />
      <EmptyState
        title={page.emptyTitle}
        description={page.emptyDescription}
        action={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!actionEnabled}
            title={actionTitle}
          >
            {page.actionLabel}
          </Button>
        }
      />
    </section>
  );
}
