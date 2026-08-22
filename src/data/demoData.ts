/**
 * Synthetic seed data: 5 users, 8 reports. All obviously fake.
 * Seeding is idempotent (versioned) and runs before first render.
 */
import { loadJSON, saveJSON, KEYS } from '@/lib/storage';
import { hashPassword } from '@/services/authService';
import type { Report, User } from '@/lib/types';

const SEED_VERSION = 1;

const T = (daysAgo: number, h = 14, m = 34) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

// Intentionally public demo credential (shown in the UI and README). gitleaks:allow
export const DEMO_LOGIN = { handle: 'demo@example.com', password: 'Demo@123' }; // gitleaks:allow

export async function seedDemoData(): Promise<void> {
  if (loadJSON<number>(KEYS.seedVersion, 0) >= SEED_VERSION) return;

  const pw = await hashPassword(DEMO_LOGIN.password);
  const users: User[] = [
    {
      id: 'u-rahul',
      name: 'Rahul Sharma',
      idMethod: 'email',
      identifier: 'demo@example.com',
      email: 'demo@example.com',
      mobile: '98XXXXXX21',
      passwordHash: pw,
      state: 'Karnataka',
      createdAt: T(120),
      isDemo: true,
    },
    { id: 'u-priya', name: 'Priya Verma', idMethod: 'aadhaar', identifier: 'XXXX XXXX 5678', email: 'priya@example.com', mobile: '97XXXXXX10', passwordHash: pw, state: 'Delhi', createdAt: T(200) },
    { id: 'u-arjun', name: 'Arjun Patel', idMethod: 'pan', identifier: 'FGHIJ5678K', email: 'arjun@example.com', mobile: '96XXXXXX33', passwordHash: pw, state: 'Gujarat', createdAt: T(90) },
    { id: 'u-sneha', name: 'Sneha Das', idMethod: 'voter-id', identifier: 'WBX9876543', email: 'sneha@example.com', mobile: '95XXXXXX87', passwordHash: pw, state: 'West Bengal', createdAt: T(60) },
    { id: 'u-aamir', name: 'Aamir Khan', idMethod: 'mobile', identifier: '94XXXXXX55', email: 'aamir@example.com', mobile: '94XXXXXX55', passwordHash: pw, state: 'Maharashtra', createdAt: T(45) },
  ];

  const mk = (
    id: string,
    userId: string,
    refDay: number,
    category: Report['category'],
    status: Report['status'],
    lang: string,
    text: string,
    extra: Partial<Report> = {},
  ): Report => {
    const submittedAt = T(refDay);
    const d = new Date(submittedAt);
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const seq = ['submitted', 'received', 'under-review', 'assigned', 'investigation', 'resolved'] as const;
    const upto = seq.indexOf(status);
    return {
      id,
      refNumber: `NCRP-DEMO-${ymd}-${String(20000 + refDay * 137).slice(0, 5)}`,
      userId,
      category,
      priority: category === 'financial-fraud' || category === 'crypto-fraud' ? 'immediate' : 'standard',
      submittedAt,
      status,
      timeline: seq.slice(0, upto + 1).map((s, i) => ({ status: s, at: T(refDay - i * 2, 14 + i, 5 * i) })),
      answers: {},
      incidentDetails: {},
      evidence: [],
      lang,
      ...extra,
    };
  };

  const reports: Report[] = [
    mk('r-1', 'u-rahul', 34, 'account-hacking', 'under-review', 'en',
      'My email account was accessed from an unknown device and the recovery number was changed.', {
        description: { mode: 'typed', language: 'en', text: 'My email account was accessed from an unknown device and the recovery number was changed.' },
        incidentDetails: { platform: 'Email', noticedAt: '2026-07-19', stillAccessible: 'No' },
        evidence: [{ id: 'e-1', kind: 'screenshot', name: 'login-alert.png', size: 234567, mime: 'image/png' }],
      }),
    mk('r-2', 'u-rahul', 6, 'financial-fraud', 'received', 'en',
      'Received a call claiming to be my bank. Shared an OTP and lost ₹20,000 through UPI.', {
        description: { mode: 'voice', language: 'en', text: 'Received a call claiming to be my bank. Shared an OTP and lost twenty thousand rupees through UPI.', originalTranscript: 'received a call claiming to be my bank...', audioDurationSec: 41, transcriptProvider: 'demo' },
        incidentDetails: { amount: '20000', paymentMethod: 'UPI', bank: 'Demo Bank of India', transactionId: 'UPI-DEMO-448291' },
        evidence: [
          { id: 'e-2', kind: 'screenshot', name: 'upi-receipt.png', size: 187000, mime: 'image/png' },
          { id: 'e-3', kind: 'chat', name: 'sms-thread.txt', size: 2100, mime: 'text/plain' },
        ],
      }),
    mk('r-3', 'u-priya', 52, 'harassment', 'resolved', 'hi',
      'सोशल मीडिया पर लगातार धमकी भरे संदेश मिल रहे थे।', {
        description: { mode: 'typed', language: 'hi', text: 'सोशल मीडिया पर लगातार धमकी भरे संदेश मिल रहे थे।' },
      }),
    mk('r-4', 'u-priya', 12, 'phishing', 'assigned', 'hi',
      'बिजली बिल के नाम पर एक फ़र्ज़ी लिंक भेजा गया।', {
        description: { mode: 'typed', language: 'hi', text: 'बिजली बिल के नाम पर एक फ़र्ज़ी लिंक भेजा गया।' },
      }),
    mk('r-5', 'u-arjun', 28, 'crypto-fraud', 'investigation', 'en',
      'Invested in a crypto scheme promoted on a messaging app; the platform disappeared.', {
        incidentDetails: { amount: '150000', platform: 'DemoCoin Exchange' },
      }),
    mk('r-6', 'u-sneha', 20, 'impersonation', 'under-review', 'en',
      'A fake profile using my photos is messaging my contacts asking for money.', {
        incidentDetails: { platform: 'Instagram', profileUrl: 'https://example.com/fake-profile' },
        evidence: [{ id: 'e-4', kind: 'url', name: 'Fake profile link', url: 'https://example.com/fake-profile' }],
      }),
    mk('r-7', 'u-aamir', 15, 'ransomware', 'assigned', 'en',
      'Office laptop files were encrypted; a note demanded payment in cryptocurrency.'),
    mk('r-8', 'u-aamir', 3, 'social-media-abuse', 'submitted', 'en',
      'Abusive comments and morphed images are being posted about me in a public group.'),
  ];

  // Merge without clobbering anything the user has already created.
  const existingUsers = loadJSON<User[]>(KEYS.users, []);
  const existingReports = loadJSON<Report[]>(KEYS.reports, []);
  const userIds = new Set(existingUsers.map((u) => u.id));
  const reportIds = new Set(existingReports.map((r) => r.id));
  saveJSON(KEYS.users, [...existingUsers, ...users.filter((u) => !userIds.has(u.id))]);
  saveJSON(KEYS.reports, [...existingReports, ...reports.filter((r) => !reportIds.has(r.id))]);
  saveJSON(KEYS.seedVersion, SEED_VERSION);
}
