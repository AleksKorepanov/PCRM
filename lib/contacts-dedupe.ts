import { Contact } from "@/lib/contacts";

export type DedupeSuggestion = {
  contactId: string;
  candidateId: string;
  score: number;
  reasons: string[];
};

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function buildTrigrams(value: string): Set<string> {
  const padded = `  ${value}  `;
  const trigrams = new Set<string>();
  for (let index = 0; index < padded.length - 2; index += 1) {
    trigrams.add(padded.slice(index, index + 3));
  }
  return trigrams;
}

function trigramSimilarity(left: string, right: string): number {
  if (!left || !right) {
    return 0;
  }
  const leftSet = buildTrigrams(left);
  const rightSet = buildTrigrams(right);
  let intersection = 0;
  leftSet.forEach((tri) => {
    if (rightSet.has(tri)) {
      intersection += 1;
    }
  });
  return (2 * intersection) / (leftSet.size + rightSet.size);
}

function extractEmails(contact: Contact): string[] {
  return contact.channels
    .filter((channel) => channel.type === "email")
    .map((channel) => normalize(channel.value))
    .filter(Boolean);
}

function extractPhones(contact: Contact): string[] {
  return contact.channels
    .filter((channel) => channel.type === "phone")
    .map((channel) => normalize(channel.value))
    .filter(Boolean);
}

function hasOverlap(left: string[], right: string[]): boolean {
  const set = new Set(left);
  return right.some((value) => set.has(value));
}

function hasOrgOverlap(left: Contact, right: Contact): boolean {
  const leftSet = new Set(left.organizations.map(normalize));
  return right.organizations.some((org) => leftSet.has(normalize(org)));
}

export function suggestDuplicates(contacts: Contact[]): DedupeSuggestion[] {
  const suggestions: DedupeSuggestion[] = [];

  for (let i = 0; i < contacts.length; i += 1) {
    for (let j = i + 1; j < contacts.length; j += 1) {
      const left = contacts[i];
      const right = contacts[j];
      const reasons: string[] = [];
      let score = 0;

      const leftEmails = extractEmails(left);
      const rightEmails = extractEmails(right);
      if (hasOverlap(leftEmails, rightEmails) && leftEmails.length > 0) {
        reasons.push("Exact email match");
        score += 0.8;
      }

      const leftPhones = extractPhones(left);
      const rightPhones = extractPhones(right);
      if (hasOverlap(leftPhones, rightPhones) && leftPhones.length > 0) {
        reasons.push("Exact phone match");
        score += 0.8;
      }

      const nameSimilarity = trigramSimilarity(normalize(left.name), normalize(right.name));
      if (nameSimilarity >= 0.45) {
        reasons.push("Fuzzy name match");
        score += nameSimilarity * 0.6;
        if (normalize(left.city) && normalize(left.city) === normalize(right.city)) {
          reasons.push("Same city");
          score += 0.1;
        }
        if (hasOrgOverlap(left, right)) {
          reasons.push("Shared organization");
          score += 0.1;
        }
      }

      if (reasons.length > 0) {
        suggestions.push({
          contactId: left.id,
          candidateId: right.id,
          score: Math.min(1, Number(score.toFixed(2))),
          reasons,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
