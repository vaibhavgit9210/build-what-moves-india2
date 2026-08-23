/**
 * /report/location — step 1. Consent-first location detection (never
 * automatic), manual address entry, a clearly-labeled demo-city picker, and
 * an optional technical-information consent.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { nextPath } from '@/lib/steps';
import { detectLocation, reverseGeocode, DEMO_CITIES, type GeoError } from '@/services/geoService';
import { getTechnicalInfo } from '@/services/deviceService';
import { Button } from '@/components/ui/Button';
import { Select, Checkbox } from '@/components/ui/Field';
import { Alert, Card, PageTitle, ProgressSteps, Spinner, ErrorSummary } from '@/components/ui/Misc';
import AddressForm, { type AddressErrors } from '@/components/report/AddressForm';
import type { Address, LocationInfo } from '@/lib/types';

// Leaflet only ships to browsers that open the map.
const LocationMap = lazy(() => import('@/components/report/LocationMap'));

const THIS_PATH = '/report/location';

const EMPTY_ADDRESS: Address = {
  house: '',
  street: '',
  locality: '',
  city: '',
  district: '',
  state: '',
  pin: '',
};

export default function ReportLocation() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { draft, startDraft, updateDraft } = useDraft();

  // First step of the journey: create the draft if it doesn't exist yet.
  useEffect(() => {
    if (!draft) startDraft();
  }, [draft, startDraft]);

  const saved = draft?.location;
  const [address, setAddress] = useState<Address>(saved?.address ?? EMPTY_ADDRESS);
  const [autoLoc, setAutoLoc] = useState<LocationInfo | null>(
    saved?.method === 'auto' ? saved : null,
  );
  const [showManual, setShowManual] = useState(saved?.method === 'manual');
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<GeoError | null>(null);
  const [demoCity, setDemoCity] = useState('');
  const [errors, setErrors] = useState<AddressErrors>({});
  const [techConsent, setTechConsent] = useState(draft?.consent.technical ?? false);
  const [showMap, setShowMap] = useState(saved?.method === 'map');
  const [mapPin, setMapPin] = useState<{ lat: number; lon: number } | null>(
    saved?.method === 'map' && saved.lat != null && saved.lon != null
      ? { lat: saved.lat, lon: saved.lon }
      : null,
  );
  const [mapPlace, setMapPlace] = useState('');

  const tech = useMemo(() => (techConsent ? getTechnicalInfo(true) : null), [techConsent]);

  const patchAddress = (patch: Partial<Address>) => setAddress((a) => ({ ...a, ...patch }));

  const handleDetect = () => {
    setGeoError(null);
    setDetecting(true);
    detectLocation()
      .then((loc) => {
        setAutoLoc(loc);
        setAddress(loc.address);
        setShowManual(false);
      })
      .catch((e: GeoError) => {
        setGeoError(e);
        setShowManual(true);
      })
      .finally(() => setDetecting(false));
  };

  const handleDemoCity = (id: string) => {
    setDemoCity(id);
    const city = DEMO_CITIES.find((c) => c.id === id);
    if (!city) return;
    setAddress(city.location.address);
    setAutoLoc(null);
    setGeoError(null);
    setShowManual(true);
  };

  const handleMapPick = (lat: number, lon: number) => {
    const city = reverseGeocode(lat, lon);
    const a = city.location.address;
    setMapPin({ lat, lon });
    setMapPlace(`${a.city}, ${a.state}`);
    // A pin gives the area, not the house: fill the area fields, leave the
    // rest for the user, and open the form so they can check and complete it.
    setAddress({
      ...EMPTY_ADDRESS,
      city: a.city,
      district: a.district,
      state: a.state,
      pin: a.pin,
    });
    setAutoLoc(null);
    setGeoError(null);
    setShowManual(true);
  };

  const handleEditAddress = () => {
    // Switching to manual editing: the detected coordinates no longer describe
    // the address the user will type, so drop them entirely.
    if (autoLoc) setAddress(autoLoc.address);
    setAutoLoc(null);
    setShowManual(true);
  };

  const showDetectedCard = autoLoc !== null && !showManual;
  const canContinue = showDetectedCard || showManual;

  const anonymous = draft?.mode === 'anonymous';

  const handleContinue = () => {
    let finalAddress: Address;
    let method: LocationInfo['method'];
    if (showDetectedCard && autoLoc) {
      finalAddress = autoLoc.address;
      method = 'auto';
    } else {
      const errs: AddressErrors = {};
      if (!address.city.trim())
        errs.city = t('errors.requiredField', { field: t('flow.location.fieldNames.city') });
      if (!address.district.trim())
        errs.district = t('errors.requiredField', { field: t('flow.location.fieldNames.district') });
      if (!address.state)
        errs.state = t('errors.requiredField', { field: t('flow.location.fieldNames.state') });
      if (!address.pin.trim())
        errs.pin = t('errors.requiredField', { field: t('flow.location.fieldNames.pin') });
      else if (!/^\d{6}$/.test(address.pin.trim())) errs.pin = t('errors.invalidPin');
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      finalAddress = { ...address, pin: address.pin.trim() };
      method = mapPin ? 'map' : 'manual';
    }
    updateDraft({
      location: {
        method,
        address: finalAddress,
        ...(method === 'auto' && autoLoc ? { lat: autoLoc.lat, lon: autoLoc.lon } : {}),
        ...(method === 'map' && mapPin ? { lat: mapPin.lat, lon: mapPin.lon } : {}),
      },
      consent: { ...(draft?.consent ?? {}), location: method === 'auto', technical: techConsent },
      lastPath: nextPath(THIS_PATH, anonymous) ?? '/report/identity',
    });
    navigate(nextPath(THIS_PATH, anonymous) ?? '/report/identity');
  };

  const errorList = Object.values(errors).filter((e): e is string => Boolean(e));

  const addressRows: { key: keyof Address; labelKey: string }[] = [
    { key: 'house', labelKey: 'flow.location.house' },
    { key: 'street', labelKey: 'flow.location.street' },
    { key: 'locality', labelKey: 'flow.location.locality' },
    { key: 'city', labelKey: 'flow.location.city' },
    { key: 'district', labelKey: 'flow.location.district' },
    { key: 'state', labelKey: 'flow.location.state' },
    { key: 'pin', labelKey: 'flow.location.pin' },
  ];

  return (
    <div className="max-w-2xl">
      <ProgressSteps />
      <PageTitle>{t('flow.location.title')}</PageTitle>

      <ErrorSummary errors={errorList} />

      <p className="text-lg mb-1">{t('flow.location.why')}</p>
      <p className="text-muted mb-5">{t('flow.location.consentNote')}</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Button onClick={handleDetect} disabled={detecting}>
          {t('flow.location.useMyLocation')}
        </Button>
        <Button variant="secondary" onClick={() => setShowMap((s) => !s)} aria-expanded={showMap}>
          {t('flow.location.mapToggle')}
        </Button>
        {!showManual && (
          <Button variant="secondary" onClick={handleEditAddress}>
            {t('flow.location.enterManually')}
          </Button>
        )}
      </div>

      {showMap && (
        <section className="mb-6">
          <p className="text-muted mb-2">{t('flow.location.mapIntro')}</p>
          <Suspense fallback={<Spinner />}>
            <LocationMap lat={mapPin?.lat} lon={mapPin?.lon} onPick={handleMapPick} />
          </Suspense>
          {/* Persistent live region so pin drops are announced. */}
          <p role="status" className={mapPlace ? 'mt-2 font-medium' : 'sr-only'}>
            {mapPlace
              ? `${t('common.demoData')}: ${t('flow.location.mapPicked', { place: mapPlace })}`
              : ''}
          </p>
          <p className="text-sm text-muted mt-2">{t('flow.location.mapKeyboardNote')}</p>
        </section>
      )}

      {/* Persistent live region: always mounted so screen readers announce the
          text change; the visual spinner below is decorative. */}
      <p role="status" className="sr-only">
        {detecting ? t('flow.location.detecting') : ''}
      </p>
      {detecting && (
        <div aria-hidden="true">
          <Spinner label={t('flow.location.detecting')} />
        </div>
      )}

      {geoError && (
        <Alert variant="warning" title={t('flow.location.geoErrorTitle')} role="alert">
          <p>{t('flow.location.geoErrorBody')}</p>
        </Alert>
      )}

      {showDetectedCard && autoLoc && (
        <>
          <Alert variant="success" title={t('flow.location.detectedTitle')} role="status">
            <p>{t('flow.location.detectedBody')}</p>
          </Alert>
          <Card className="mb-5">
            <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-1 m-0">
              {addressRows
                .filter((r) => autoLoc.address[r.key])
                .map((r) => (
                  <div key={r.key} className="sm:contents">
                    <dt className="font-semibold text-sm text-muted">{t(r.labelKey)}</dt>
                    <dd className="m-0 mb-2 sm:mb-1">{autoLoc.address[r.key]}</dd>
                  </div>
                ))}
            </dl>
            <Button variant="secondary" onClick={handleEditAddress} className="mt-3">
              {t('flow.location.editAddress')}
            </Button>
          </Card>
        </>
      )}

      <div className="mb-6">
        <Select
          label={t('flow.location.demoHeading')}
          hint={`${t('common.demoData')}: ${t('flow.location.demoHint')}`}
          value={demoCity}
          onChange={(e) => handleDemoCity(e.target.value)}
        >
          <option value="">{t('flow.location.demoPlaceholder')}</option>
          {DEMO_CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.location.address.city}, {c.location.address.state}
            </option>
          ))}
        </Select>
      </div>

      {showManual && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-3">{t('flow.location.addressHeading')}</h2>
          <AddressForm value={address} onChange={patchAddress} errors={errors} />
        </section>
      )}

      <section className="mb-8 border-t-2 border-border pt-5">
        <h2 className="text-xl font-bold mb-2">{t('flow.location.techHeading')}</h2>
        <p className="text-muted mb-3">{t('flow.location.techBody')}</p>
        <Checkbox
          label={t('flow.location.techConsent')}
          checked={techConsent}
          onChange={setTechConsent}
        />
        {tech && (
          <Card className="bg-surface">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted mb-2">
              {t('common.demoData')}
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-1 m-0 text-sm">
              <dt className="font-semibold">{t('flow.location.techDevice')}</dt>
              <dd className="m-0 mb-1">{tech.device}</dd>
              <dt className="font-semibold">{t('flow.location.techBrowser')}</dt>
              <dd className="m-0 mb-1">{tech.browser}</dd>
              <dt className="font-semibold">{t('flow.location.techIp')}</dt>
              <dd className="m-0 mb-1">{tech.approxIp}</dd>
              <dt className="font-semibold">{t('flow.location.techSession')}</dt>
              <dd className="m-0">{tech.sessionId}</dd>
            </dl>
          </Card>
        )}
      </section>

      {canContinue && (
        <Button onClick={handleContinue} fullWidth className="sm:w-auto">
          {t('common.continue')}
        </Button>
      )}

      <p className="mt-6">
        <Link to="/report" className="text-link underline underline-offset-4">
          <span aria-hidden="true">← </span>
          {t('common.back')}
        </Link>
      </p>
    </div>
  );
}
