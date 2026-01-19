# P13 Blocker

Pre-flight checks failed for P13.

## Missing prerequisite data
- Tier seed data is missing. The database has a `tiers` table migration, but no seed entries were found in `db/seeds/seed.sql`.

## Next steps
- Add tier seed data to `db/seeds/seed.sql` (or the appropriate seed mechanism), then re-run the P13 pre-flight checks.
