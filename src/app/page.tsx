import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          PCRM Platform
        </p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Multi-tenant CRM foundations, ready for production.
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          This starter includes Next.js App Router, Tailwind CSS, testing, and a
          Postgres development stack so teams can start shipping fast.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>Launch Workspace</Button>
          <Button variant="secondary">Read the docs</Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Tenant-aware foundations',
            description:
              'App Router layout and strict TypeScript defaults for scalable SaaS.'
          },
          {
            title: 'Design system seeds',
            description:
              'Reusable UI primitives styled with Tailwind CSS.'
          },
          {
            title: 'Dev-ready tooling',
            description: 'Linting, formatting, and Vitest for reliable builds.'
          }
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
