/**
 * The decision tree: eight plain-language yes/no/not-sure questions that
 * classify the incident into a category and a priority. Declarative so the
 * questions page can render any shape of tree, and skip logic lives here
 * in exactly one place.
 */
import type { CategoryId, DecisionAnswers, Priority } from '@/lib/types';

export interface Question {
  id: string;
  /** Full i18n key for the question text (tree namespace). */
  textKey: string;
  /** Full i18n key for an optional plain-language hint. */
  hintKey?: string;
  /** When present, the question is only asked if this returns true. */
  showIf?: (a: DecisionAnswers) => boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: 'danger',
    textKey: 'tree.q.danger.text',
    hintKey: 'tree.q.danger.hint',
  },
  {
    id: 'money',
    textKey: 'tree.q.money.text',
    hintKey: 'tree.q.money.hint',
  },
  {
    id: 'access',
    textKey: 'tree.q.access.text',
    hintKey: 'tree.q.access.hint',
  },
  {
    id: 'threats',
    textKey: 'tree.q.threats.text',
    hintKey: 'tree.q.threats.hint',
  },
  {
    id: 'message',
    textKey: 'tree.q.message.text',
    hintKey: 'tree.q.message.hint',
  },
  {
    id: 'crypto',
    textKey: 'tree.q.crypto.text',
    hintKey: 'tree.q.crypto.hint',
    showIf: (a) => a.money === 'yes',
  },
  {
    id: 'ransom',
    textKey: 'tree.q.ransom.text',
    hintKey: 'tree.q.ransom.hint',
    showIf: (a) => a.access === 'yes' || a.money === 'yes',
  },
  {
    id: 'sensitive',
    textKey: 'tree.q.sensitive.text',
    hintKey: 'tree.q.sensitive.hint',
  },
];

/** The questions that apply given the answers so far, in asking order. */
export function visibleQuestions(a: DecisionAnswers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(a));
}

/**
 * Classify answers into a suggested category + priority.
 * Precedence: sensitive content first (always emergency), then ransomware,
 * crypto, money, access, threats, suspicious message, otherwise "other".
 * "Someone in danger" raises whatever priority came out to emergency.
 */
export function classify(a: DecisionAnswers): {
  category: CategoryId;
  priority: Priority;
  sensitive: boolean;
} {
  const danger = a.danger === 'yes';
  const raise = (p: Priority): Priority => (danger ? 'emergency' : p);

  if (a.sensitive === 'yes') {
    return { category: 'sensitive-content', priority: 'emergency', sensitive: true };
  }
  // Only honour a ransom answer when its question was actually asked
  // (same condition as its showIf), so a stale hidden answer cannot
  // misclassify the report.
  if ((a.access === 'yes' || a.money === 'yes') && a.ransom === 'yes') {
    return { category: 'ransomware', priority: raise('immediate'), sensitive: false };
  }
  if (a.crypto === 'yes' && a.money === 'yes') {
    return { category: 'crypto-fraud', priority: raise('immediate'), sensitive: false };
  }
  if (a.money === 'yes') {
    return { category: 'financial-fraud', priority: raise('immediate'), sensitive: false };
  }
  if (a.access === 'yes') {
    return { category: 'account-hacking', priority: raise('standard'), sensitive: false };
  }
  if (a.threats === 'yes') {
    return { category: 'harassment', priority: raise('standard'), sensitive: false };
  }
  if (a.message === 'yes') {
    return { category: 'phishing', priority: raise('standard'), sensitive: false };
  }
  return { category: 'other', priority: raise('standard'), sensitive: false };
}
