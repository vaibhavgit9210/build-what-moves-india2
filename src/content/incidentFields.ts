/**
 * Category-specific incident form definitions rendered by ReportDetails.
 *
 * Design rules:
 * - Every category has at least 2 fields.
 * - Most fields are optional; the page only enforces the FIRST field of a
 *   category, and only when that field itself is not marked optional.
 * - Labels/hints/options are i18n keys (media.fields.* / media.opts.*;
 *   yes/no reuse common.*).
 */
import type { CategoryId } from '@/lib/types';

export interface IncidentField {
  id: string;
  /** 'platforms' renders the multi-select platform picker (draft.platforms). */
  type: 'text' | 'date' | 'datetime-local' | 'number' | 'select' | 'textarea' | 'url' | 'platforms';
  labelKey: string;
  hintKey?: string;
  optional?: boolean;
  options?: { value: string; labelKey: string }[];
  /**
   * Date/datetime fields only: offer "I do not know the exact date or time",
   * which swaps the input for a free-text "roughly when" note (stored under
   * `<id>:note`, with `<id>:unsure` = 'yes').
   */
  allowUnsure?: boolean;
}

const YES_NO_PARTIALLY = [
  { value: 'yes', labelKey: 'common.yes' },
  { value: 'no', labelKey: 'common.no' },
  { value: 'partially', labelKey: 'media.opts.partially' },
];

/** harassment and social-media-abuse share the same questions. */
const HARASSMENT_FIELDS: IncidentField[] = [
  { id: 'hr-platform', type: 'platforms', labelKey: 'media.fields.hrPlatform' },
  { id: 'hr-since', type: 'date', labelKey: 'media.fields.hrSince', optional: true, allowUnsure: true },
  { id: 'hr-what', type: 'textarea', labelKey: 'media.fields.hrWhat' },
];

export const incidentFieldsByCategory: Record<CategoryId, IncidentField[]> = {
  'financial-fraud': [
    { id: 'ff-when', type: 'datetime-local', labelKey: 'media.fields.ffWhen', allowUnsure: true },
    { id: 'ff-amount', type: 'number', labelKey: 'media.fields.ffAmount' },
    { id: 'ff-bank', type: 'text', labelKey: 'media.fields.ffBank', hintKey: 'media.fields.ffBankHint' },
    {
      id: 'ff-method',
      type: 'select',
      labelKey: 'media.fields.ffMethod',
      options: [
        { value: 'upi', labelKey: 'media.opts.upi' },
        { value: 'card', labelKey: 'media.opts.card' },
        { value: 'net-banking', labelKey: 'media.opts.netBanking' },
        { value: 'wallet', labelKey: 'media.opts.wallet' },
        { value: 'other', labelKey: 'media.opts.other' },
      ],
    },
    { id: 'ff-upi', type: 'text', labelKey: 'media.fields.ffUpi', optional: true },
    { id: 'ff-txn', type: 'text', labelKey: 'media.fields.ffTxn', hintKey: 'media.fields.ffTxnHint', optional: true },
    { id: 'ff-phone', type: 'text', labelKey: 'media.fields.ffPhone', optional: true },
    { id: 'ff-account', type: 'text', labelKey: 'media.fields.ffAccount', hintKey: 'media.fields.ffAccountHint', optional: true },
  ],

  'account-hacking': [
    { id: 'ah-platform', type: 'platforms', labelKey: 'media.fields.ahPlatform' },
    { id: 'ah-noticed', type: 'date', labelKey: 'media.fields.ahNoticed', allowUnsure: true },
    { id: 'ah-access', type: 'select', labelKey: 'media.fields.ahAccess', options: YES_NO_PARTIALLY },
    { id: 'ah-recovery', type: 'text', labelKey: 'media.fields.ahRecovery', optional: true },
    { id: 'ah-logins', type: 'textarea', labelKey: 'media.fields.ahLogins', optional: true },
  ],

  impersonation: [
    { id: 'im-platform', type: 'platforms', labelKey: 'media.fields.imPlatform' },
    { id: 'im-how', type: 'textarea', labelKey: 'media.fields.imHow' },
  ],

  phishing: [
    {
      id: 'ph-channel',
      type: 'select',
      labelKey: 'media.fields.phChannel',
      options: [
        { value: 'sms', labelKey: 'media.opts.sms' },
        { value: 'email', labelKey: 'media.opts.email' },
        { value: 'call', labelKey: 'media.opts.call' },
        { value: 'whatsapp', labelKey: 'media.opts.whatsapp' },
        { value: 'other', labelKey: 'media.opts.other' },
      ],
    },
    { id: 'ph-sender', type: 'text', labelKey: 'media.fields.phSender' },
    { id: 'ph-content', type: 'textarea', labelKey: 'media.fields.phContent', hintKey: 'media.fields.phContentHint', optional: true },
    {
      id: 'ph-clicked',
      type: 'select',
      labelKey: 'media.fields.phClicked',
      options: [
        { value: 'no', labelKey: 'media.opts.clickedNo' },
        { value: 'clicked-link', labelKey: 'media.opts.clickedLink' },
        { value: 'shared-details', labelKey: 'media.opts.sharedInfo' },
        { value: 'not-sure', labelKey: 'common.notSure' },
      ],
    },
  ],

  harassment: HARASSMENT_FIELDS,
  'social-media-abuse': HARASSMENT_FIELDS,

  ransomware: [
    { id: 'rw-device', type: 'text', labelKey: 'media.fields.rwDevice' },
    { id: 'rw-when', type: 'date', labelKey: 'media.fields.rwWhen', allowUnsure: true },
    { id: 'rw-demand', type: 'textarea', labelKey: 'media.fields.rwDemand' },
    {
      id: 'rw-paid',
      type: 'select',
      labelKey: 'media.fields.rwPaid',
      options: [
        { value: 'no', labelKey: 'common.no' },
        { value: 'yes', labelKey: 'common.yes' },
        { value: 'partially', labelKey: 'media.opts.partially' },
      ],
    },
  ],

  'crypto-fraud': [
    { id: 'cf-platform', type: 'text', labelKey: 'media.fields.cfPlatform' },
    { id: 'cf-wallet', type: 'text', labelKey: 'media.fields.cfWallet', optional: true },
    { id: 'cf-amount', type: 'number', labelKey: 'media.fields.cfAmount' },
    { id: 'cf-txn', type: 'text', labelKey: 'media.fields.cfTxn', optional: true },
  ],

  'identity-theft': [
    {
      id: 'it-what',
      type: 'select',
      labelKey: 'media.fields.itWhat',
      options: [
        { value: 'documents', labelKey: 'media.opts.docs' },
        { value: 'photos', labelKey: 'media.opts.photos' },
        { value: 'phone-number', labelKey: 'media.opts.phoneNumber' },
        { value: 'bank-details', labelKey: 'media.opts.bankDetails' },
        { value: 'other', labelKey: 'media.opts.other' },
      ],
    },
    { id: 'it-where', type: 'textarea', labelKey: 'media.fields.itWhere' },
  ],

  /** Kept minimal and gentle: everything optional. */
  'sensitive-content': [
    { id: 'sc-platform', type: 'platforms', labelKey: 'media.fields.scPlatform', optional: true },
    { id: 'sc-when', type: 'date', labelKey: 'media.fields.scWhen', optional: true, allowUnsure: true },
    { id: 'sc-more', type: 'textarea', labelKey: 'media.fields.scMore', hintKey: 'media.fields.scMoreHint', optional: true },
  ],

  other: [
    { id: 'ot-when', type: 'date', labelKey: 'media.fields.otWhen', optional: true, allowUnsure: true },
    { id: 'ot-what', type: 'textarea', labelKey: 'media.fields.otWhat', optional: true },
  ],
};
