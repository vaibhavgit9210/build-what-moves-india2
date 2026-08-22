/**
 * Simulated document classification / OCR. No file ever leaves the browser
 * and nothing is actually read from the image — the "extraction" is
 * deterministic demo data so the review-and-edit UX can be exercised.
 */
import type { DocType } from '@/lib/types';

export interface OcrResult {
  docType: DocType;
  name: string;
  idNumber: string;
  dob: string; // e.g. "14 May 1998"
  confidence: number; // 0..1, always < 1 — the UI must ask the user to check
}

export type OcrError = 'unreadable' | 'too-large';

const DEMO_EXTRACT: Record<DocType, Omit<OcrResult, 'docType' | 'confidence'>> = {
  aadhaar: { name: 'Rahul Sharma', idNumber: 'XXXX XXXX 1234', dob: '14 May 1998' },
  pan: { name: 'Rahul Sharma', idNumber: 'ABCDE1234F', dob: '14 May 1998' },
  passport: { name: 'Rahul Sharma', idNumber: 'P1234567', dob: '14 May 1998' },
  'driving-licence': { name: 'Rahul Sharma', idNumber: 'KA05 20260001234', dob: '14 May 1998' },
  'voter-id': { name: 'Rahul Sharma', idNumber: 'ABC1234567', dob: '14 May 1998' },
  'ration-card': { name: 'Rahul Sharma', idNumber: 'RC-29-0012345', dob: '14 May 1998' },
  other: { name: 'Rahul Sharma', idNumber: 'ID-000123', dob: '14 May 1998' },
};

const KEYWORDS: Array<[RegExp, DocType]> = [
  [/aadha?ar|uidai/i, 'aadhaar'],
  [/pan/i, 'pan'],
  [/passport/i, 'passport'],
  [/driv|licen|dl[-_ ]/i, 'driving-licence'],
  [/voter|epic/i, 'voter-id'],
  [/ration/i, 'ration-card'],
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * "Classify" an uploaded document. Deterministic: filename keywords pick the
 * type; otherwise a filename hash does. Non-image/PDF files and huge files
 * reject so the manual-fallback UX can be exercised.
 */
export async function classifyDocument(file: File, ownerName?: string): Promise<OcrResult> {
  await delay(1600 + (hashStr(file.name) % 700)); // feel like real work
  if (file.size > 10 * 1024 * 1024) throw 'too-large' as OcrError;
  const looksVisual = /^image\//.test(file.type) || file.type === 'application/pdf';
  if (file.type && !looksVisual) throw 'unreadable' as OcrError;

  let docType: DocType | undefined;
  for (const [re, t] of KEYWORDS) {
    if (re.test(file.name)) {
      docType = t;
      break;
    }
  }
  if (!docType) {
    const pool: DocType[] = ['aadhaar', 'pan', 'passport', 'driving-licence', 'voter-id'];
    docType = pool[hashStr(file.name + file.size) % pool.length];
  }
  const base = DEMO_EXTRACT[docType];
  return {
    docType,
    ...base,
    name: ownerName?.trim() || base.name,
    confidence: 0.82 + ((hashStr(file.name) % 10) / 100),
  };
}
