import drugInfoData from "@/data/drug-info.json";

export interface DrugInfoEntry {
  id: string;
  names: string[];
  used_for: string;
  how_to_take: string;
  if_missed: string;
  common_side_effects: string[];
  seek_help_if: string[];
  source_url: string;
  source_title: string;
  source_last_reviewed: string;
  retrieved: string;
}

const drugInfo: DrugInfoEntry[] = drugInfoData as DrugInfoEntry[];

/**
 * Find a drug entry by name, comparing case-insensitively against
 * the entry "id" and all values in "names".
 */
export function findDrugInfo(drugName: string): DrugInfoEntry | undefined {
  const normalized = drugName.trim().toLowerCase();
  if (!normalized) return undefined;
  return drugInfo.find((entry) => {
    if (entry.id.toLowerCase() === normalized) return true;
    return entry.names.some((n) => n.toLowerCase() === normalized);
  });
}

/**
 * Return the drug info id for a given drug name, or undefined if not found.
 */
export function getDrugId(drugName: string): string | undefined {
  return findDrugInfo(drugName)?.id;
}

/**
 * Build a plain-English source text from a drug info entry.
 * This is the authoritative text that the LLM may translate/simplify.
 */
export function buildSourceText(entry: DrugInfoEntry): string {
  const parts: string[] = [];
  parts.push(`Used for: ${entry.used_for}`);
  parts.push(`How to take: ${entry.how_to_take}`);
  parts.push(`If you miss a dose: ${entry.if_missed}`);
  if (entry.common_side_effects.length > 0) {
    parts.push(
      `Common side effects: ${entry.common_side_effects.join("; ")}`
    );
  }
  if (entry.seek_help_if.length > 0) {
    parts.push(`Seek help if: ${entry.seek_help_if.join("; ")}`);
  }
  return parts.join("\n\n");
}
