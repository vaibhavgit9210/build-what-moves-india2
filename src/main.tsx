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
  //   ?e2e=anon   — seed the same draft as an ANONYMOUS journey (no login,
  //                 no identity step)
  //   ?e2e=chat     — seed a finished chat-intake conversation on #/chat
  //                   ("Review and submit" visible)
  //   ?e2e=chatform — same, already morphed into the pre-filled form
  const params = new URLSearchParams(window.location.search);
  const e2e = params.get('e2e');
  if (e2e === 'reset') clearAll();

  await seedDemoData();

  if (e2e === 'login' || e2e === 'draft') saveJSON(KEYS.session, 'u-rahul');
  if (e2e === 'draft' || e2e === 'anon') {
    saveJSON(KEYS.draft, {
      startedAt: new Date().toISOString(),
      lastPath: '/report/review',
      mode: e2e === 'anon' ? 'anonymous' : 'tracked',
      consent: { location: true, technical: true },
      location: {
        // The anon seed exercises the map-picker path.
        method: e2e === 'anon' ? 'map' : 'auto',
        address: {
          house: '221, 4th Block', street: '80 Feet Road', locality: 'Koramangala',
          city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pin: '560034',
        },
        ...(e2e === 'anon' ? { lat: 12.9352, lon: 77.6245 } : {}),
      },
      ...(e2e === 'anon'
        ? {}
        : {
            identity: {
              method: 'upload', docType: 'aadhaar', name: 'Rahul Sharma',
              idNumber: 'XXXX XXXX 1234', dob: '14 May 1998', fileName: 'aadhaar-front.jpg',
            },
          }),
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

  if (e2e === 'chat' || e2e === 'chatform') {
    saveJSON(KEYS.chat, {
      mode: 'anonymous',
      phase: e2e === 'chatform' ? 'form' : 'chat',
      messages: [
        { role: 'assistant', text: 'Tell me what happened, in your own words. Include anything you remember, like amounts, phone numbers, links or dates.' },
        { role: 'user', text: 'Yesterday evening someone called saying my bank account would be blocked unless I shared an OTP. I was worried and shared it, and 20,000 rupees went out through UPI to fraudpay@okbank.' },
        { role: 'assistant', text: 'You are doing the right thing by reporting this. Noted Amount lost: 20000; Payment method: UPI. From what you describe, this looks like Financial fraud (UPI, bank, OTP, cards). Did I get that right?' },
        { role: 'user', text: 'Yes' },
        { role: 'assistant', text: 'Next detail: Bank or wallet involved' },
        { role: 'user', text: 'Demo Bank of India' },
        { role: 'assistant', text: 'Noted Bank or wallet involved: Demo Bank of India. Which city and state should this report be routed to? For example "Bengaluru, Karnataka". You can also tap Skip.' },
        { role: 'user', text: 'Bengaluru, Karnataka' },
        { role: 'assistant', text: 'Do you have any proof, like screenshots, messages or receipts? You can attach files on the evidence page before submitting.' },
        { role: 'user', text: 'No' },
        { role: 'assistant', text: 'Thank you, I have what I need. Press "Review and submit" to check the filled form. Nothing is sent until you confirm it.' },
      ],
      extraction: {
        category: 'financial-fraud',
        categoryConfirmed: true,
        sentiment: 'anxious',
        urgent: true,
        description:
          'Yesterday evening someone called saying my bank account would be blocked unless I shared an OTP. I was worried and shared it, and 20,000 rupees went out through UPI to fraudpay@okbank.',
        details: {
          'ff-when:unsure': 'yes',
          'ff-when:note': 'yesterday evening',
          'ff-amount': '20000',
          'ff-bank': 'Demo Bank of India',
          'ff-method': 'upi',
          'ff-upi': 'fraudpay@okbank',
        },
        platforms: [],
        city: 'Bengaluru',
        state: 'Karnataka',
        hasEvidence: 'no',
      },
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
