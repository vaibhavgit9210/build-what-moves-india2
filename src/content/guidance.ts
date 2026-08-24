/**
 * "Do these things now" guidance per category. CONTRACT FILE — the shape
 * below is imported by both the guidance page and the review page.
 * (In production this content would come from official NCRP guidance;
 * here it is clearly-labeled demo content based on public recommendations.)
 *
 * All strings live in the i18n `tree.guidance.*` namespace.
 */
import type { CategoryId } from '@/lib/types';

export interface GuidanceStep {
  /** i18n key for the short imperative title, e.g. "Call 1930". */
  titleKey: string;
  /** i18n key for the one-or-two-sentence explanation. */
  bodyKey: string;
  /** Optional tel: number to render as a large call link. */
  tel?: string;
}

function steps(cat: string, count: number, tels: Record<number, string> = {}): GuidanceStep[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const tel = tels[n];
    return {
      titleKey: `tree.guidance.${cat}.s${n}.title`,
      bodyKey: `tree.guidance.${cat}.s${n}.body`,
      ...(tel ? { tel } : {}),
    };
  });
}

export const guidanceByCategory: Record<CategoryId, GuidanceStep[]> = {
  'financial-fraud': steps('financial-fraud', 4, { 1: '1930' }),
  'investment-job-fraud': steps('investment-job-fraud', 3, { 1: '1930' }),
  'loan-app-abuse': steps('loan-app-abuse', 3),
  'romance-scam': steps('romance-scam', 3, { 2: '1930' }),
  sextortion: steps('sextortion', 4),
  'account-hacking': steps('account-hacking', 4),
  phishing: steps('phishing', 4),
  harassment: steps('harassment', 4),
  impersonation: steps('impersonation', 3),
  'social-media-abuse': steps('social-media-abuse', 3),
  ransomware: steps('ransomware', 4),
  'crypto-fraud': steps('crypto-fraud', 3, { 3: '1930' }),
  'identity-theft': steps('identity-theft', 3),
  'data-breach': steps('data-breach', 3),
  'sensitive-content': steps('sensitive-content', 4, { 1: '1098' }),
  'child-safety': steps('child-safety', 4, { 1: '1098' }),
  other: steps('other', 3),
};
