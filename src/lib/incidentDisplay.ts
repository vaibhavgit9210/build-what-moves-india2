/**
 * Turning stored incidentDetails into labelled rows. Shared by the reporter's
 * report page and the authority's ticket page so both read the same way.
 */
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import type { CategoryId } from '@/lib/types';

/** "amount-lost" / "amountLost" -> "Amount Lost". Fallback for unknown ids only. */
export function humanize(id: string): string {
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Field definitions keyed by id: the report's category fields first, then all
 * other categories as a fallback for ids stored under a different category.
 */
export function incidentFieldById(category: CategoryId | undefined): Map<string, IncidentField> {
  const map = new Map<string, IncidentField>();
  const lists: IncidentField[][] = category ? [incidentFieldsByCategory[category]] : [];
  lists.push(...Object.values(incidentFieldsByCategory));
  for (const fields of lists) {
    for (const field of fields) {
      if (!map.has(field.id)) map.set(field.id, field);
    }
  }
  return map;
}
