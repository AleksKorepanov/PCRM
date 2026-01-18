import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('database migrations', () => {
  it('includes the expected schema tables in the initial migration', () => {
    const migrationsDir = join(process.cwd(), 'db', 'migrations');
    const migrationFiles = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'));

    expect(migrationFiles.length).toBeGreaterThan(0);

    const contents = migrationFiles
      .map((file) => readFileSync(join(migrationsDir, file), 'utf8'))
      .join('\n')
      .toLowerCase();

    const expectedTables = [
      'users',
      'workspaces',
      'workspace_members',
      'audit_logs',
      'contacts',
      'contact_aliases',
      'contact_channels',
      'tags',
      'contact_tags',
      'contact_field_privacy',
      'contact_notes',
      'organizations',
      'contact_organizations',
      'communities',
      'community_memberships',
      'interactions',
      'interaction_participants',
      'interaction_links',
      'interaction_followups',
      'commitments',
      'commitment_parties',
      'commitment_evidence',
      'needs_offers',
      'needs_offers_matches',
      'relationship_edges',
      'introductions',
      'introduction_consents',
      'introduction_messages',
      'tiers',
      'cadence_rules',
      'ai_provider_settings',
      'ai_embeddings',
      'ai_runs',
      'research_reports',
      'consents',
    ];

    expectedTables.forEach((table) => {
      expect(contents).toContain(`create table ${table}`);
    });
  });
});
