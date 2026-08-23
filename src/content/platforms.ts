/**
 * Platforms for the multi-select "where did it happen" picker. Labels live
 * in the i18n media namespace as `media.platforms.<id>`.
 */
export const PLATFORM_IDS = [
  'whatsapp',
  'instagram',
  'facebook',
  'x',
  'telegram',
  'youtube',
  'email',
  'sms',
  'website',
  'other',
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export function platformLabelKey(id: string): string {
  return `media.platforms.${id}`;
}
