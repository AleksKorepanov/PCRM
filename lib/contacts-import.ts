import { ContactChannel } from "@/lib/contacts";

export type CsvFieldKey =
  | "name"
  | "email"
  | "phone"
  | "city"
  | "tier"
  | "trustScore"
  | "introducedBy"
  | "aliases"
  | "tags"
  | "organizations"
  | "communities";

export type CsvMapping = Partial<Record<CsvFieldKey, string>>;

export type ImportContactDraft = {
  name?: string;
  city?: string;
  tier?: string;
  trustScore?: number;
  introducedBy?: string;
  aliases?: string[];
  tags?: string[];
  organizations?: string[];
  communities?: string[];
  channels?: ContactChannel[];
};

export type CsvParseResult = {
  headers: string[];
  rows: string[][];
};

export type CsvPreviewRow = {
  index: number;
  contact: ImportContactDraft;
  errors: string[];
};

export type CsvPreview = {
  rows: CsvPreviewRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
};

const listSeparator = /[,;]+/g;

function normalizeHeader(value: string): string {
  return value.trim();
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(listSeparator)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCsv(text: string): CsvParseResult {
  const headers: string[] = [];
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  const flushField = () => {
    row.push(current);
    current = "";
  };

  const flushRow = () => {
    if (row.length === 0 && current === "") {
      return;
    }
    flushField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "\"") {
      const next = text[index + 1];
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (char === "," || char === "\n")) {
      flushField();
      if (char === "\n") {
        flushRow();
      }
      continue;
    }
    if (!inQuotes && char === "\r") {
      continue;
    }
    current += char;
  }
  flushRow();

  if (rows.length > 0) {
    const headerRow = rows.shift() ?? [];
    headers.push(...headerRow.map(normalizeHeader));
  }

  return { headers, rows };
}

function mapRowToContact(
  headers: string[],
  row: string[],
  mapping: CsvMapping
): ImportContactDraft {
  const getValue = (field: CsvFieldKey): string | undefined => {
    const header = mapping[field];
    if (!header) {
      return undefined;
    }
    const index = headers.findIndex((item) => item === header);
    if (index === -1) {
      return undefined;
    }
    return row[index]?.trim() || undefined;
  };

  const name = getValue("name");
  const email = getValue("email");
  const phone = getValue("phone");
  const channels: ContactChannel[] = [];
  if (email) {
    channels.push({
      id: `email-${email}`,
      type: "email",
      value: email,
      isPrimary: true,
    });
  }
  if (phone) {
    channels.push({
      id: `phone-${phone}`,
      type: "phone",
      value: phone,
      isPrimary: channels.length === 0,
    });
  }

  return {
    name,
    city: getValue("city"),
    tier: getValue("tier"),
    trustScore: parseNumber(getValue("trustScore")),
    introducedBy: getValue("introducedBy"),
    aliases: parseList(getValue("aliases")),
    tags: parseList(getValue("tags")),
    organizations: parseList(getValue("organizations")),
    communities: parseList(getValue("communities")),
    channels,
  };
}

function validateContactDraft(draft: ImportContactDraft): string[] {
  const errors: string[] = [];
  if (!draft.name && (!draft.channels || draft.channels.length === 0)) {
    errors.push("Name or channel required");
  }
  if (draft.trustScore !== undefined && (draft.trustScore < 0 || draft.trustScore > 100)) {
    errors.push("Trust score must be between 0 and 100");
  }
  return errors;
}

export function buildCsvPreview(
  parsed: CsvParseResult,
  mapping: CsvMapping
): CsvPreview {
  const rows: CsvPreviewRow[] = parsed.rows.map((row, index) => {
    const contact = mapRowToContact(parsed.headers, row, mapping);
    const errors = validateContactDraft(contact);
    return { index: index + 1, contact, errors };
  });
  const summary = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.errors.length === 0) {
        acc.valid += 1;
      } else {
        acc.invalid += 1;
      }
      return acc;
    },
    { total: 0, valid: 0, invalid: 0 }
  );
  return { rows, summary };
}

export function getValidContactsFromCsv(
  parsed: CsvParseResult,
  mapping: CsvMapping
): { contacts: ImportContactDraft[]; errors: CsvPreviewRow[] } {
  const preview = buildCsvPreview(parsed, mapping);
  return {
    contacts: preview.rows.filter((row) => row.errors.length === 0).map((row) => row.contact),
    errors: preview.rows.filter((row) => row.errors.length > 0),
  };
}

function unfoldVCardLines(lines: string[]): string[] {
  const unfolded: string[] = [];
  lines.forEach((line) => {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      const last = unfolded[unfolded.length - 1];
      unfolded[unfolded.length - 1] = `${last}${line.trim()}`;
    } else {
      unfolded.push(line);
    }
  });
  return unfolded;
}

function parseVCardName(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.includes(";")) {
    const [last, first] = value.split(";");
    return [first, last].filter(Boolean).join(" ").trim() || undefined;
  }
  return value.trim() || undefined;
}

export function parseVCard(text: string): ImportContactDraft[] {
  const lines = unfoldVCardLines(text.split(/\r?\n/));
  const contacts: ImportContactDraft[] = [];
  let current: ImportContactDraft | null = null;

  lines.forEach((line) => {
    if (line.toUpperCase() === "BEGIN:VCARD") {
      current = { channels: [] };
      return;
    }
    if (line.toUpperCase() === "END:VCARD") {
      if (current) {
        contacts.push(current);
      }
      current = null;
      return;
    }
    if (!current) {
      return;
    }
    const [rawKey, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const key = rawKey.split(";")[0]?.toUpperCase();

    if (key === "FN") {
      current.name = value || current.name;
      return;
    }
    if (key === "N") {
      current.name = current.name ?? parseVCardName(value);
      return;
    }
    if (key === "EMAIL" && value) {
      current.channels = current.channels ?? [];
      current.channels.push({
        id: `email-${value}`,
        type: "email",
        value,
        isPrimary: current.channels.length === 0,
      });
    }
    if (key === "TEL" && value) {
      current.channels = current.channels ?? [];
      current.channels.push({
        id: `phone-${value}`,
        type: "phone",
        value,
        isPrimary: current.channels.length === 0,
      });
    }
  });

  return contacts;
}

export function buildVCardPreview(drafts: ImportContactDraft[]): CsvPreview {
  const rows: CsvPreviewRow[] = drafts.map((contact, index) => ({
    index: index + 1,
    contact,
    errors: validateContactDraft(contact),
  }));
  const summary = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.errors.length === 0) {
        acc.valid += 1;
      } else {
        acc.invalid += 1;
      }
      return acc;
    },
    { total: 0, valid: 0, invalid: 0 }
  );
  return { rows, summary };
}
