/**
 * /report/identity — step 2. Upload / photograph an ID for simulated
 * extraction (review-and-edit), or enter details manually. Nothing leaves
 * the browser; nothing is verified against real records.
 */
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { useDraft } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { classifyDocument, type OcrError, type OcrResult } from '@/services/ocrService';
import { Button } from '@/components/ui/Button';
import { TextInput, Select } from '@/components/ui/Field';
import { Alert, Card, PageTitle, ProgressSteps, Spinner, ErrorSummary } from '@/components/ui/Misc';
import type { DocType, IdentityInfo } from '@/lib/types';

const THIS_PATH = '/report/identity';

const DOC_TYPES: DocType[] = [
  'aadhaar',
  'pan',
  'passport',
  'driving-licence',
  'voter-id',
  'ration-card',
  'other',
];

type Mode = 'idle' | 'checking' | 'detected' | 'form';

interface FieldErrors {
  docType?: string;
  name?: string;
  idNumber?: string;
}

export default function ReportIdentity() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, updateDraft } = useDraft();

  const saved = draft?.identity;
  const [mode, setMode] = useState<Mode>(saved ? 'form' : 'idle');
  const [method, setMethod] = useState<IdentityInfo['method']>(saved?.method ?? 'manual');
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [fileName, setFileName] = useState<string | undefined>(saved?.fileName);
  const [fileError, setFileError] = useState<OcrError | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const [docType, setDocType] = useState<DocType | ''>(saved?.docType ?? '');
  const [name, setName] = useState(saved?.name ?? user?.name ?? '');
  const [idNumber, setIdNumber] = useState(saved?.idNumber ?? '');
  const [dob, setDob] = useState(saved?.dob ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const photoInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);

  // Anonymous journeys have no identity step at all.
  if (draft?.mode === 'anonymous') return <Navigate to="/report/questions" replace />;

  if (!draft) return <Navigate to="/report" replace />;

  const handleFile = (file: File | undefined, m: 'photo' | 'upload') => {
    if (!file) return;
    setMethod(m);
    setFileName(file.name);
    setFileError(null);
    setOcr(null);
    setMode('checking');
    classifyDocument(file, user?.name)
      .then((res) => {
        setOcr(res);
        setDocType(res.docType);
        setName(res.name);
        setIdNumber(res.idNumber);
        setDob(res.dob);
        setShowEdit(false);
        setMode('detected');
      })
      .catch((e) => {
        setFileError(e as OcrError);
        setMode('form');
      });
  };

  const openManual = () => {
    setMethod('manual');
    setFileError(null);
    setMode('form');
  };

  const handleContinue = () => {
    const errs: FieldErrors = {};
    if (!docType)
      errs.docType = t('errors.requiredField', { field: t('flow.identity.fieldNames.docType') });
    if (!name.trim())
      errs.name = t('errors.requiredField', { field: t('flow.identity.fieldNames.name') });
    if (!idNumber.trim())
      errs.idNumber = t('errors.requiredField', { field: t('flow.identity.fieldNames.idNumber') });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    updateDraft({
      identity: {
        method,
        docType: docType as DocType,
        name: name.trim(),
        idNumber: idNumber.trim(),
        dob: dob.trim() || undefined,
        fileName,
      },
      lastPath: '/report/questions',
    });
    navigate(nextPath(THIS_PATH) ?? '/report/questions');
  };

  const errorList = Object.values(errors).filter((e): e is string => Boolean(e));
  const showForm = mode === 'form' || (mode === 'detected' && showEdit);
  const canContinue = mode === 'detected' || mode === 'form';

  const options: { key: string; label: string; hint: string; onClick: () => void }[] = [
    {
      key: 'photo',
      label: t('flow.identity.optionPhoto'),
      hint: t('flow.identity.optionPhotoHint'),
      onClick: () => photoInput.current?.click(),
    },
    {
      key: 'upload',
      label: t('flow.identity.optionUpload'),
      hint: t('flow.identity.optionUploadHint'),
      onClick: () => uploadInput.current?.click(),
    },
    {
      key: 'manual',
      label: t('flow.identity.optionManual'),
      hint: t('flow.identity.optionManualHint'),
      onClick: openManual,
    },
  ];

  return (
    <div className="max-w-2xl">
      <ProgressSteps />
      <PageTitle>{t('flow.identity.title')}</PageTitle>
      <p className="text-lg mb-4">{t('flow.identity.subtitle')}</p>

      <ErrorSummary errors={errorList} />

      <Alert variant="info">
        <p>{t('flow.identity.privacyNote')}</p>
      </Alert>

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          handleFile(e.target.files?.[0], 'photo');
          e.target.value = '';
        }}
      />
      <input
        ref={uploadInput}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          handleFile(e.target.files?.[0], 'upload');
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={o.onClick}
            disabled={mode === 'checking'}
            className="rounded-md border-2 border-border hc-border bg-page hover:bg-surface text-left p-4 min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block text-lg font-bold mb-1">{o.label}</span>
            <span className="block text-sm text-muted">{o.hint}</span>
          </button>
        ))}
      </div>

      {mode === 'checking' && <Spinner label={t('flow.identity.checking')} />}

      {fileError === 'unreadable' && (
        <Alert variant="warning" role="alert">
          <p>{t('flow.identity.unreadableError')}</p>
        </Alert>
      )}
      {fileError === 'too-large' && (
        <Alert variant="warning" role="alert">
          <p className="mb-3">{t('flow.identity.tooLargeError')}</p>
          <Button variant="secondary" onClick={() => uploadInput.current?.click()}>
            {t('flow.identity.tryAnotherFile')}
          </Button>
        </Alert>
      )}

      {mode === 'detected' && ocr && (
        <Card className="mb-6 bg-successbg border-success">
          <h2 className="text-xl font-bold mb-3">
            <span aria-hidden="true">✓ </span>
            {t('flow.identity.detectedTitle')}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-1 m-0 mb-3">
            {fileName && (
              <>
                <dt className="font-semibold text-sm text-muted">{t('flow.identity.fileLabel')}</dt>
                <dd className="m-0 mb-1 break-all">{fileName}</dd>
              </>
            )}
            <dt className="font-semibold text-sm text-muted">{t('flow.identity.docTypeLabel')}</dt>
            <dd className="m-0 mb-1">{t(`docTypes.${ocr.docType}`)}</dd>
            <dt className="font-semibold text-sm text-muted">{t('flow.identity.nameLabel')}</dt>
            <dd className="m-0 mb-1">{name}</dd>
            <dt className="font-semibold text-sm text-muted">{t('flow.identity.idNumberLabel')}</dt>
            <dd className="m-0 mb-1">{idNumber}</dd>
            <dt className="font-semibold text-sm text-muted">{t('flow.identity.dobLabel')}</dt>
            <dd className="m-0">{dob}</dd>
          </dl>
          <p className="font-semibold mb-1">{t('flow.identity.checkCarefully')}</p>
          <p className="text-sm text-muted mb-3">
            {t('flow.identity.autofilledNote', { pct: Math.round(ocr.confidence * 100) })}
          </p>
          <Button variant="secondary" onClick={() => setShowEdit((v) => !v)}>
            {t('flow.identity.editDetails')}
          </Button>
        </Card>
      )}

      {showForm && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-3">{t('flow.identity.formHeading')}</h2>
          <Select
            label={t('flow.identity.docTypeLabel')}
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType | '')}
            error={errors.docType}
          >
            <option value="">—</option>
            {DOC_TYPES.map((d) => (
              <option key={d} value={d}>
                {t(`docTypes.${d}`)}
              </option>
            ))}
          </Select>
          <TextInput
            label={t('flow.identity.nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />
          <TextInput
            label={t('flow.identity.idNumberLabel')}
            hint={t('flow.identity.idNumberHint')}
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            error={errors.idNumber}
          />
          <TextInput
            label={`${t('flow.identity.dobLabel')} (${t('common.optional')})`}
            hint={t('flow.identity.dobHint')}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </section>
      )}

      {canContinue && (
        <Button onClick={handleContinue} fullWidth className="sm:w-auto">
          {t('common.continue')}
        </Button>
      )}

      <p className="mt-6">
        <Link
          to={prevPath(THIS_PATH) ?? '/report/location'}
          className="text-link underline underline-offset-4"
        >
          <span aria-hidden="true">← </span>
          {t('common.back')}
        </Link>
      </p>
    </div>
  );
}
