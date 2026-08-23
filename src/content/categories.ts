/**
 * Prototype crime categories. These are plain-language demo categories that
 * would map to the official NCRP taxonomy in a production system.
 * Labels live in the i18n common namespace as `categories.<id>`.
 */
import type { CategoryId, Priority } from '@/lib/types';

export interface CategoryDef {
  id: CategoryId;
  /** i18n key for the label. */
  labelKey: string;
  /** i18n key for a one-line description. */
  descKey: string;
  /** i18n key for the expandable plain-language legal definition. */
  legalKey: string;
  defaultPriority: Priority;
  /** Sensitive workflows get extra-careful language and routing. */
  sensitive?: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'financial-fraud', labelKey: 'categories.financial-fraud', descKey: 'categoryDesc.financial-fraud', legalKey: 'categoryLegal.financial-fraud', defaultPriority: 'immediate' },
  { id: 'account-hacking', labelKey: 'categories.account-hacking', descKey: 'categoryDesc.account-hacking', legalKey: 'categoryLegal.account-hacking', defaultPriority: 'standard' },
  { id: 'phishing', labelKey: 'categories.phishing', descKey: 'categoryDesc.phishing', legalKey: 'categoryLegal.phishing', defaultPriority: 'standard' },
  { id: 'harassment', labelKey: 'categories.harassment', descKey: 'categoryDesc.harassment', legalKey: 'categoryLegal.harassment', defaultPriority: 'standard' },
  { id: 'impersonation', labelKey: 'categories.impersonation', descKey: 'categoryDesc.impersonation', legalKey: 'categoryLegal.impersonation', defaultPriority: 'standard' },
  { id: 'social-media-abuse', labelKey: 'categories.social-media-abuse', descKey: 'categoryDesc.social-media-abuse', legalKey: 'categoryLegal.social-media-abuse', defaultPriority: 'standard' },
  { id: 'ransomware', labelKey: 'categories.ransomware', descKey: 'categoryDesc.ransomware', legalKey: 'categoryLegal.ransomware', defaultPriority: 'immediate' },
  { id: 'crypto-fraud', labelKey: 'categories.crypto-fraud', descKey: 'categoryDesc.crypto-fraud', legalKey: 'categoryLegal.crypto-fraud', defaultPriority: 'immediate' },
  { id: 'identity-theft', labelKey: 'categories.identity-theft', descKey: 'categoryDesc.identity-theft', legalKey: 'categoryLegal.identity-theft', defaultPriority: 'standard' },
  { id: 'sensitive-content', labelKey: 'categories.sensitive-content', descKey: 'categoryDesc.sensitive-content', legalKey: 'categoryLegal.sensitive-content', defaultPriority: 'emergency', sensitive: true },
  { id: 'other', labelKey: 'categories.other', descKey: 'categoryDesc.other', legalKey: 'categoryLegal.other', defaultPriority: 'standard' },
];

export function categoryById(id: CategoryId): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
