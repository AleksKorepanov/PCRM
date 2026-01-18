# Local Verification

## P02

> Note: The cloud environment may block installs; commands below are the intended local checks.

1. Install dependencies:

```bash
npm install
```

2. Start services:

```bash
docker compose up -d
```

3. Database migrations:

```bash
npm run db:migrate
```

> Not available yet.

4. Run lint:

```bash
npm run lint
```

5. Run typecheck:

```bash
npm run typecheck
```

6. Run tests:

```bash
npm test
```
