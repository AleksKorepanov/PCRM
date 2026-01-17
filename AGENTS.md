# AGENTS.md — PCRM instructions for Codex

## Product scope
Build a production-ready Personal CRM (PCRM) web app:
- Multi-tenant workspaces
- RBAC: Owner, Admin, Member, Assistant, Read-only
- Contacts: dedupe/merge, orgs, communities, tags, tiers, trust context
- Interactions timeline + follow-ups
- Commitments register + reliability index
- Needs/Offers + matching + weekly digest
- Introductions workflow with consent + outcomes
- Relationship graph (introduced-by chain) + path search
- Analytics dashboards + exports
- Privacy: per-field and per-note visibility + audit logs
- AI: ChatGPT integration for embeddings, semantic search, and research (RAG + tool-calling)

## i18n
- Default UI language: Russian (ru)
- Per-user language selection: ru/en
- Fallback to ru

## Engineering standards
- TypeScript everywhere
- Workspace scoping on every query
- Run: lint, typecheck, tests for every PR
- Add migrations + indexes; keep migrations repeatable
- Do not log PII or secrets

## Verification
Always provide commands you ran and ensure they pass:
- npm run lint
- npm run typecheck
- npm test
- npm run db:migrate (when applicable)
