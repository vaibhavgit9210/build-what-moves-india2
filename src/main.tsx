import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/global.css';
import { router } from './router';
import { I18nProvider } from './i18n';
import { AuthProvider } from './state/AuthContext';
import { DraftProvider } from './state/DraftContext';
import { SettingsProvider } from './state/SettingsContext';
import { seedDemoData } from './data/demoData';
import { clearAll, saveJSON, KEYS } from './lib/storage';

async function boot() {
  // Test/screenshot hooks (documented in README):
  //   ?e2e=reset  — wipe all demo storage
  //   ?e2e=login  — sign in as the demo account without the form
  //   ?e2e=draft  — sign in AND seed a filled-in in-progress draft report
  const params = new URLSearchParams(window.location.search);
  const e2e = params.get('e2e');
  if (e2e === 'reset') clearAll();

  await seedDemoData();

  if (e2e === 'login' || e2e === 'draft') saveJSON(KEYS.session, 'u-rahul');
  if (e2e === 'draft') {
    saveJSON(KEYS.draft, {
      startedAt: new Date().toISOString(),
      lastPath: '/report/review',
      consent: { location: true, technical: true },
      location: {
        method: 'auto',
        address: {
          house: '221, 4th Block', street: '80 Feet Road', locality: 'Koramangala',
          city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pin: '560034',
        },
      },
      identity: {
        method: 'upload', docType: 'aadhaar', name: 'Rahul Sharma',
        idNumber: 'XXXX XXXX 1234', dob: '14 May 1998', fileName: 'aadhaar-front.jpg',
      },
      answers: { danger: 'no', money: 'yes', access: 'no', threats: 'no', message: 'yes', crypto: 'no', ransom: 'no', sensitive: 'no' },
      category: 'financial-fraud',
      priority: 'immediate',
      guidanceAcknowledged: true,
      description: {
        mode: 'voice',
        text: 'Yesterday someone called me claiming to be from my bank and said my account would be blocked unless I shared an OTP. After I shared it, twenty thousand rupees were taken through UPI.',
        language: 'en',
        originalTranscript: 'yesterday someone called me claiming to be from my bank...',
        audioDurationSec: 41,
        transcriptProvider: 'demo',
      },
      incidentDetails: { 'ff-when': '2026-08-21T15:30', 'ff-amount': '20000', 'ff-bank': 'Demo Bank of India', 'ff-method': 'upi', 'ff-upi': 'victim@demobank', 'ff-txn': 'UPI-DEMO-448291' },
      evidence: [
        { id: 'ev-1', kind: 'screenshot', name: 'upi-receipt.png', size: 187000, mime: 'image/png' },
        { id: 'ev-2', kind: 'url', name: 'Suspicious link', url: 'https://example.com/fake-bank' },
      ],
      extraNotes: 'The caller knew my name and the last 4 digits of my card.',
    });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider>
        <SettingsProvider>
          <AuthProvider>
            <DraftProvider>
              <RouterProvider router={router} />
            </DraftProvider>
          </AuthProvider>
        </SettingsProvider>
      </I18nProvider>
    </StrictMode>,
  );
}

boot();
