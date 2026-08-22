/**
 * Manual address fields for the report-location step. City, district, state
 * and PIN are required; the rest are optional. Validation lives in the page —
 * this component only renders controlled fields with any errors passed in.
 */
import { useI18n } from '@/i18n';
import { TextInput, Select } from '@/components/ui/Field';
import { INDIAN_STATES } from '@/services/geoService';
import type { Address } from '@/lib/types';

export type AddressErrors = Partial<Record<'city' | 'district' | 'state' | 'pin', string>>;

export default function AddressForm({
  value,
  onChange,
  errors,
}: {
  value: Address;
  onChange: (patch: Partial<Address>) => void;
  errors: AddressErrors;
}) {
  const { t } = useI18n();
  const opt = ` (${t('common.optional')})`;
  return (
    <div>
      <TextInput
        label={t('flow.location.house') + opt}
        value={value.house}
        onChange={(e) => onChange({ house: e.target.value })}
        autoComplete="address-line1"
      />
      <TextInput
        label={t('flow.location.street') + opt}
        value={value.street}
        onChange={(e) => onChange({ street: e.target.value })}
        autoComplete="address-line2"
      />
      <TextInput
        label={t('flow.location.locality') + opt}
        value={value.locality}
        onChange={(e) => onChange({ locality: e.target.value })}
        autoComplete="address-level3"
      />
      <TextInput
        label={t('flow.location.city')}
        value={value.city}
        onChange={(e) => onChange({ city: e.target.value })}
        error={errors.city}
        autoComplete="address-level2"
      />
      <TextInput
        label={t('flow.location.district')}
        value={value.district}
        onChange={(e) => onChange({ district: e.target.value })}
        error={errors.district}
      />
      <Select
        label={t('flow.location.state')}
        value={value.state}
        onChange={(e) => onChange({ state: e.target.value })}
        error={errors.state}
        autoComplete="address-level1"
      >
        <option value="">{t('flow.location.statePlaceholder')}</option>
        {INDIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <TextInput
        label={t('flow.location.pin')}
        hint={t('flow.location.pinHint')}
        value={value.pin}
        onChange={(e) => onChange({ pin: e.target.value })}
        error={errors.pin}
        inputMode="numeric"
        maxLength={6}
        autoComplete="postal-code"
        className="max-w-[10rem]"
      />
    </div>
  );
}
