# PCRM

Personal CRM (PCRM) веб-приложение на базе Next.js, TypeScript и Postgres.

## Требования

- Node.js 18+
- Docker + Docker Compose

## Локальный запуск

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Запустите Postgres:

```bash
docker compose up -d
```

3. Установите зависимости и запустите приложение:

```bash
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:3000`.

## Полезные команды

```bash
npm run lint
npm run typecheck
npm test
npm run format
```

## Архитектура

- App Router (`/app`)
- UI-примитивы в `/components/ui`
- Общие утилиты в `/lib`

## База данных

Для локальной разработки используется `docker-compose.yml`, создающий Postgres с именем базы `pcrm`.

