import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import React from "react";

export default function HomePage() {
  return (
    <main className="px-6 py-10 sm:px-10">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            PCRM платформа
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Управляйте отношениями в команде и строите доверие на основе данных.
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Единое пространство для контактов, интеракций, договоренностей и аналитики.
            Доступы и видимость настраиваются по ролям и рабочим пространствам.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Запустить рабочее пространство</Button>
            <Button variant="secondary">Посмотреть демо</Button>
            <Button variant="ghost">Документация</Button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Ключевые модули</h2>
              <p className="text-sm text-slate-500">
                Готовые блоки для команды и личного использования.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <li>Мульти-тенант рабочие пространства</li>
                <li>Роли: Owner, Admin, Member, Assistant, Read-only</li>
                <li>Интеракции и follow-up задачи</li>
                <li>Обязательства и индекс надежности</li>
                <li>Needs/Offers и автоматические матчи</li>
                <li>Граф отношений и цепочки интро</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-brand-50/60">
            <CardHeader>
              <h2 className="text-xl font-semibold">Контроль приватности</h2>
              <p className="text-sm text-slate-600">
                Поля и заметки скрываются по уровням доступа и аудитируются.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-700">
                <p>• Видимость полей: личная, командная, публичная.</p>
                <p>• История изменений и аудит действий.</p>
                <p>• Поиск и аналитика на базе AI + RAG.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
